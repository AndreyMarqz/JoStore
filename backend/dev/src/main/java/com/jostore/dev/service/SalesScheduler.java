package com.jostore.dev.service;

import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.*;
import org.slf4j.LoggerFactory;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="jostore.sales.scheduler-enabled",havingValue="true",matchIfMissing=true)
@EnableScheduling
public class SalesScheduler {
    private final SalesLifecycleService sales;
    public SalesScheduler(SalesLifecycleService sales) { this.sales=sales; }
    @Scheduled(fixedDelayString="${jostore.sales.poll-ms:1000}")
    public void tick() {
        try { sales.expireCarts(); } catch(Exception e) { LoggerFactory.getLogger(getClass()).error("Falha ao expirar reservas",e); }
        for(var id:sales.pending()) {
            try { sales.process(id); } catch(Exception e) { LoggerFactory.getLogger(getClass()).error("Falha ao processar pedido {}",id,e); }
        }
    }
}
