package com.jostore.dev.model.audit;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "logs_operacoes")
@NoArgsConstructor
public class OperationLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "log_id")
    private UUID id;
    @Column(name = "log_responsavel_id") private UUID responsibleId;
    @Column(name = "log_operacao", nullable = false, length = 40) private String operation;
    @Column(name = "log_entidade", nullable = false, length = 60) private String entity;
    @Column(name = "log_dados", nullable = false, length = 1000) private String changedData;
    @Column(name = "log_ocorrido_at", nullable = false) private Instant occurredAt;
    public OperationLog(UUID responsibleId, String operation, String entity, String changedData) {
        this.responsibleId = responsibleId; this.operation = operation; this.entity = entity;
        this.changedData = changedData; this.occurredAt = Instant.now();
    }
}
