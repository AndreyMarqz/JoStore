package com.jostore.dev.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jostore.dev.dto.requests.CardPaymentRequestDto;
import com.jostore.dev.dto.requests.CartItemRequestDto;
import com.jostore.dev.dto.requests.CreateOrderRequestDto;
import com.jostore.dev.dto.requests.OrderQuoteRequestDto;
import com.jostore.dev.dto.responses.AddressResponseDto;
import com.jostore.dev.dto.responses.CartItemResponseDto;
import com.jostore.dev.dto.responses.CartResponseDto;
import com.jostore.dev.dto.responses.CouponResponseDto;
import com.jostore.dev.dto.responses.OrderPaymentResponseDto;
import com.jostore.dev.dto.responses.OrderQuoteResponseDto;
import com.jostore.dev.dto.responses.OrderResponseDto;
import com.jostore.dev.dto.responses.ProductResponseDto;
import com.jostore.dev.exception.BusinessRuleException;
import com.jostore.dev.exception.ResourceNotFoundException;
import com.jostore.dev.model.address.Address;
import com.jostore.dev.model.audit.OperationLog;
import com.jostore.dev.model.cart.CartItem;
import com.jostore.dev.model.cart.ShoppingCart;
import com.jostore.dev.model.coupon.Coupon;
import com.jostore.dev.model.creditCards.CreditCard;
import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.CouponTypeEnum;
import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.order.OrderCoupon;
import com.jostore.dev.model.order.OrderItem;
import com.jostore.dev.model.order.OrderPayment;
import com.jostore.dev.model.order.PurchaseOrder;
import com.jostore.dev.model.product.Inventory;
import com.jostore.dev.model.product.Product;
import com.jostore.dev.repository.AddressRepository;
import com.jostore.dev.repository.CartItemRepository;
import com.jostore.dev.repository.CouponRepository;
import com.jostore.dev.repository.CreditCardRepository;
import com.jostore.dev.repository.CustomerRepository;
import com.jostore.dev.repository.InventoryRepository;
import com.jostore.dev.repository.OperationLogRepository;
import com.jostore.dev.repository.ProductRepository;
import com.jostore.dev.repository.PurchaseOrderRepository;
import com.jostore.dev.repository.ShoppingCartRepository;

@Service
public class OrderService {
    private static final BigDecimal FRETE_BASE = new BigDecimal("15.00");
    private static final BigDecimal FRETE_POR_PECA = new BigDecimal("2.00");
    private static final BigDecimal ADICIONAL_FORA_SP = new BigDecimal("10.00");
    private static final BigDecimal DEZ_REAIS = new BigDecimal("10.00");

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final CreditCardRepository creditCardRepository;
    private final CouponRepository couponRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OperationLogRepository operationLogRepository;
    private final com.jostore.dev.repository.SalesRepository sales;
    private final SalesClock clock;
    @org.springframework.beans.factory.annotation.Value("${jostore.cart.reservation-seconds:600}")
    private long reservationSeconds;

    public OrderService(CustomerRepository customerRepository, ProductRepository productRepository,
            InventoryRepository inventoryRepository, ShoppingCartRepository shoppingCartRepository,
            CartItemRepository cartItemRepository, AddressRepository addressRepository,
            CreditCardRepository creditCardRepository, CouponRepository couponRepository,
            PurchaseOrderRepository purchaseOrderRepository, OperationLogRepository operationLogRepository,
            com.jostore.dev.repository.SalesRepository sales, SalesClock clock) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.shoppingCartRepository = shoppingCartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.creditCardRepository = creditCardRepository;
        this.couponRepository = couponRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.operationLogRepository = operationLogRepository;
        this.sales = sales;
        this.clock = clock;
    }

    @Transactional
    public CartResponseDto getCart(UUID customerId) {
        sales.lock(); sales.expire(clock.now());
        Customer customer = findCustomer(customerId);
        return toCartResponse(shoppingCartRepository.findByCustomerId(customer.getId()).orElse(null));
    }

    @Transactional(readOnly = true)
    public List<CouponResponseDto> listAvailableCoupons(UUID customerId) {
        findCustomer(customerId);
        return couponRepository.findAvailableForCustomer(customerId).stream()
                .map(this::toCouponResponse)
                .toList();
    }

    @Transactional
    public CartResponseDto addItem(UUID customerId, CartItemRequestDto request) {
        sales.lock(); sales.expire(clock.now());
        Customer customer = findCustomer(customerId);
        Product product = findProduct(request.productId());
        ShoppingCart cart = shoppingCartRepository.findByCustomerId(customerId)
                .orElseGet(() -> shoppingCartRepository.save(new ShoppingCart(customer)));
        String size = normalizedSize(request.size());
        CartItem item = cartItemRepository.findByCartIdAndProductIdAndSize(cart.getId(), product.getId(), size)
                .orElse(null);
        int targetQuantity = request.quantity() + (item == null ? 0 : item.getQuantity());
        int otherSizes = cart.getItems().stream().filter(i -> i.getProduct().getId().equals(product.getId()) && !i.getSize().equals(size)).mapToInt(CartItem::getQuantity).sum();
        validateAvailableQuantity(product, targetQuantity + otherSizes, cart.getId());
        if (item == null)
            cart.addItem(new CartItem(product, size, request.quantity()));
        else
            item.changeQuantity(targetQuantity);
        shoppingCartRepository.saveAndFlush(cart);
        var expires = clock.now().plusSeconds(reservationSeconds);
        sales.reserve(cart.getId(), product.getId(), targetQuantity + otherSizes, expires);
        sales.renew(cart.getId(), expires);
        sales.jdbc().update("DELETE FROM itens_carrinho_removidos WHERE cart_id=? AND product_id=?",cart.getId(),product.getId());
        operationLogRepository.save(new OperationLog(customerId, "INSERT", "ITEM_CARRINHO",
                "Produto " + product.getCode() + ", tamanho " + size + ", quantidade " + targetQuantity));
        return toCartResponse(cart);
    }

    @Transactional
    public CartResponseDto changeItemQuantity(UUID customerId, UUID itemId, CartItemRequestDto request) {
        sales.lock(); sales.expire(clock.now());
        CartItem item = cartItemRepository.findByIdAndCartCustomerId(itemId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado."));
        if (!item.getProduct().getId().equals(request.productId())
                || !item.getSize().equals(normalizedSize(request.size()))) {
            throw new BusinessRuleException("Produto e tamanho do item do carrinho não podem ser alterados.");
        }
        int others = item.getCart().getItems().stream().filter(i -> !i.getId().equals(itemId) && i.getProduct().getId().equals(item.getProduct().getId())).mapToInt(CartItem::getQuantity).sum();
        validateAvailableQuantity(item.getProduct(), request.quantity()+others,item.getCart().getId());
        item.changeQuantity(request.quantity());
        sales.reserve(item.getCart().getId(), item.getProduct().getId(), request.quantity()+others, sales.expires(item.getCart().getId()));
        operationLogRepository.save(new OperationLog(customerId, "UPDATE", "ITEM_CARRINHO",
                "Item " + itemId + ", quantidade " + request.quantity()));
        return toCartResponse(item.getCart());
    }

    @Transactional
    public void removeItem(UUID customerId, UUID itemId) {
        sales.lock(); sales.expire(clock.now());
        CartItem item = cartItemRepository.findByIdAndCartCustomerId(itemId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado."));
        ShoppingCart cart = item.getCart();
        UUID productId = item.getProduct().getId();
        // RN0045: ao liberar um produto, retirar suas linhas de todos os tamanhos.
        new ArrayList<>(cart.getItems()).stream().filter(i -> i.getProduct().getId().equals(productId)).forEach(cart::removeItem);
        sales.reserve(cart.getId(),productId,0,clock.now());
        operationLogRepository.save(new OperationLog(customerId, "DELETE", "ITEM_CARRINHO", "Item " + itemId));
    }

    @Transactional(noRollbackFor = com.jostore.dev.exception.CartAdjustedException.class)
    public OrderQuoteResponseDto quote(UUID customerId, OrderQuoteRequestDto request) {
        sales.lock(); sales.expire(clock.now());
        ShoppingCart cart = findCartWithItems(customerId);
        validateCartAvailability(cart);
        Address address = findDeliveryAddress(customerId, request.deliveryAddressId());
        return quote(cart, address, request.couponIds());
    }

    @Transactional(noRollbackFor = com.jostore.dev.exception.CartAdjustedException.class)
    public OrderResponseDto createOrder(UUID customerId, CreateOrderRequestDto request) {
        sales.lock(); sales.expire(clock.now());
        if (request.quote() == null)
            throw new BusinessRuleException("Endereço e cupons da compra são obrigatórios.");
        ShoppingCart cart = findCartWithItems(customerId);
        Address address = findDeliveryAddress(customerId, request.quote().deliveryAddressId());
        validateCartAvailability(cart);
        OrderQuoteResponseDto quote = quote(cart, address, request.quote().couponIds());
        List<CardPaymentRequestDto> payments = request.cardPayments() == null ? List.of() : request.cardPayments();
        validatePayments(customerId, payments, quote);

        Customer customer = findCustomer(customerId);
        PurchaseOrder order = new PurchaseOrder(nextOrderCode(), customer, address, quote.subtotal(), quote.shipping(),
                quote.couponDiscount(), quote.total());
        cart.getItems()
                .forEach(item -> order.addItem(new OrderItem(item.getProduct(), item.getSize(), item.getQuantity())));

        Map<UUID, CreditCard> cards = payments.stream().map(CardPaymentRequestDto::cardId).distinct()
                .collect(Collectors.toMap(Function.identity(), id -> findCard(id, customerId)));
        payments.forEach(
                payment -> order.addPayment(new OrderPayment(cards.get(payment.cardId()), money(payment.amount()))));

        List<Coupon> usedCoupons = resolveCoupons(request.quote().couponIds(), customerId);
        BigDecimal remainingCouponValue = quote.total().add(quote.couponDiscount());
        for (Coupon coupon : usedCoupons) {
            BigDecimal usedValue = coupon.getValue().min(remainingCouponValue);
            order.addCoupon(new OrderCoupon(coupon, usedValue));
            remainingCouponValue = remainingCouponValue.subtract(usedValue);
        }

        PurchaseOrder saved = purchaseOrderRepository.saveAndFlush(order);
        sales.transfer(cart.getId(),saved.getId());
        sales.history(saved.getId(),null,"EM_PROCESSAMENTO","CLIENTE:"+customerId,"Compra finalizada; aguardando validação do pagamento.",clock.now());
        new ArrayList<>(cart.getItems()).forEach(cart::removeItem);
        operationLogRepository.save(new OperationLog(customerId, "INSERT", "PEDIDO",
                "Pedido " + saved.getCode() + " criado com status EM_PROCESSAMENTO."));
        return toOrderResponse(saved, null);
    }

    private OrderQuoteResponseDto quote(ShoppingCart cart, Address address, List<UUID> couponIds) {
        if (cart.getItems().isEmpty())
            throw new BusinessRuleException("O carrinho deve possuir ao menos um item para realizar a compra.");
        BigDecimal subtotal = cart.getItems().stream().map(this::itemTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        int quantity = cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal shipping = FRETE_BASE.add(FRETE_POR_PECA.multiply(BigDecimal.valueOf(quantity)));
        if (!"SP".equals(address.getState().name()))
            shipping = shipping.add(ADICIONAL_FORA_SP);
        List<Coupon> coupons = resolveCoupons(couponIds, cart.getCustomer().getId());
        validateCoupons(coupons);
        BigDecimal grossTotal = subtotal.add(shipping);
        validateNoUnnecessaryCoupons(coupons, grossTotal);
        BigDecimal selectedValue = coupons.stream().map(Coupon::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = selectedValue.min(grossTotal);
        return new OrderQuoteResponseDto(money(subtotal), money(shipping), money(discount),
                money(grossTotal.subtract(discount)),
                coupons.stream().map(this::toCouponResponse).toList());
    }

    private void validatePayments(UUID customerId, List<CardPaymentRequestDto> payments, OrderQuoteResponseDto quote) {
        BigDecimal paidByCards = payments.stream().map(CardPaymentRequestDto::amount).map(this::money)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paidByCards.compareTo(quote.total()) != 0) {
            throw new BusinessRuleException(
                    "A soma dos valores dos cartões deve ser igual ao total restante da compra.");
        }
        if (payments.isEmpty() && quote.total().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessRuleException("Informe ao menos um cartão para pagar o valor restante da compra.");
        }
        if (payments.stream().map(CardPaymentRequestDto::cardId).distinct().count() != payments.size()) {
            throw new BusinessRuleException("Um mesmo cartão não pode ser informado mais de uma vez no pagamento.");
        }
        boolean usesCoupons = quote.couponDiscount().compareTo(BigDecimal.ZERO) > 0;
        for (CardPaymentRequestDto payment : payments) {
            findCard(payment.cardId(), customerId);
            if (payments.size() > 1 && payment.amount().compareTo(DEZ_REAIS) < 0) {
                throw new BusinessRuleException(
                        "Cada cartão deve pagar ao menos R$ 10,00 quando houver mais de um cartão.");
            }
            if (!usesCoupons && payment.amount().compareTo(DEZ_REAIS) < 0) {
                throw new BusinessRuleException(
                        "Valor inferior a R$ 10,00 no cartão só é permitido quando houver cupom na compra.");
            }
        }
    }

    private void validateCoupons(List<Coupon> coupons) {
        long promotional = coupons.stream().filter(coupon -> coupon.getType() == CouponTypeEnum.PROMOCIONAL).count();
        if (promotional > 1)
            throw new BusinessRuleException("Apenas um cupom promocional pode ser utilizado por compra.");
    }

    private void validateNoUnnecessaryCoupons(List<Coupon> coupons, BigDecimal grossTotal) {
        BigDecimal remaining = grossTotal;
        for (Coupon coupon : coupons) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException(
                        "Não é permitido usar cupom desnecessário após a compra já estar totalmente coberta.");
            }
            remaining = remaining.subtract(coupon.getValue());
        }
    }

    private List<Coupon> resolveCoupons(List<UUID> couponIds, UUID customerId) {
        if (couponIds == null || couponIds.isEmpty())
            return List.of();
        LinkedHashSet<UUID> ids = new LinkedHashSet<>(couponIds);
        if (ids.size() != couponIds.size())
            throw new BusinessRuleException("Um cupom não pode ser informado mais de uma vez.");
        List<Coupon> coupons = couponRepository.findByIdInAndActiveTrue(ids);
        for(UUID id:ids) {
            Integer pending = sales.jdbc().queryForObject("SELECT count(*) FROM pedidos_cupons pc JOIN pedidos p ON p.ped_id=pc.pcu_ped_id WHERE pc.pcu_cup_id=? AND p.ped_status='EM_PROCESSAMENTO'",Integer.class,id);
            if(pending>0) throw new BusinessRuleException("Cupom já reservado para outra compra em processamento.");
        }
        if (coupons.size() != ids.size() || coupons.stream()
                .anyMatch(coupon -> coupon.getCustomer() != null && !coupon.getCustomer().getId().equals(customerId)))
            throw new BusinessRuleException("Um ou mais cupons informados não estão disponíveis.");
        return coupons.stream().sorted(Comparator.comparing(Coupon::getValue).reversed()).toList();
    }

    private void validateAvailableQuantity(Product product, int quantity, UUID cartId) {
        Inventory inventory = inventoryRepository.findByProductId(product.getId())
                .orElseThrow(() -> new BusinessRuleException("Estoque do produto não encontrado."));
        if (!product.isActive() || inventory.getAvailableQuantity() - sales.reserved(product.getId(),cartId) < quantity) {
            throw new BusinessRuleException(
                    "A quantidade solicitada para " + product.getName() + " não está disponível em estoque.");
        }
    }

    private void validateCartAvailability(ShoppingCart cart) {
        boolean changed=false;
        var remaining=new java.util.HashMap<UUID,Integer>();
        for(CartItem item:new ArrayList<>(cart.getItems())) {
            UUID pid=item.getProduct().getId();
            int available=remaining.computeIfAbsent(pid,id -> item.getProduct().isActive() ? Math.max(0,inventoryRepository.findByProductId(id).map(Inventory::getAvailableQuantity).orElse(0)-sales.reserved(id,cart.getId())) : 0);
            int allowed=Math.min(item.getQuantity(),available);
            remaining.put(pid,available-allowed);
            if(allowed!=item.getQuantity()) {
                changed=true;
                sales.jdbc().update("INSERT INTO itens_carrinho_removidos VALUES (?,?,?,?,?,?,?,?)",UUID.randomUUID(),cart.getId(),pid,item.getProduct().getName(),item.getSize(),item.getQuantity()-allowed,"Disponibilidade de estoque alterada.",java.sql.Timestamp.from(clock.now()));
                if(allowed==0) cart.removeItem(item); else item.changeQuantity(allowed);
            }
        }
        if(changed) {
            var expires=sales.expires(cart.getId());
            for(UUID pid:remaining.keySet()) sales.reserve(cart.getId(),pid,cart.getItems().stream().filter(i->i.getProduct().getId().equals(pid)).mapToInt(CartItem::getQuantity).sum(),expires==null?clock.now():expires);
            shoppingCartRepository.saveAndFlush(cart);
            sales.audit(cart.getCustomer().getId(),"UPDATE","CARRINHO","Quantidades reconciliadas com o estoque; carrinho "+cart.getId(),clock.now());
            throw new com.jostore.dev.exception.CartAdjustedException();
        }
    }

    private Customer findCustomer(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private Product findProduct(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado."));
    }

    private ShoppingCart findCartWithItems(UUID customerId) {
        return shoppingCartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new BusinessRuleException("O carrinho está vazio."));
    }

    private Address findDeliveryAddress(UUID customerId, UUID addressId) {
        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Endereço de entrega não encontrado."));
        if (!address.getPurposes().contains(PurposeEnum.ENTREGA))
            throw new BusinessRuleException("O endereço selecionado não possui finalidade de entrega.");
        return address;
    }

    private CreditCard findCard(UUID cardId, UUID customerId) {
        return creditCardRepository.findByIdAndCustomerId(cardId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão de crédito não encontrado."));
    }

    private String normalizedSize(String size) {
        return size.trim().toUpperCase();
    }

    private BigDecimal itemTotal(CartItem item) {
        return item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }

    private BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String nextOrderCode() {
        return sales.nextCode();
    }

    private CartResponseDto toCartResponse(ShoppingCart cart) {
        if (cart == null)
            return new CartResponseDto(null, List.of(), BigDecimal.ZERO.setScale(2),null,clock.now(),false,List.of());
        List<CartItemResponseDto> items = cart.getItems().stream().map(this::toCartItemResponse).toList();
        BigDecimal subtotal = items.stream().map(CartItemResponseDto::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        var expires=sales.expires(cart.getId());
        return new CartResponseDto(cart.getId(), items, money(subtotal),expires,clock.now(),expires!=null && !expires.isAfter(clock.now().plusSeconds(300)),sales.removed(cart.getId()));
    }

    private CartItemResponseDto toCartItemResponse(CartItem item) {
        Product product = item.getProduct();
        int stock = inventoryRepository.findByProductId(product.getId()).map(Inventory::getAvailableQuantity).orElse(0);
        ProductResponseDto response = new ProductResponseDto(product.getId(), product.getCode(), product.getName(),
                product.getDescription(), product.getPrice(), product.getImageUrl(), stock);
        return new CartItemResponseDto(item.getId(), response, item.getSize(), item.getQuantity(), product.getPrice(),
                money(itemTotal(item)));
    }

    private CouponResponseDto toCouponResponse(Coupon coupon) {
        return new CouponResponseDto(coupon.getId(), coupon.getCode(), coupon.getType(), coupon.getValue(),
                coupon.getDescription());
    }

    private AddressResponseDto toAddressResponse(Address address) {
        return new AddressResponseDto(address.getId(), address.getIdentification(), java.util.Set.copyOf(address.getPurposes()),
                address.getResidenceType().getDescription(),
                address.getPublicPlaceType().getDescription(), address.getPublicPlace(), address.getAddressNumber(),
                address.getNeighborhood(),
                address.getCep(), address.getCity(), address.getState(), address.getCountry(), address.getComplement(),
                address.getObservation());
    }

    public OrderResponseDto toOrderResponse(PurchaseOrder order, Coupon generatedCoupon) {
        List<CartItemResponseDto> items = order.getItems().stream().map(item -> new CartItemResponseDto(item.getId(),
                new ProductResponseDto(item.getProduct().getId(), item.getProductCode(), item.getProductName(),
                        item.getProduct().getDescription(), item.getUnitPrice(), item.getProduct().getImageUrl(), 0),
                item.getSize(), item.getQuantity(), item.getUnitPrice(), item.getTotal())).toList();
        List<OrderPaymentResponseDto> payments = order.getPayments().stream()
                .map(payment -> new OrderPaymentResponseDto(payment.getCard().getId(),
                        payment.getDescription(),
                        payment.getAmount()))
                .toList();
        List<CouponResponseDto> coupons = order.getCoupons().stream().map(OrderCoupon::getCoupon)
                .map(this::toCouponResponse).toList();
        return new OrderResponseDto(order.getId(), order.getCode(), order.getStatus(), order.getCreatedAt(),
                toAddressResponse(order.getDeliveryAddress()), items,
                payments, coupons, order.getSubtotal(), order.getShipping(), order.getCouponDiscount(),
                order.getTotal(), generatedCoupon == null ? null : toCouponResponse(generatedCoupon),sales.history(order.getId()));
    }
}
