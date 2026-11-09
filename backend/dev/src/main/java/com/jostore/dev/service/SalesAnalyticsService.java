package com.jostore.dev.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jostore.dev.dto.responses.ProductCategoryResponseDto;
import com.jostore.dev.dto.responses.SalesHistoryPointResponseDto;
import com.jostore.dev.dto.responses.SalesHistoryResponseDto;
import com.jostore.dev.exception.BusinessRuleException;
import com.jostore.dev.repository.ProductCategoryRepository;
import com.jostore.dev.repository.SalesRepository;

/** Consulta agregada usada no gráfico gerencial de histórico de vendas. */
@Service
public class SalesAnalyticsService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");

    private final ProductCategoryRepository categories;
    private final SalesRepository sales;

    public SalesAnalyticsService(ProductCategoryRepository categories, SalesRepository sales) {
        this.categories = categories;
        this.sales = sales;
    }

    @Transactional(readOnly = true)
    public List<ProductCategoryResponseDto> listCategories() {
        return categories.findByActiveTrueOrderByNameAsc().stream()
                .map(category -> new ProductCategoryResponseDto(category.getId(), category.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public SalesHistoryResponseDto history(LocalDate startDate, LocalDate endDate, List<UUID> requestedCategoryIds) {
        if (startDate == null || endDate == null) {
            throw new BusinessRuleException("Informe a data inicial e a data final da análise.");
        }
        if (endDate.isBefore(startDate)) {
            throw new BusinessRuleException("A data final não pode ser anterior à data inicial.");
        }
        var selectedIds = new ArrayList<>(new LinkedHashSet<>(requestedCategoryIds == null ? List.of() : requestedCategoryIds));
        if (selectedIds.isEmpty()) {
            throw new BusinessRuleException("Selecione ao menos uma categoria para a análise.");
        }

        var found = categories.findByIdInAndActiveTrue(selectedIds);
        if (found.size() != selectedIds.size()) {
            throw new BusinessRuleException("Uma ou mais categorias selecionadas não estão disponíveis.");
        }
        var byId = new LinkedHashMap<UUID, ProductCategoryResponseDto>();
        found.forEach(category -> byId.put(category.getId(), new ProductCategoryResponseDto(category.getId(), category.getName())));
        var selectedCategories = selectedIds.stream().map(byId::get).toList();

        Instant start = startDate.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant endExclusive = endDate.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        String placeholders = String.join(",", java.util.Collections.nCopies(selectedIds.size(), "?"));
        String sql = """
                SELECT to_char(date_trunc('month', h.occurred_at AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM') AS month,
                       p.pro_cat_id AS category_id,
                       COALESCE(SUM(item.ipe_total), 0) AS total
                  FROM historico_pedidos h
                  JOIN pedidos o ON o.ped_id = h.order_id
                  JOIN itens_pedido item ON item.ipe_ped_id = o.ped_id
                  JOIN produtos p ON p.pro_id = item.ipe_pro_id
                 WHERE h.status = 'ENTREGUE'
                   AND h.occurred_at >= ?
                   AND h.occurred_at < ?
                   AND p.pro_cat_id IN (%s)
                 GROUP BY date_trunc('month', h.occurred_at AT TIME ZONE 'America/Sao_Paulo'), p.pro_cat_id
                 ORDER BY date_trunc('month', h.occurred_at AT TIME ZONE 'America/Sao_Paulo'), p.pro_cat_id
                """.formatted(placeholders);
        Object[] parameters = new Object[2 + selectedIds.size()];
        parameters[0] = Timestamp.from(start);
        parameters[1] = Timestamp.from(endExclusive);
        for (int index = 0; index < selectedIds.size(); index++) parameters[index + 2] = selectedIds.get(index);

        Map<String, Map<UUID, BigDecimal>> totalsByMonth = new LinkedHashMap<>();
        sales.jdbc().queryForList(sql, parameters).forEach(row -> {
            String month = (String) row.get("month");
            UUID categoryId = (UUID) row.get("category_id");
            BigDecimal total = (BigDecimal) row.get("total");
            totalsByMonth.computeIfAbsent(month, ignored -> new LinkedHashMap<>()).put(categoryId, total);
        });

        List<SalesHistoryPointResponseDto> points = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (YearMonth month = YearMonth.from(startDate); !month.isAfter(YearMonth.from(endDate)); month = month.plusMonths(1)) {
            String key = month.toString();
            var values = new LinkedHashMap<UUID, BigDecimal>();
            for (UUID categoryId : selectedIds) {
                BigDecimal value = totalsByMonth.getOrDefault(key, Map.of()).getOrDefault(categoryId, BigDecimal.ZERO);
                values.put(categoryId, value);
                total = total.add(value);
            }
            points.add(new SalesHistoryPointResponseDto(month.getMonthValue() + "/" + month.getYear(), values));
        }
        return new SalesHistoryResponseDto(startDate, endDate, selectedCategories, points, total);
    }
}
