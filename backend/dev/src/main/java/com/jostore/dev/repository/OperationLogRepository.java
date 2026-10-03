package com.jostore.dev.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.audit.OperationLog;

public interface OperationLogRepository extends JpaRepository<OperationLog, UUID> { }
