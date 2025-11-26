package com.sgdis.backend.auditory.application.port.in;

import com.sgdis.backend.auditory.application.dto.PagedAuditoryResponse;
import org.springframework.data.domain.Pageable;

public interface ListAuditoryUseCase {
    PagedAuditoryResponse listAuditories(Pageable pageable);
}

