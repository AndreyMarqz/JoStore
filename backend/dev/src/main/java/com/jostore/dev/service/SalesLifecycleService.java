package com.jostore.dev.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import com.jostore.dev.repository.*;
import com.jostore.dev.model.order.*;
import com.jostore.dev.model.enums.*;
import com.jostore.dev.model.coupon.Coupon;
import com.jostore.dev.dto.responses.OrderResponseDto;
import com.jostore.dev.exception.*;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;

@Service
public class SalesLifecycleService {
    public record ExchangeItem(@NotNull UUID orderItemId,@Min(1) int quantity) {}
    public record ExchangeRequest(@NotEmpty List<@Valid ExchangeItem> items) {}
    public record ReceiptItem(@NotNull UUID orderItemId,@NotNull Boolean restock) {}
    public record ReceiptRequest(@NotEmpty List<@Valid ReceiptItem> items) {}
    private final SalesRepository sales;
    private final PurchaseOrderRepository orders;
    private final CouponRepository coupons;
    private final InventoryRepository inventory;
    private final OrderService mapper;
    private final SalesClock clock;
    public SalesLifecycleService(SalesRepository sales,PurchaseOrderRepository orders,CouponRepository coupons,
        InventoryRepository inventory,OrderService mapper,SalesClock clock) {
        this.sales=sales;this.orders=orders;this.coupons=coupons;this.inventory=inventory;this.mapper=mapper;this.clock=clock;
    }
    private PurchaseOrder order(UUID id) { return orders.findById(id).orElseThrow(()->new ResourceNotFoundException("Pedido não encontrado.")); }
    private OrderResponseDto response(PurchaseOrder order) { return mapper.toOrderResponse(order,order.getGeneratedCoupon()); }
    @Transactional(readOnly=true)
    public Page<OrderResponseDto> list(UUID customer,String status,String code,int page,int size) {
        if(page<0 || size<1 || size>100) throw new BusinessRuleException("Paginação inválida.");
        OrderStatusEnum state=status==null || status.isBlank()?null:parseStatus(status);
        return orders.search(customer,state,code==null?"":code,PageRequest.of(page,size,Sort.by("createdAt").descending())).map(this::response);
    }
    private OrderStatusEnum parseStatus(String status) {
        try { return OrderStatusEnum.valueOf(status); } catch(IllegalArgumentException e) { throw new BusinessRuleException("Status de pedido inválido."); }
    }
    @Transactional(readOnly=true)
    public OrderResponseDto get(UUID id,UUID customer) {
        PurchaseOrder o=order(id);
        if(customer!=null && !customer.equals(o.getCustomer().getId())) throw new ResourceNotFoundException("Pedido não encontrado para este cliente.");
        return response(o);
    }
    @Transactional
    public OrderResponseDto transition(UUID id,boolean dispatch) {
        sales.lock(); PurchaseOrder o=order(id);
        change(o, dispatch?OrderStatusEnum.APROVADA:OrderStatusEnum.EM_TRANSPORTE,
            dispatch?OrderStatusEnum.EM_TRANSPORTE:OrderStatusEnum.ENTREGUE,"ADMINISTRADOR",dispatch?"Pedido despachado.":"Entrega confirmada.");
        return response(o);
    }
    private void change(PurchaseOrder o,OrderStatusEnum expected,OrderStatusEnum next,String actor,String description) {
        o.transitionTo(expected,next);
        sales.history(o.getId(),expected.name(),next.name(),actor,description,clock.now());
    }
    public List<UUID> pending() {
        return sales.jdbc().queryForList("SELECT ped_id FROM pedidos WHERE ped_status='EM_PROCESSAMENTO' AND ped_created_at < CURRENT_TIMESTAMP - interval '2 seconds' ORDER BY ped_created_at LIMIT 50",UUID.class);
    }
    @Transactional
    public void expireCarts() { sales.lock(); sales.expire(clock.now()); }
    @Transactional
    public void process(UUID id) {
        sales.lock();
        PurchaseOrder o=order(id);
        if(o.getStatus()!=OrderStatusEnum.EM_PROCESSAMENTO) return;
        var productQuantities=new TreeMap<UUID,Integer>();
        o.getItems().forEach(i->productQuantities.merge(i.getProduct().getId(),i.getQuantity(),Integer::sum));
        boolean approved=o.getPayments().stream().noneMatch(p->"0000".equals(p.getLast4()));
        String reason=approved?"Pagamento validado.":"Pagamento recusado pela operadora simulada.";
        for(var c:o.getCoupons()) {
            if(!c.getCoupon().isActive() || (c.getCoupon().getCustomer()!=null && !c.getCoupon().getCustomer().getId().equals(o.getCustomer().getId()))) {
                approved=false;reason="Cupom inválido ou indisponível na validação do pagamento.";
            }
        }
        Integer expired=sales.jdbc().queryForObject("SELECT count(*) FROM reservas_estoque WHERE order_id=? AND expires_at<=?",Integer.class,id,Timestamp.from(clock.now()));
        if(expired>0) { approved=false;reason="Prazo de bloqueio encerrado antes da aprovação."; }
        for(var entry:productQuantities.entrySet()) {
            sales.jdbc().queryForList("SELECT est_id FROM estoques WHERE est_pro_id=? FOR UPDATE",entry.getKey());
            var stock=inventory.findByProductId(entry.getKey()).orElseThrow(()->new BusinessRuleException("Estoque não encontrado."));
            if(stock.getAvailableQuantity()<entry.getValue()) { approved=false;reason="Estoque indisponível na validação do pedido."; }
        }
        if(approved) {
            productQuantities.forEach((product,quantity)->{
                var stock=inventory.findByProductId(product).orElseThrow(); int before=stock.getAvailableQuantity();stock.decrease(quantity);
                sales.audit(null,"UPDATE","ESTOQUE","SISTEMA pedido "+id+" produto "+product+": "+before+" → "+stock.getAvailableQuantity(),clock.now());
            });
            BigDecimal couponTotal=BigDecimal.ZERO;
            for(var entry:o.getCoupons()) {
                var coupon=entry.getCoupon();coupon.use();couponTotal=couponTotal.add(coupon.getValue());
                sales.audit(o.getCustomer().getId(),"UPDATE","CUPOM","Cupom consumido "+coupon.getCode()+" no pedido "+id,clock.now());
            }
            BigDecimal difference=couponTotal.subtract(o.getSubtotal().add(o.getShipping()));
            if(difference.signum()>0) o.recordGeneratedCoupon(issueCoupon(o,difference,"Diferença de cupons do pedido "+o.getCode()));
        }
        change(o,OrderStatusEnum.EM_PROCESSAMENTO,approved?OrderStatusEnum.APROVADA:OrderStatusEnum.REPROVADA,"SISTEMA",reason);
        sales.releaseOrder(id);
    }
    private Coupon issueCoupon(PurchaseOrder o,BigDecimal value,String description) {
        var c=coupons.saveAndFlush(new Coupon("TROCA-"+UUID.randomUUID().toString().substring(0,18).toUpperCase(),CouponTypeEnum.TROCA,value,description,o.getCustomer()));
        sales.audit(o.getCustomer().getId(),"INSERT","CUPOM",description+"; código "+c.getCode()+"; valor "+value,clock.now());
        return c;
    }
    @Transactional
    public Map<String,Object> requestExchange(UUID customer,UUID orderId,ExchangeRequest request) {
        sales.lock(); PurchaseOrder o=order(orderId);
        if(!o.getCustomer().getId().equals(customer)) throw new ResourceNotFoundException("Pedido não encontrado para este cliente.");
        if(o.getStatus()!=OrderStatusEnum.ENTREGUE) throw new BusinessRuleException("Somente pedidos ENTREGUE permitem solicitar troca.");
        if(request.items().stream().map(ExchangeItem::orderItemId).distinct().count()!=request.items().size()) throw new BusinessRuleException("Item repetido na solicitação de troca.");
        int total=0;
        for(var item:request.items()) {
            var original=o.getItems().stream().filter(i->i.getId().equals(item.orderItemId())).findFirst().orElseThrow(()->new BusinessRuleException("Item não pertence ao pedido."));
            int exchanged=sales.jdbc().queryForObject("SELECT COALESCE(sum(quantity),0)::integer FROM itens_troca WHERE order_item_id=?",Integer.class,item.orderItemId());
            if(item.quantity()<=0 || item.quantity()+exchanged>original.getQuantity()) throw new BusinessRuleException("Quantidade de troca excede os itens disponíveis do pedido.");
            total+=item.quantity();
        }
        boolean full=total==o.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
        UUID id=UUID.randomUUID();
        sales.jdbc().update("INSERT INTO trocas(id,order_id,customer_id,status,full_order,created_at) VALUES (?,?,?,'EM_TROCA',?,?)",id,orderId,customer,full,Timestamp.from(clock.now()));
        for(var item:request.items()) sales.jdbc().update("INSERT INTO itens_troca(id,exchange_id,order_item_id,quantity) VALUES (?,?,?,?)",UUID.randomUUID(),id,item.orderItemId(),item.quantity());
        if(full) change(o,OrderStatusEnum.ENTREGUE,OrderStatusEnum.EM_TROCA,"CLIENTE:"+customer,"Troca integral solicitada.");
        sales.audit(customer,"INSERT","TROCA","Troca "+id+" pedido "+orderId+" itens "+request.items(),clock.now());
        return exchange(id);
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> exchanges(UUID customer,String status) {
        return sales.jdbc().queryForList("SELECT id FROM trocas WHERE (?::uuid IS NULL OR customer_id=?::uuid) AND (?::varchar IS NULL OR status=?::varchar) ORDER BY created_at DESC LIMIT 100",customer,customer,status,status)
            .stream().map(r->exchange((UUID)r.get("id"))).toList();
    }
    private Map<String,Object> exchange(UUID id) {
        var rows=sales.jdbc().queryForList("SELECT t.id,order_id AS \"orderId\",customer_id AS \"customerId\",status,full_order AS \"fullOrder\",created_at AS \"createdAt\",coupon_id AS \"couponId\",p.ped_codigo AS \"orderCode\" FROM trocas t JOIN pedidos p ON p.ped_id=t.order_id WHERE t.id=?",id);
        if(rows.isEmpty()) throw new ResourceNotFoundException("Troca não encontrada.");
        var result=rows.getFirst();
        result.put("items",sales.jdbc().queryForList("SELECT t.order_item_id AS \"orderItemId\",t.quantity,t.restock,i.ipe_nome_produto AS name,i.ipe_tamanho AS size,i.ipe_preco_unitario AS \"unitPrice\" FROM itens_troca t JOIN itens_pedido i ON i.ipe_id=t.order_item_id WHERE t.exchange_id=?",id));
        return result;
    }
    @Transactional
    public Map<String,Object> authorize(UUID id) {
        sales.lock();var ex=exchange(id);
        if(!"EM_TROCA".equals(ex.get("status"))) throw new BusinessRuleException("Somente trocas EM TROCA podem ser autorizadas.");
        sales.jdbc().update("UPDATE trocas SET status='TROCA_AUTORIZADA',authorized_at=? WHERE id=?",Timestamp.from(clock.now()),id);
        sales.jdbc().update("INSERT INTO notificacoes(id,customer_id,exchange_id,message,created_at) VALUES (?,?,?,?,?)",UUID.randomUUID(),ex.get("customerId"),id,"A troca do pedido "+ex.get("orderCode")+" foi autorizada. Envie os itens para devolução.",Timestamp.from(clock.now()));
        if(Boolean.TRUE.equals(ex.get("fullOrder"))) change(order((UUID)ex.get("orderId")),OrderStatusEnum.EM_TROCA,OrderStatusEnum.TROCA_AUTORIZADA,"ADMINISTRADOR","Troca autorizada.");
        sales.audit(null,"UPDATE","TROCA","ADMINISTRADOR autorizou "+id+"; notificação enviada ao cliente "+ex.get("customerId"),clock.now());
        return exchange(id);
    }
    @Transactional
    public Map<String,Object> receive(UUID id,ReceiptRequest request) {
        sales.lock();var ex=exchange(id);
        if(!"TROCA_AUTORIZADA".equals(ex.get("status"))) throw new BusinessRuleException("Somente trocas TROCA AUTORIZADA permitem confirmar recebimento.");
        var rows=sales.jdbc().queryForList("SELECT t.order_item_id,t.quantity,i.ipe_pro_id,i.ipe_preco_unitario FROM itens_troca t JOIN itens_pedido i ON i.ipe_id=t.order_item_id WHERE t.exchange_id=?",id);
        var decisions=new HashMap<UUID,Boolean>();
        for(var item:request.items()) if(decisions.put(item.orderItemId(),item.restock())!=null) throw new BusinessRuleException("Item repetido na confirmação.");
        if(decisions.size()!=rows.size() || rows.stream().anyMatch(r->!decisions.containsKey(r.get("order_item_id")))) throw new BusinessRuleException("Informe a decisão de reentrada para todos os itens da troca.");
        BigDecimal value=BigDecimal.ZERO;
        for(var row:rows) {
            UUID item=(UUID)row.get("order_item_id");int quantity=((Number)row.get("quantity")).intValue();
            value=value.add(((BigDecimal)row.get("ipe_preco_unitario")).multiply(BigDecimal.valueOf(quantity)));
            if(decisions.get(item)) {
                var stock=inventory.findByProductId((UUID)row.get("ipe_pro_id")).orElseThrow();int before=stock.getAvailableQuantity(); stock.increase(quantity);
                sales.audit(null,"UPDATE","ESTOQUE","ADMINISTRADOR troca "+id+" item "+item+": "+before+" → "+stock.getAvailableQuantity(),clock.now());
            }
            sales.jdbc().update("UPDATE itens_troca SET restock=? WHERE exchange_id=? AND order_item_id=?",decisions.get(item),id,item);
        }
        var o=order((UUID)ex.get("orderId"));
        Coupon coupon=issueCoupon(o,value,"Recebimento da troca do pedido "+o.getCode());
        sales.jdbc().update("UPDATE trocas SET status='TROCADO',received_at=?,coupon_id=? WHERE id=?",Timestamp.from(clock.now()),coupon.getId(),id);
        if(Boolean.TRUE.equals(ex.get("fullOrder"))) change(o,OrderStatusEnum.TROCA_AUTORIZADA,OrderStatusEnum.TROCADO,"ADMINISTRADOR","Recebimento da troca confirmado.");
        sales.audit(null,"UPDATE","TROCA","ADMINISTRADOR recebeu "+id+"; decisões "+request.items()+"; cupom "+coupon.getCode(),clock.now());
        return exchange(id);
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> notifications(UUID customer) {
        return sales.jdbc().queryForList("SELECT id,message,created_at AS \"createdAt\",read_at AS \"readAt\" FROM notificacoes WHERE customer_id=? ORDER BY created_at DESC LIMIT 100",customer);
    }
    @Transactional
    public void readNotification(UUID customer,UUID id) {
        if(sales.jdbc().update("UPDATE notificacoes SET read_at=COALESCE(read_at,?) WHERE id=? AND customer_id=?",Timestamp.from(clock.now()),id,customer)!=1) throw new ResourceNotFoundException("Notificação não encontrada.");
        sales.audit(customer,"UPDATE","NOTIFICACAO","Leitura da notificação "+id,clock.now());
    }
}
