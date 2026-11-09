package com.jostore.dev.service;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/** Relógio compartilhado: somente o controller do perfil e2e permite avançá-lo. */
@Component
public class SalesClock {
    private final AtomicLong offset = new AtomicLong();
    public Instant now() { return Instant.now().plusSeconds(offset.get()); }
    public void advance(long seconds) {
        if (seconds < 0 || seconds > 86400) throw new IllegalArgumentException("Avanço de tempo inválido.");
        offset.addAndGet(seconds);
    }

    public void reset() {
        offset.set(0);
    }
}
