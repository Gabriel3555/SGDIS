package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.ItemDTO;

public interface GetItemBySerialUseCase {
    ItemDTO getItemBySerial(String serial);
}

