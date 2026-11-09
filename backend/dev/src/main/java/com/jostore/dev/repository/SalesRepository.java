package com.jostore.dev.repository;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Persistência das reservas, histórico e operações do ciclo de vendas. */
@Repository
public class SalesRepository {
    private final JdbcTemplate jdbc;
    public SalesRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public JdbcTemplate jdbc() { return jdbc; }
    // Serializa as escritas do módulo no PostgreSQL, inclusive entre instâncias.
    // Evita corrida entre expiração, reserva, uso de cupom e aprovação.
    public void lock() { jdbc.execute("SELECT pg_advisory_xact_lock(74819325)"); }
    public String nextCode() { return "PED-%06d".formatted(jdbc.queryForObject("SELECT nextval('pedido_codigo_seq')", Long.class)); }
    public int reserved(UUID productId, UUID cartId) {
        return jdbc.queryForObject("SELECT COALESCE(sum(quantity),0)::integer FROM reservas_estoque WHERE product_id=? AND (cart_id IS NULL OR cart_id IS DISTINCT FROM ?)", Integer.class, productId, cartId);
    }
    public void reserve(UUID cartId, UUID productId, int quantity, Instant expiresAt) {
        jdbc.update("DELETE FROM reservas_estoque WHERE cart_id=? AND product_id=?",cartId,productId);
        if(quantity>0) jdbc.update("INSERT INTO reservas_estoque(id,cart_id,product_id,quantity,expires_at) VALUES (?,?,?,?,?)", UUID.randomUUID(),cartId,productId,quantity,Timestamp.from(expiresAt));
    }
    public Instant expires(UUID cartId) {
        return jdbc.queryForObject("SELECT min(expires_at) FROM reservas_estoque WHERE cart_id=?", (rs,n)->rs.getTimestamp(1)==null?null:rs.getTimestamp(1).toInstant(),cartId);
    }
    public void renew(UUID cartId, Instant expires) { jdbc.update("UPDATE reservas_estoque SET expires_at=? WHERE cart_id=?",Timestamp.from(expires),cartId); }
    public void transfer(UUID cartId, UUID orderId) { jdbc.update("UPDATE reservas_estoque SET cart_id=NULL,order_id=? WHERE cart_id=?",orderId,cartId); }
    public void releaseOrder(UUID orderId) { jdbc.update("DELETE FROM reservas_estoque WHERE order_id=?",orderId); }
    public List<Map<String,Object>> removed(UUID cartId) { return jdbc.queryForList("SELECT id, product_id AS \"productId\",name,size,quantity,reason FROM itens_carrinho_removidos WHERE cart_id=? ORDER BY removed_at",cartId); }
    public void expire(Instant now) {
        var expiredReservations=jdbc.queryForList("SELECT cart_id,product_id FROM reservas_estoque WHERE cart_id IS NOT NULL AND expires_at<=?",Timestamp.from(now));
        for(var reservation:expiredReservations) {
            UUID cart=(UUID) reservation.get("cart_id");
            UUID product=(UUID) reservation.get("product_id");
            // RN0045: a expiraÃ§Ã£o libera todas as variaÃ§Ãµes (tamanhos) do mesmo produto,
            // sem remover produtos diferentes que ainda estejam reservados no carrinho.
            jdbc.update("INSERT INTO itens_carrinho_removidos SELECT gen_random_uuid(),i.ica_car_id,i.ica_pro_id,p.pro_nome,i.ica_tamanho,i.ica_quantidade,?,? FROM itens_carrinho i JOIN produtos p ON p.pro_id=i.ica_pro_id WHERE i.ica_car_id=? AND i.ica_pro_id=?", "Prazo de bloqueio expirado. Adicione o produto novamente para comprar.",Timestamp.from(now),cart,product);
            jdbc.update("DELETE FROM itens_carrinho WHERE ica_car_id=? AND ica_pro_id=?",cart,product);
            jdbc.update("DELETE FROM reservas_estoque WHERE cart_id=? AND product_id=?",cart,product);
            audit(null,"EXPIRE","CARRINHO","Reserva liberada e itens do produto " + product + " removidos do carrinho " + cart,now);
        }
    }
    public void history(UUID order, String previous, String status, String actor, String description, Instant now) {
        jdbc.update("INSERT INTO historico_pedidos VALUES (?,?,?,?,?,?,?)",UUID.randomUUID(),order,previous,status,actor,Timestamp.from(now),description);
        audit(null,"STATUS","PEDIDO",actor+": "+order+" "+previous+" → "+status+". "+description,now);
    }
    public List<Map<String,Object>> history(UUID order) { return jdbc.queryForList("SELECT previous_status AS \"previousStatus\",status,actor,occurred_at AS \"occurredAt\",description FROM historico_pedidos WHERE order_id=? ORDER BY occurred_at",order); }
    public void audit(UUID actor,String operation,String entity,String data,Instant now) {
        jdbc.update("INSERT INTO logs_operacoes(log_id,log_responsavel_id,log_operacao,log_entidade,log_dados,log_ocorrido_at) VALUES (?,?,?,?,?,?)",UUID.randomUUID(),actor,operation,entity,data,Timestamp.from(now));
    }
}
