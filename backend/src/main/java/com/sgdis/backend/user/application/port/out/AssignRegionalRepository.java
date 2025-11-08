package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.application.dto.AssignRegionalRequest;
import com.sgdis.backend.user.application.dto.UserRegionalDto;

public interface AssignRegionalRepository {
    UserRegionalDto assignRegional(AssignRegionalRequest regional);
}
