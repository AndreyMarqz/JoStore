package com.jostore.dev.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.responses.SalesHistoryResponseDto;
import com.jostore.dev.exception.ForbiddenOperationException;
import com.jostore.dev.service.SalesAnalyticsService;

@RestController
@RequestMapping("/api/v1/admin/sales-history")
public class SalesAnalyticsController {
    private final SalesAnalyticsService analytics;

    public SalesAnalyticsController(SalesAnalyticsService analytics) { this.analytics = analytics; }

    @GetMapping
    public SalesHistoryResponseDto history(
            @RequestHeader(value = "X-JoStore-Role", required = false) String role,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam List<UUID> categoryIds) {
        if (!"ADMINISTRADOR".equals(role)) {
            throw new ForbiddenOperationException("A análise de vendas está disponível somente para o perfil administrador.");
        }
        return analytics.history(startDate, endDate, categoryIds);
    }
}
