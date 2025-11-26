package com.sgdis.backend.auditory.application.port.in;

import com.sgdis.backend.auditory.application.dto.RecordActionRequest;

public interface RecordActionUseCase {
    void recordAction(RecordActionRequest recordActionRequest);
}
