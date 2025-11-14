package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainConflictException;

public class UserHasAssignedInventoriesException extends DomainConflictException {
    public UserHasAssignedInventoriesException(Long userId, int inventoryCount) {
        super(String.format("No se puede eliminar el usuario con ID %d porque tiene %d inventario(s) asignado(s). " +
                "Transfiere la gestión de los inventarios a otro usuario antes de eliminarlo.", userId, inventoryCount));
    }
    
    public UserHasAssignedInventoriesException(Long userId, int ownedCount, int managedCount) {
        super(String.format("No se puede eliminar el usuario con ID %d porque tiene %d inventario(s) como propietario " +
                "y %d inventario(s) como gestor. Transfiere la propiedad y gestión de los inventarios a otro usuario antes de eliminarlo.", 
                userId, ownedCount, managedCount));
    }
}

