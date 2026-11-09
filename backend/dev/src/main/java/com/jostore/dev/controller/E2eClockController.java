package com.jostore.dev.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import com.jostore.dev.service.*;

/** Nunca registrado fora do perfil isolado e2e. */
@Profile("e2e")
@RestController
@RequestMapping("/api/v1/e2e/clock")
public class E2eClockController {
    private final SalesClock clock;
    private final SalesLifecycleService sales;
    public E2eClockController(SalesClock clock,SalesLifecycleService sales) {this.clock=clock;this.sales=sales;}
    @PostMapping("/reset") public void reset() { clock.reset(); }
    @PostMapping("/advance") public void advance(@RequestParam long seconds) {clock.advance(seconds);sales.expireCarts();}
}
