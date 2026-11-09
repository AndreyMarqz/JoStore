package com.jostore.dev.integration;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;
import com.jostore.dev.service.*;
import com.jostore.dev.dto.requests.CartItemRequestDto;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest(properties="jostore.sales.scheduler-enabled=false")
@Testcontainers
class SalesLifecycleIntegrationTest {
    @Container static final PostgreSQLContainer DB=new PostgreSQLContainer("postgres:18-alpine").withDatabaseName("sales_test");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",DB::getJdbcUrl);r.add("spring.datasource.username",DB::getUsername);r.add("spring.datasource.password",DB::getPassword);
    }
    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired SalesLifecycleService lifecycle;
    @Autowired OrderService orders;
    @Autowired SalesClock clock;
    MockMvc mvc;
    UUID product;
    int counter;
    @BeforeEach void setup() {
        mvc=MockMvcBuilders.webAppContextSetup(context).build();
        jdbc.execute("TRUNCATE clientes,usuarios CASCADE");
        jdbc.update("UPDATE estoques SET est_quantidade_disponivel=30");
        jdbc.update("UPDATE cupons SET cup_ativo=true,cup_usado_at=NULL");
        product=jdbc.queryForObject("SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000003'",UUID.class);
    }
    String postJson(String path,String body,int expected) throws Exception {
        var result=mvc.perform(post("/api/v1"+path).contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
        assertThat(result.getResponse().getStatus()).as(result.getResponse().getContentAsString()).isEqualTo(expected);
        return result.getResponse().getContentAsString();
    }
    String getJson(String path) throws Exception {
        var result=mvc.perform(get("/api/v1"+path)).andReturn();
        assertThat(result.getResponse().getStatus()).as(result.getResponse().getContentAsString()).isEqualTo(200);
        return result.getResponse().getContentAsString();
    }
    UUID id(String body,String path) {return UUID.fromString(JsonPath.read(body,path));}
    String customer() throws Exception {
        counter++;
        return postJson("/customers","""
         {"fullName":"Cliente de Vendas","cpf":"%011d","gender":"FEMININO","birthDate":"1995-01-01",
          "phone":{"type":"CELULAR","areaCode":"11","number":"999999999"},"email":"venda%d@test.com",
          "password":"Senha@123","confirmPassword":"Senha@123","addresses":[
           {"label":"Casa","roles":["RESIDENCIA","COBRANCA","ENTREGA"],"residenceType":"Casa","streetType":"Rua",
            "street":"Teste","number":"1","neighborhood":"Centro","zipCode":"01001000","city":"São Paulo","state":"SP","country":"Brasil"}]}
         """.formatted(counter,counter),201);
    }
    String card(UUID c,String number) throws Exception { return postJson("/customers/"+c+"/cards","""
        {"holder":"Cliente de Vendas","number":"%s","brand":"VISA","securityCode":"123"}
        """.formatted(number),201); }
    void add(UUID c,int qty) throws Exception {postJson("/customers/"+c+"/cart/items","""
        {"productId":"%s","size":"M","quantity":%d}
        """.formatted(product,qty),201);}
    UUID buy(UUID c,UUID address,UUID card,int qty) throws Exception {
        add(c,qty);
        String quote=postJson("/customers/"+c+"/orders/quote","{\"deliveryAddressId\":\""+address+"\",\"couponIds\":[]}",200);
        Number total=JsonPath.read(quote,"$.total");
        String result=postJson("/customers/"+c+"/orders","""
         {"quote":{"deliveryAddressId":"%s","couponIds":[]},"cardPayments":[{"cardId":"%s","amount":%s}]}
         """.formatted(address,card,total),201);
        assertThat((String)JsonPath.read(result,"$.status")).isEqualTo("EM_PROCESSAMENTO");
        return id(result,"$.id");
    }
    int stock() {return jdbc.queryForObject("SELECT est_quantidade_disponivel FROM estoques WHERE est_pro_id=?",Integer.class,product);}
    @Test void approvesOnceAndRejectsWithoutStockDecrease() throws Exception {
        String c=customer();UUID cid=id(c,"$.id"),address=id(c,"$.addresses[0].id");
        UUID good=id(card(cid,"4111111111111111"),"$.cards[0].id");
        UUID approved=buy(cid,address,good,2);lifecycle.process(approved);lifecycle.process(approved);
        assertThat(stock()).isEqualTo(28);
        String all=card(cid,"4111111111170000");UUID bad=id(all,"$.cards[1].id");
        UUID rejected=buy(cid,address,bad,1);lifecycle.process(rejected);
        assertThat(stock()).isEqualTo(28);
        assertThat((String)JsonPath.read(getJson("/customers/"+cid+"/orders/"+rejected),"$.status")).isEqualTo("REPROVADA");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM reservas_estoque",Integer.class)).isZero();
    }
    @Test void concurrentCartsCannotReserveTheSameUnit() throws Exception {
        UUID first=id(customer(),"$.id"),second=id(customer(),"$.id");
        jdbc.update("UPDATE estoques SET est_quantidade_disponivel=1 WHERE est_pro_id=?",product);
        var latch=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var work=new ArrayList<Future<Boolean>>();
            for(var c:List.of(first,second)) work.add(pool.submit(()->{latch.await();try{orders.addItem(c,new CartItemRequestDto(product,"M",1));return true;}catch(com.jostore.dev.exception.BusinessRuleException e){return false;}}));
            latch.countDown();int success=0;for(var f:work)if(f.get(10,TimeUnit.SECONDS))success++;
            assertThat(success).isEqualTo(1);
        }
        assertThat(stock()).isEqualTo(1);
    }
    @Test void expirationReleasesOnlyTheExpiredProductAndAllItsSizes() throws Exception {
        UUID cid=id(customer(),"$.id");add(cid,1);
        orders.addItem(cid,new CartItemRequestDto(product,"G",2));
        UUID otherProduct=jdbc.queryForObject("SELECT pro_id FROM produtos WHERE pro_codigo='ROP-000004'",UUID.class);
        orders.addItem(cid,new CartItemRequestDto(otherProduct,"M",1));
        UUID cart=orders.getCart(cid).id();
        jdbc.update("UPDATE reservas_estoque SET expires_at=? WHERE cart_id=? AND product_id=?",Timestamp.from(clock.now().plusSeconds(1200)),cart,otherProduct);
        clock.advance(301);assertThat(orders.getCart(cid).expirationWarning()).isTrue();
        clock.advance(300);lifecycle.expireCarts();
        var response=orders.getCart(cid);assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().product().id()).isEqualTo(otherProduct);
        assertThat(response.removedItems()).hasSize(2);
        assertThat(stock()).isEqualTo(30);
    }
    @Test void stockCorrectionSurvivesCheckoutValidationError() throws Exception {
        String c=customer();UUID cid=id(c,"$.id");add(cid,3);
        jdbc.update("UPDATE estoques SET est_quantidade_disponivel=1 WHERE est_pro_id=?",product);
        postJson("/customers/"+cid+"/orders/quote","{\"deliveryAddressId\":\""+id(c,"$.addresses[0].id")+"\"}",422);
        assertThat(orders.getCart(cid).items().getFirst().quantity()).isEqualTo(1);
    }
    @Test void fullExchangeRequiresAuthorizationAndCannotGenerateDuplicateCredit() throws Exception {
        String c=customer();UUID cid=id(c,"$.id");UUID card=id(card(cid,"4111111111111111"),"$.cards[0].id");
        UUID oid=buy(cid,id(c,"$.addresses[0].id"),card,2);lifecycle.process(oid);
        UUID item=id(getJson("/customers/"+cid+"/orders/"+oid),"$.items[0].id");
        String body="{\"items\":[{\"orderItemId\":\""+item+"\",\"quantity\":2}]}";
        postJson("/customers/"+cid+"/orders/"+oid+"/exchanges",body,422);
        lifecycle.transition(oid,true);lifecycle.transition(oid,false);
        UUID ex=id(postJson("/customers/"+cid+"/orders/"+oid+"/exchanges",body,200),"$.id");
        String receipt="{\"items\":[{\"orderItemId\":\""+item+"\",\"restock\":true}]}";
        postJson("/exchanges/"+ex+"/receipt-confirmation",receipt,422);
        postJson("/exchanges/"+ex+"/authorize","",200);
        assertThat(lifecycle.notifications(cid)).hasSize(1);
        postJson("/exchanges/"+ex+"/receipt-confirmation",receipt,200);
        postJson("/exchanges/"+ex+"/receipt-confirmation",receipt,422);
        assertThat(stock()).isEqualTo(30);
        assertThat(jdbc.queryForObject("SELECT cup_valor FROM cupons WHERE cup_cli_id=?",java.math.BigDecimal.class,cid)).isEqualByComparingTo("199.80");
        assertThat((String)JsonPath.read(getJson("/customers/"+cid+"/orders/"+oid),"$.status")).isEqualTo("TROCADO");
    }
    @Test void consultationIsUnderOneSecondAfterWarmup() throws Exception {
        UUID cid=id(customer(),"$.id");getJson("/customers/"+cid+"/orders");
        long start=System.nanoTime();getJson("/customers/"+cid+"/orders");
        assertThat(TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start)).isLessThan(1000);
    }
    @Test void salesHistoryIncludesOnlyDeliveredOrdersAndRequiresAdministrator() throws Exception {
        String first=customer(); UUID firstId=id(first,"$.id"), address=id(first,"$.addresses[0].id");
        UUID card=id(card(firstId,"4111111111111111"),"$.cards[0].id");
        UUID delivered=buy(firstId,address,card,2); lifecycle.process(delivered);
        lifecycle.transition(delivered,true); lifecycle.transition(delivered,false);
        String second=customer(); UUID secondId=id(second,"$.id"), secondAddress=id(second,"$.addresses[0].id");
        UUID secondCard=id(card(secondId,"4111111111111111"),"$.cards[0].id");
        UUID notDelivered=buy(secondId,secondAddress,secondCard,1); lifecycle.process(notDelivered);
        UUID category=jdbc.queryForObject("SELECT pro_cat_id FROM produtos WHERE pro_id=?",UUID.class,product);
        String date=clock.now().atZone(java.time.ZoneId.of("America/Sao_Paulo")).toLocalDate().toString();
        String path="/api/v1/admin/sales-history?startDate="+date+"&endDate="+date+"&categoryIds="+category;
        var forbidden=mvc.perform(get(path)).andReturn();
        assertThat(forbidden.getResponse().getStatus()).isEqualTo(403);
        long start=System.nanoTime();
        var allowed=mvc.perform(get(path).header("X-JoStore-Role","ADMINISTRADOR")).andReturn();
        assertThat(allowed.getResponse().getStatus()).as(allowed.getResponse().getContentAsString()).isEqualTo(200);
        assertThat(TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start)).isLessThan(1000);
        assertThat(new java.math.BigDecimal(JsonPath.read(allowed.getResponse().getContentAsString(),"$.total").toString()))
            .isEqualByComparingTo("199.80");
    }
}
