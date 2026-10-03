package com.jostore.dev.controller;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.jostore.dev.dto.responses.ProductResponseDto;
import com.jostore.dev.service.ProductService;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService productService;
    public ProductController(ProductService productService) { this.productService = productService; }
    @GetMapping public List<ProductResponseDto> list() { return productService.listAvailable(); }
}
