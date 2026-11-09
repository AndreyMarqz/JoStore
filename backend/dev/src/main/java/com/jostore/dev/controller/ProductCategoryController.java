package com.jostore.dev.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.responses.ProductCategoryResponseDto;
import com.jostore.dev.service.SalesAnalyticsService;

@RestController
@RequestMapping("/api/v1/product-categories")
public class ProductCategoryController {
    private final SalesAnalyticsService analytics;

    public ProductCategoryController(SalesAnalyticsService analytics) { this.analytics = analytics; }

    @GetMapping
    public List<ProductCategoryResponseDto> list() { return analytics.listCategories(); }
}
