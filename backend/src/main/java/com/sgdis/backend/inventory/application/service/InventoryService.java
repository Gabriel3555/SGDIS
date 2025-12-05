package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.DomainConflictException;
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.user.mapper.UserMapper;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;

@Service
@RequiredArgsConstructor
public class InventoryService
        implements
                CreateInventoryUseCase,
                ListInventoryUseCase,
                UpdateInventoryUseCase,
                DeleteInventoryUseCase,
                GetInventoryByIdUseCase,
                QuitInventoryUseCase,
                AssignManagerInventoryUseCase,
                DeleteManagerInventoryUseCase,
                GetInventoryManagersUseCase,
                GetAllManagedInventoriesUseCase,
                GetMyManagedInventoriesUseCase,
                FindMyInventoryUseCase,
                AssignSignatoryInventoryUseCase,
                GetMySignatoryInventoriesUseCase,
                GetAllSignatoriesUseCase,
                QuitSignatoryInventoryUseCase,
                DeleteSignatoryInventoryUseCase,
                UpdateInventoryOwnerUseCase,
                UpdateInventoryInstitutionUseCase,
                QuitManagerInventoryUseCase{

        private final SpringDataInventoryRepository inventoryRepository;
        private final SpringDataUserRepository userRepository;
        private final SpringDataInstitutionRepository institutionRepository;
        private final AuthService authService;
        private final NotificationService notificationService;
        private final NotificationPersistenceService notificationPersistenceService;
        private final RecordActionUseCase recordActionUseCase;
        private final SpringDataItemRepository itemRepository;
        private final SpringDataLoanRepository loanRepository;
        private final SpringDataTransferRepository transferRepository;

        /**
         * Valida que el inventario esté activo para realizar acciones.
         * Permite excepciones para: eliminar inventario y realizar transferencias.
         * 
         * @param inventory El inventario a validar
         * @param actionName El nombre de la acción que se está intentando realizar (para el mensaje de error)
         */
        private void validateInventoryIsActive(InventoryEntity inventory, String actionName) {
                if (inventory != null && !inventory.isStatus()) {
                        String inventoryName = inventory.getName() != null ? inventory.getName() : "sin nombre";
                        throw new DomainValidationException(
                                String.format("No se puede %s en el inventario '%s' porque está inactivo. " +
                                                "Solo se permiten transferencias de items y eliminar el inventario cuando está inactivo.",
                                        actionName, inventoryName)
                        );
                }
        }

        @Override
        @Transactional
        public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
                UserEntity owner = null;
                
                // Si ownerId es proporcionado, validar y buscar el usuario
                if (request.ownerId() != null) {
                        owner = userRepository.findById(request.ownerId())
                                        .orElseThrow(() -> new UserNotFoundException(request.ownerId()));

                        List<InventoryEntity> existingInventories = inventoryRepository
                                        .findInventoryEntitiesByOwnerId(owner.getId());
                        if (existingInventories != null && !existingInventories.isEmpty()) {
                                InventoryEntity existingInventory = existingInventories.get(0);
                                String inventoryName = existingInventory.getName() != null ? existingInventory.getName() : "sin nombre";
                                throw new DomainConflictException(
                                        String.format("El usuario '%s' (ID: %d) ya tiene un inventario asignado como propietario: '%s' (ID: %d). Un usuario solo puede ser propietario de un inventario a la vez.",
                                                owner.getFullName() != null ? owner.getFullName() : owner.getEmail(),
                                                owner.getId(),
                                                inventoryName,
                                                existingInventory.getId())
                                );
                        }
                }

                // Validar que institutionId no sea null
                if (request.institutionId() == null) {
                        throw new DomainValidationException("La institución es obligatoria para crear un inventario");
                }

                InstitutionEntity institution = institutionRepository.findById(request.institutionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Institution not found with id " + request.institutionId()));

                // Validate that ADMIN_REGIONAL can only create inventories in their own regional
                UserEntity currentUser = authService.getCurrentUser();
                if (currentUser.getRole() == Role.ADMIN_REGIONAL) {
                    if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
                        throw new DomainValidationException("El administrador regional no tiene una institución o regional asignada");
                    }
                    
                    Long currentUserRegionalId = currentUser.getInstitution().getRegional().getId();
                    Long institutionRegionalId = institution.getRegional() != null ? institution.getRegional().getId() : null;
                    
                    if (institutionRegionalId == null || !institutionRegionalId.equals(currentUserRegionalId)) {
                        throw new DomainValidationException("Un administrador regional solo puede crear inventarios en su propia regional");
                    }
                }

                InventoryEntity inventory = InventoryMapper.fromCreateRequest(request);
                inventory.setOwner(owner);
                inventory.setInstitution(institution);

                InventoryEntity savedInventory = inventoryRepository.save(inventory);
                
                // Enviar notificación al dueño del inventario solo si existe
                if (owner != null) {
                        notificationService.sendInventoryCreatedNotification(
                                owner.getId(), 
                                savedInventory.getName(), 
                                savedInventory.getId()
                        );
                }
                
                // Enviar notificaciones informativas a otros usuarios relacionados
                sendInventoryCreatedInfoNotifications(savedInventory);
                
                // Registrar auditoría
                String ownerInfo = owner != null 
                        ? String.format("Propietario: %s (%s)", owner.getFullName(), owner.getEmail())
                        : "Sin propietario asignado";
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario creado: %s (ID: %d) - %s", 
                                savedInventory.getName() != null ? savedInventory.getName() : "sin nombre",
                                savedInventory.getId(),
                                ownerInfo)
                ));
                
                return InventoryMapper.toCreateResponse(savedInventory);
        }

        @Override
        public Page<InventoryResponse> listInventoryes(Pageable pageable) {
                return inventoryRepository.findAll(pageable)
                                .map(InventoryMapper::toResponse);
        }

        @Override
        public InventoryResponse getInventoryById(Long id) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public InventoryResponse deleteInventoryById(Long id) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                
                String inventoryName = inventory.getName() != null ? inventory.getName() : "sin nombre";
                String ownerName = inventory.getOwner() != null ? inventory.getOwner().getFullName() : "N/A";
                String ownerEmail = inventory.getOwner() != null ? inventory.getOwner().getEmail() : "N/A";
                
                // Validar que el inventario no tenga items asociados
                long itemsCount = itemRepository.findAllByInventoryId(id).size();
                if (itemsCount > 0) {
                    throw new DomainValidationException(
                            String.format("No se puede eliminar el inventario '%s' porque tiene %d item(s) asociado(s). Por favor, elimina o transfiere todos los items antes de eliminar el inventario.", 
                                    inventoryName, itemsCount)
                    );
                }
                
                // Validar que el inventario no tenga transferencias asociadas
                long transfersCount = transferRepository.findAllByInventory(id).size();
                if (transfersCount > 0) {
                    throw new DomainValidationException(
                            String.format("No se puede eliminar el inventario '%s' porque tiene %d transferencia(s) asociada(s). Por favor, elimina todas las transferencias antes de eliminar el inventario.", 
                                    inventoryName, transfersCount)
                    );
                }
                
                // Validar que el inventario no tenga préstamos activos asociados
                List<com.sgdis.backend.loan.infrastructure.entity.LoanEntity> loans = loanRepository.findAllByInventoryId(id);
                long activeLoansCount = loans.stream()
                        .filter(loan -> loan.getReturned() == null || !loan.getReturned())
                        .count();
                if (activeLoansCount > 0) {
                    throw new DomainValidationException(
                            String.format("No se puede eliminar el inventario '%s' porque tiene %d préstamo(s) activo(s) asociado(s). Por favor, finaliza todos los préstamos antes de eliminar el inventario.", 
                                    inventoryName, activeLoansCount)
                    );
                }
                
                // Guardar información del inventario antes de eliminarlo
                InventoryResponse response = InventoryMapper.toResponse(inventory);
                
                // Enviar notificaciones antes de eliminar el inventario
                sendInventoryDeletedNotifications(inventory);
                
                // Limpiar todas las relaciones bidireccionales antes de eliminar
                // IMPORTANTE: Hacer esto ANTES de intentar guardar o eliminar
                
                // 1. Limpiar signatories PRIMERO (el lado propietario está en UserEntity con @JoinTable)
                // Necesitamos limpiar ambas direcciones de la relación
                if (inventory.getSignatories() != null && !inventory.getSignatories().isEmpty()) {
                    List<UserEntity> signatories = new ArrayList<>(inventory.getSignatories());
                    for (UserEntity signatory : signatories) {
                        if (signatory != null && signatory.getId() != null) {
                            // Cargar el usuario desde la base de datos para evitar problemas de proxy
                            UserEntity loadedSignatory = userRepository.findById(signatory.getId())
                                    .orElse(null);
                            if (loadedSignatory != null) {
                                List<InventoryEntity> signatoryInventories = loadedSignatory.getMySignatories();
                                if (signatoryInventories != null) {
                                    signatoryInventories.removeIf(inv -> inv != null && inv.getId() != null && inv.getId().equals(id));
                                    loadedSignatory.setMySignatories(signatoryInventories);
                                    userRepository.save(loadedSignatory);
                                }
                            }
                        }
                    }
                }
                
                // 2. Limpiar managers (el lado propietario está en InventoryEntity con @JoinTable)
                // Simplemente limpiar la lista - Hibernate manejará la tabla de unión
                inventory.setManagers(new ArrayList<>());
                
                // 3. Limpiar owner (OneToOne - establecer a null)
                // Si hay un owner, limpiar la referencia inversa primero
                if (inventory.getOwner() != null && inventory.getOwner().getId() != null) {
                    UserEntity owner = userRepository.findById(inventory.getOwner().getId()).orElse(null);
                    if (owner != null && owner.getMyOwnedInventory() != null && 
                        owner.getMyOwnedInventory().getId() != null && 
                        owner.getMyOwnedInventory().getId().equals(id)) {
                        owner.setMyOwnedInventory(null);
                        userRepository.save(owner);
                    }
                }
                inventory.setOwner(null);
                
                // 4. Asegurarse de que las listas no sean null
                if (inventory.getSignatories() == null) {
                    inventory.setSignatories(new ArrayList<>());
                } else {
                    inventory.setSignatories(new ArrayList<>());
                }
                
                try {
                    // NO guardar el inventario antes de eliminar - esto puede causar problemas
                    // Simplemente eliminar directamente después de limpiar las relaciones
                    inventoryRepository.delete(inventory);
                } catch (org.hibernate.HibernateException e) {
                    // Capturar errores de Hibernate (incluye TransientObjectException) y convertirlos en mensajes claros
                    throw new DomainValidationException(
                            String.format("No se puede eliminar el inventario '%s' porque tiene relaciones activas con otros elementos del sistema (items, transferencias, préstamos, managers o signatories). Por favor, elimina o transfiere todos los elementos asociados antes de eliminar el inventario.", 
                                    inventoryName)
                    );
                } catch (Exception e) {
                    // Si hay otro tipo de error, verificar si es relacionado con relaciones
                    if (e.getMessage() != null && 
                        (e.getMessage().contains("TransientObjectException") || 
                         e.getMessage().contains("foreign key") ||
                         e.getMessage().contains("constraint"))) {
                        throw new DomainValidationException(
                                String.format("No se puede eliminar el inventario '%s' porque tiene relaciones activas con otros elementos del sistema. Por favor, elimina o transfiere todos los elementos asociados antes de eliminar el inventario.", 
                                        inventoryName)
                        );
                    }
                    // Si no es un error de relaciones, relanzar el error original
                    throw e;
                }
                
                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario eliminado: %s (ID: %d) - Propietario: %s (%s)", 
                                inventoryName, id, ownerName, ownerEmail)
                ));
                
                return response;
        }

        @Override
        @Transactional
        public UpdateInventoryResponse updateInventory(Long id, UpdateInventoryRequest request) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                
                // Validar que el inventario esté activo para actualizarlo
                // Permitir actualizar solo si se está cambiando el estado a activo
                boolean isOnlyActivating = !inventory.isStatus() 
                        && request.status() != null 
                        && request.status() == true
                        && (request.name() == null || request.name().equals(inventory.getName()))
                        && (request.location() == null || request.location().equals(inventory.getLocation()));
                
                if (!isOnlyActivating) {
                        validateInventoryIsActive(inventory, "actualizar");
                }
                
                String originalName = inventory.getName();
                String originalLocation = inventory.getLocation();
                boolean originalStatus = inventory.isStatus();
                
                InventoryEntity updatedInventory = InventoryMapper.fromUpdateRequest(request, inventory);
                updatedInventory = inventoryRepository.save(updatedInventory);
                
                // Registrar auditoría
                StringBuilder changes = new StringBuilder();
                if (request.name() != null && !request.name().equals(originalName)) {
                        changes.append("Nombre actualizado | ");
                }
                if (request.location() != null && !request.location().equals(originalLocation)) {
                        changes.append("Ubicación actualizada | ");
                }
                if (request.status() != null && request.status() != originalStatus) {
                        changes.append("Estado actualizado | ");
                }
                
                String changesDescription = changes.length() > 0 
                        ? changes.toString().substring(0, changes.length() - 3) 
                        : "Sin cambios";
                
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario actualizado: %s (ID: %d) - %s", 
                                updatedInventory.getName() != null ? updatedInventory.getName() : "sin nombre",
                                id,
                                changesDescription)
                ));
                
                return InventoryMapper.toUpdateResponse(updatedInventory);
        }

        @Override
        @Transactional
        public InventoryResponse updateInventoryOwner(Long inventoryId, UpdateInventoryOwnerRequest request) {
                if (request.ownerId() == null) {
                        throw new DomainValidationException("El ID del propietario es requerido");
                }

                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + inventoryId));
                
                // Validar que el inventario esté activo
                validateInventoryIsActive(inventory, "actualizar el propietario");

                UserEntity newOwner = userRepository.findById(request.ownerId())
                                .orElseThrow(() -> new UserNotFoundException(request.ownerId()));

                boolean isSameOwner = inventory.getOwner() != null
                                && inventory.getOwner().getId().equals(newOwner.getId());

                if (!isSameOwner) {
                        final Long currentInventoryId = inventory.getId();
                        List<InventoryEntity> existingInventories = inventoryRepository
                                        .findInventoryEntitiesByOwnerId(newOwner.getId());

                        boolean ownsOtherInventory = existingInventories.stream()
                                        .anyMatch(inv -> !inv.getId().equals(currentInventoryId));

                        if (ownsOtherInventory) {
                                throw new DomainConflictException("Este usuario ya es dueño de un inventario");
                        }

                        // Guardar información del propietario anterior para auditoría
                        String oldOwnerName = inventory.getOwner() != null ? inventory.getOwner().getFullName() : "N/A";
                        String oldOwnerEmail = inventory.getOwner() != null ? inventory.getOwner().getEmail() : "N/A";
                        
                        inventory.setOwner(newOwner);
                        inventory = inventoryRepository.save(inventory);
                        
                        // Enviar notificación al nuevo dueño del inventario
                        String inventoryName = inventory.getName() != null ? inventory.getName() : "sin nombre";
                        notificationService.sendInventoryAssignedNotification(
                                newOwner.getId(), 
                                inventoryName, 
                                inventory.getId()
                        );
                        
                        // Registrar auditoría
                        recordActionUseCase.recordAction(new RecordActionRequest(
                                String.format("Propietario de inventario actualizado: %s (ID: %d) - Anterior: %s (%s) → Nuevo: %s (%s)", 
                                        inventoryName,
                                        inventory.getId(),
                                        oldOwnerName,
                                        oldOwnerEmail,
                                        newOwner.getFullName(),
                                        newOwner.getEmail())
                        ));
                }

                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public InventoryResponse updateInventoryInstitution(Long inventoryId, UpdateInventoryInstitutionRequest request) {
                if (request.institutionId() == null) {
                        throw new DomainValidationException("El ID de la institución es requerido");
                }

                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + inventoryId));
                
                // Validar que el inventario esté activo
                validateInventoryIsActive(inventory, "actualizar la institución");

                InstitutionEntity institution = institutionRepository.findById(request.institutionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Institution not found with id " + request.institutionId()));

                String oldInstitutionName = inventory.getInstitution() != null ? inventory.getInstitution().getName() : "N/A";
                inventory.setInstitution(institution);
                inventory = inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Institución de inventario actualizada: %s (ID: %d) - Nueva institución: %s", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                institution.getName())
                ));

                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public AssignManagerInventoryResponse assignManagerInventory(AssignManagerInventoryRequest request) {
                UserEntity user = userRepository.findById(request.managerId())
                                .orElseThrow(() -> new UserNotFoundException(request.managerId()));

                InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));
                
                // Validar que el inventario esté activo
                validateInventoryIsActive(inventory, "asignar un manejador");

                if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
                    throw new DomainConflictException("Este usuario ya está asignado como firmante a este inventario");
                }

                if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
                    throw new DomainConflictException("Este usuario ya está asignado como manejador a este inventario");
                }

                if (user.getMyOwnedInventory() == inventory) {
                    throw new DomainConflictException("Este usuario ya está asignado como dueño a este inventario");
                }

                List<UserEntity> managers = inventory.getManagers();
                if (managers == null) {
                        managers = new java.util.ArrayList<>();
                        inventory.setManagers(managers);
                }

                if (!managers.contains(user)) {
                        managers.add(user);
                }

                inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Manejador asignado a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                user.getFullName(),
                                user.getEmail())
                ));

                // Enviar notificaciones
                sendManagerAssignedNotifications(inventory, user);

                return new AssignManagerInventoryResponse(
                                new AssignManagerInventoryUserResponse(user.getId(), user.getFullName(),
                                                user.getEmail()),
                                inventory.getUuid(),
                                "Assigned Inventory",
                                true);
        }

        @Override
        @Transactional
        public DeleteManagerInventoryResponse deleteManagerInventory(DeleteManagerInventoryRequest request) {
                UserEntity user = userRepository.findById(request.managerId())
                                .orElseThrow(() -> new UserNotFoundException(request.managerId()));

                InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));
                
                // Validar que el inventario esté activo
                validateInventoryIsActive(inventory, "eliminar un manejador");

                List<UserEntity> managers = inventory.getManagers();
                if (managers == null || !managers.contains(user)) {
                        throw new ResourceNotFoundException(
                                        "Manager not found in inventory with id: " + request.inventoryId());
                }

                // Remove manager
                managers.remove(user);
                inventory.setManagers(managers);
                inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Manejador eliminado de inventario: %s (ID: %d) - Manejador: %s (%s)", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                user.getFullName(),
                                user.getEmail())
                ));

                // Enviar notificaciones
                sendManagerRemovedNotifications(inventory, user);

                return new DeleteManagerInventoryResponse(
                                user.getId(),
                                user.getFullName(),
                                user.getEmail(),
                                inventory.getId(),
                                inventory.getName(),
                                "Manejador eliminado exitosamente",
                                true);
        }

        @Override
        public List<InventoryManagerResponse> getInventoryManagers(Long inventoryId) {
                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Este inventario no fue encontrado"));

                return inventory.getManagers().stream()
                                .map(manager -> new InventoryManagerResponse(
                                                manager.getId(),
                                                manager.getFullName(),
                                                manager.getEmail(),
                                                manager.getJobTitle(),
                                                manager.getLaborDepartment(),
                                                manager.getRole().name()))
                                .toList();
        }

        @Override
        public List<ManagedInventoryResponse> getAllManagedInventories(Long userId) {
                List<InventoryEntity> managedInventories = inventoryRepository.findInventoryEntitiesByManagerId(userId);
                return managedInventories.stream()
                                .map(inventory -> new ManagedInventoryResponse(
                                                inventory.getId(),
                                                inventory.getUuid(),
                                                inventory.getName(),
                                                inventory.getLocation(),
                                                inventory.getOwner() != null ? inventory.getOwner().getId() : null,
                                                inventory.getOwner() != null ? inventory.getOwner().getFullName()
                                                                : null,
                                                inventory.getOwner() != null ? inventory.getOwner().getEmail() : null,
                                                inventory.isStatus()))
                                .toList();
        }

        @Override
        public List<ManagedInventoryResponse> getMyManagedInventories() {
                UserEntity currentUser = authService.getCurrentUser();
                return getAllManagedInventories(currentUser.getId());
        }

        @Override
        public InventoryResponse findMyInventory() {
            UserEntity user = authService.getCurrentUser();

            InventoryEntity inventory = inventoryRepository.findInventoryEntityByOwner(user);

                if (inventory == null) {
                        return null;
                }

                return InventoryMapper.toResponse(inventoryRepository.findInventoryEntityByOwner(user));
        }

        @Override
        public QuitInventoryResponse quitInventory(Long inventoryId) {
            UserEntity user = authService.getCurrentUser();

            InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));
            
            // Validar que el inventario esté activo
            validateInventoryIsActive(inventory, "renunciar como manejador");

            List<UserEntity> managers = inventory.getManagers();
            if (managers == null || !managers.contains(user)) {
                throw new ResourceNotFoundException("Manager not found in inventory with id: " + inventoryId);
            }

            managers.remove(user);
            inventory.setManagers(managers);
            inventoryRepository.save(inventory);

            // Registrar auditoría
            recordActionUseCase.recordAction(new RecordActionRequest(
                    String.format("Manejador renunció a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                            inventory.getName() != null ? inventory.getName() : "sin nombre",
                            inventory.getId(),
                            user.getFullName(),
                            user.getEmail())
            ));

            return new QuitInventoryResponse("Ha renunciado exitosamente a este inventario", inventory.getName());
        }



    @Override
    @Transactional
    public AssignSignatoryInventoryResponse assignSignatoryInventory(AssignSignatoryInventoryRequest request) {
        UserEntity user = userRepository.findById(request.signatoryId())
                .orElseThrow(() -> new UserNotFoundException(request.signatoryId()));

        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado "));
        
        // Validar que el inventario esté activo
        validateInventoryIsActive(inventory, "asignar un firmante");

        if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
            throw new DomainConflictException("Este usuario ya está asignado como manejador a este inventario");
        }

        if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
            throw new DomainConflictException("Este usuario ya está asignado como firmante a este inventario");
        }

        if (user.getMyOwnedInventory() == inventory) {
            throw new DomainConflictException("Este usuario ya está asignado como dueño a este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories == null) {
            signatories = new java.util.ArrayList<>();
            inventory.setSignatories(signatories);
        }

        List<InventoryEntity> inventories = user.getMySignatories();
        if (inventories == null) {
            inventories = new java.util.ArrayList<>();
            user.setMySignatories(inventories);
        }

        if (!signatories.contains(user)) {
            signatories.add(user);
        }

        if (!inventories.contains(inventory)) {
            inventories.add(inventory);
        }

        userRepository.save(user);
        inventoryRepository.save(inventory);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante asignado a inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        // Enviar notificaciones
        sendSignatoryAssignedNotifications(inventory, user);

        return new AssignSignatoryInventoryResponse(
                new AssignSignatoryInventoryUserResponse(user.getId(), user.getFullName(), user.getEmail()),
                inventory.getUuid(),
                "Assigned Signatory",
                true
        );
    }

    @Override
    @Transactional
    public QuitInventoryResponse quitSignatoryInventory(Long inventoryId) {
        UserEntity user = authService.getCurrentUser();

        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encotrado"));
        
        // Validar que el inventario esté activo
        validateInventoryIsActive(inventory, "renunciar como firmante");

        List<InventoryEntity> userInventories = user.getMySignatories();

        boolean hasAccess = userInventories != null && userInventories.stream()
                .anyMatch(inv -> inv.getId().equals(inventoryId));

        if (!hasAccess) {
            throw new ResourceNotFoundException("Este usuario no es firmador en este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories != null) {
            signatories.remove(user);
            inventory.setSignatories(signatories);
            inventoryRepository.save(inventory);
        }

        userInventories.remove(inventory);
        user.setMySignatories(userInventories);
        userRepository.save(user);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante renunció a inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new QuitInventoryResponse(
                "Ha renunciado exitosamente al inventario " + inventory.getName(),
                inventory.getName()
        );
    }

    @Override
    @Transactional
    public DeleteSignatoryInventoryResponse deleteSignatoryInventory(DeleteSignatoryInventoryRequest request) {
        UserEntity user = userRepository.findById(request.signatoryId())
                .orElseThrow(() -> new UserNotFoundException(request.signatoryId()));

        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.inventoryId()));
        
        // Validar que el inventario esté activo
        validateInventoryIsActive(inventory, "eliminar un firmante");

        List<InventoryEntity> userInventories = user.getMySignatories();

        boolean hasAccess = userInventories != null && userInventories.stream()
                .anyMatch(inv -> inv.getId().equals(request.inventoryId()));

        if (!hasAccess) {
            throw new ResourceNotFoundException("Este usuario no es firmador en este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories != null) {
            signatories.remove(user);
            inventory.setSignatories(signatories);
            inventoryRepository.save(inventory);
        }

        List<InventoryEntity> inventorySignatories = user.getMySignatories();
        if (inventorySignatories != null) {
            inventorySignatories.remove(inventory);
            user.setMySignatories(inventorySignatories);
            userRepository.save(user);
        }

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante eliminado de inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        // Enviar notificaciones
        sendSignatoryRemovedNotifications(inventory, user);

        return new DeleteSignatoryInventoryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                inventory.getId(),
                inventory.getName(),
                "Firmador eliminado exitosamente",
                true
        );
    }

    @Override
    public List<InventoryResponse> getMySignatoryInventories() {
        UserEntity user = authService.getCurrentUser();

        if (user.getMySignatories() != null) {
            return user.getMySignatories().stream().map(InventoryMapper::toResponse).toList();
        }

        return List.of();
    }

    @Override
    public GetAllSignatoriesResponse getAllSignatories(GetAllSignatoriesRequest request) {
        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + request.inventoryId()));

        List<UserResponse> signatories = inventory.getSignatories() != null
                ? inventory.getSignatories().stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList())
                : List.of();

        return new GetAllSignatoriesResponse(
                InventoryMapper.toResponse(inventory),
                signatories
        );
    }

    @Override
    @Transactional
    public QuitInventoryResponse quitManagerInventory(Long inventoryId) {
        UserEntity user = authService.getCurrentUser();

        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                        .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));
        
        // Validar que el inventario esté activo
        validateInventoryIsActive(inventory, "renunciar como manejador");

        List<UserEntity> managers = inventory.getManagers();
        if (managers == null || !managers.contains(user)) {
                throw new ResourceNotFoundException("Este manejador no fue encontrado en este inventario");
        }

        managers.remove(user);
        inventory.setManagers(managers);
        inventoryRepository.save(inventory);

        List<InventoryEntity> inventoryEntities = user.getMyManagers();

        inventoryEntities.remove(inventory);
        user.setMyManagers(inventoryEntities);
        userRepository.save(user);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Manejador renunció a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new QuitInventoryResponse(
                        "Successfully quit as manager",
                        inventory.getName());
    }

    /**
     * Envía notificaciones a todos los usuarios relacionados cuando se elimina un inventario.
     * Se notifica a:
     * - Todos los superadmin
     * - Todos los admin regional de la misma regional del inventario
     * - Todos los admin institution de la misma institution del inventario
     * - Todos los warehouse de la misma institution del inventario
     * - El dueño del inventario
     * - Los firmadores del inventario
     * - Los manejadores del inventario
     * 
     * No se envía notificación al usuario que realiza la acción.
     */
    private void sendInventoryDeletedNotifications(InventoryEntity inventory) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del inventario
            if (fullInventory.getInstitution() != null && 
                fullInventory.getInstitution().getRegional() != null) {
                Long regionalId = fullInventory.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution y warehouse de la misma institution del inventario
            if (fullInventory.getInstitution() != null) {
                Long institutionId = fullInventory.getInstitution().getId();
                
                List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                        institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
            }
            
            // 4. Dueño del inventario
            if (fullInventory.getOwner() != null) {
                userIdsToNotify.add(fullInventory.getOwner().getId());
            }
            
            // 5. Firmadores del inventario - cargar usando consulta separada
            List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
            signatories.forEach(signatory -> {
                if (signatory != null && signatory.isStatus()) {
                    userIdsToNotify.add(signatory.getId());
                }
            });
            
            // 6. Manejadores del inventario - cargar usando consulta separada
            List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
            managers.forEach(manager -> {
                if (manager != null && manager.isStatus()) {
                    userIdsToNotify.add(manager.getId());
                }
            });
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
            String message = String.format("Se ha eliminado el inventario '%s'", inventoryName);
            
            NotificationMessage notification = new NotificationMessage(
                    "INVENTORY_DELETED",
                    "Inventario Eliminado",
                    message,
                    new InventoryNotificationData(fullInventory.getId(), inventoryName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "INVENTORY_DELETED",
                            "Inventario Eliminado",
                            message,
                            new InventoryNotificationData(fullInventory.getId(), inventoryName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la eliminación del inventario
            // El sistema de notificaciones no debe bloquear la eliminación
        }
    }
    
    /**
     * Envía notificaciones informativas a todos los usuarios relacionados cuando se crea un inventario.
     * Se notifica a:
     * - Todos los superadmin
     * - Todos los admin regional de la misma regional del inventario
     * - Todos los admin institution de la misma institution del inventario
     * - Todos los warehouse de la misma institution del inventario
     * - Los firmadores del inventario (si existen)
     * - Los manejadores del inventario (si existen)
     * 
     * No se envía notificación al usuario que realiza la acción ni al dueño (ya tiene su propia notificación).
     */
    private void sendInventoryCreatedInfoNotifications(InventoryEntity inventory) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del inventario
            if (fullInventory.getInstitution() != null && 
                fullInventory.getInstitution().getRegional() != null) {
                Long regionalId = fullInventory.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution y warehouse de la misma institution del inventario
            if (fullInventory.getInstitution() != null) {
                Long institutionId = fullInventory.getInstitution().getId();
                
                List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                        institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
            }
            
            // 4. Firmadores del inventario (si existen al momento de crear)
            if (fullInventory.getSignatories() != null && !fullInventory.getSignatories().isEmpty()) {
                fullInventory.getSignatories().forEach(signatory -> {
                    if (signatory != null && signatory.isStatus()) {
                        userIdsToNotify.add(signatory.getId());
                    }
                });
            }
            
            // 5. Manejadores del inventario (si existen al momento de crear)
            if (fullInventory.getManagers() != null && !fullInventory.getManagers().isEmpty()) {
                fullInventory.getManagers().forEach(manager -> {
                    if (manager != null && manager.isStatus()) {
                        userIdsToNotify.add(manager.getId());
                    }
                });
            }
            
            // Remover al usuario actual y al dueño de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            if (fullInventory.getOwner() != null) {
                userIdsToNotify.remove(fullInventory.getOwner().getId());
            }
            
            // Preparar datos de la notificación
            String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
            String ownerName = fullInventory.getOwner() != null && fullInventory.getOwner().getFullName() != null 
                    ? fullInventory.getOwner().getFullName() 
                    : "Sin propietario";
            String message = String.format("Se ha creado un nuevo inventario '%s' (Propietario: %s)", inventoryName, ownerName);
            
            NotificationMessage notification = new NotificationMessage(
                    "INVENTORY_CREATED_INFO",
                    "Nuevo Inventario Creado",
                    message,
                    new InventoryNotificationData(fullInventory.getId(), inventoryName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "INVENTORY_CREATED_INFO",
                            "Nuevo Inventario Creado",
                            message,
                            new InventoryNotificationData(fullInventory.getId(), inventoryName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la creación del inventario
            // El sistema de notificaciones no debe bloquear la creación
        }
    }
    
    /**
     * Envía notificaciones cuando se asigna un manejador a un inventario.
     * Notifica al nuevo manejador de manera personalizada y a los usuarios relacionados.
     */
    private void sendManagerAssignedNotifications(InventoryEntity inventory, UserEntity newManager) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificación personalizada para el nuevo manejador
            if (newManager != null && !newManager.getId().equals(currentUserId)) {
                String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
                String personalMessage = String.format("Has sido asignado como manejador del inventario '%s'", inventoryName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "MANAGER_ASSIGNED_PERSONAL",
                        "Asignado como Manejador",
                        personalMessage,
                        new InventoryNotificationData(fullInventory.getId(), inventoryName)
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            newManager.getId(),
                            "MANAGER_ASSIGNED_PERSONAL",
                            "Asignado como Manejador",
                            personalMessage,
                            new InventoryNotificationData(fullInventory.getId(), inventoryName)
                    );
                    notificationService.sendNotificationToUser(newManager.getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificar a los usuarios relacionados
            sendInventoryRoleChangeNotifications(fullInventory, currentUserId, newManager != null ? newManager.getId() : null, "MANAGER", "asignado");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se quita un manejador de un inventario.
     */
    private void sendManagerRemovedNotifications(InventoryEntity inventory, UserEntity removedManager) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificar a los usuarios relacionados
            sendInventoryRoleChangeNotifications(fullInventory, currentUserId, removedManager != null ? removedManager.getId() : null, "MANAGER", "eliminado");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se asigna un firmante a un inventario.
     * Notifica al nuevo firmante de manera personalizada y a los usuarios relacionados.
     */
    private void sendSignatoryAssignedNotifications(InventoryEntity inventory, UserEntity newSignatory) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificación personalizada para el nuevo firmante
            if (newSignatory != null && !newSignatory.getId().equals(currentUserId)) {
                String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
                String personalMessage = String.format("Has sido asignado como firmante del inventario '%s'", inventoryName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "SIGNATORY_ASSIGNED_PERSONAL",
                        "Asignado como Firmante",
                        personalMessage,
                        new InventoryNotificationData(fullInventory.getId(), inventoryName)
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            newSignatory.getId(),
                            "SIGNATORY_ASSIGNED_PERSONAL",
                            "Asignado como Firmante",
                            personalMessage,
                            new InventoryNotificationData(fullInventory.getId(), inventoryName)
                    );
                    notificationService.sendNotificationToUser(newSignatory.getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificar a los usuarios relacionados
            sendInventoryRoleChangeNotifications(fullInventory, currentUserId, newSignatory != null ? newSignatory.getId() : null, "SIGNATORY", "asignado");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se quita un firmante de un inventario.
     */
    private void sendSignatoryRemovedNotifications(InventoryEntity inventory, UserEntity removedSignatory) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificar a los usuarios relacionados
            sendInventoryRoleChangeNotifications(fullInventory, currentUserId, removedSignatory != null ? removedSignatory.getId() : null, "SIGNATORY", "eliminado");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones informativas a los usuarios relacionados cuando cambia un rol en el inventario.
     * Se notifica a:
     * - Los manejadores del inventario
     * - Los firmantes del inventario
     * - El dueño del inventario
     * - Los warehouse del centro al cual pertenece el inventario
     * - Los admin institution del centro al cual pertenece el inventario
     * 
     * No se envía notificación al usuario que realiza la acción ni al usuario afectado.
     */
    private void sendInventoryRoleChangeNotifications(InventoryEntity inventory, Long currentUserId, Long affectedUserId, String roleType, String action) {
        try {
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Dueño del inventario
            if (inventory.getOwner() != null) {
                userIdsToNotify.add(inventory.getOwner().getId());
            }
            
            // 2. Firmantes del inventario - cargar usando consulta separada
            List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
            signatories.forEach(signatory -> {
                if (signatory != null && signatory.isStatus()) {
                    userIdsToNotify.add(signatory.getId());
                }
            });
            
            // 3. Manejadores del inventario - cargar usando consulta separada
            List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
            managers.forEach(manager -> {
                if (manager != null && manager.isStatus()) {
                    userIdsToNotify.add(manager.getId());
                }
            });
            
            // 4. Warehouse del centro al cual pertenece el inventario
            if (inventory.getInstitution() != null) {
                Long institutionId = inventory.getInstitution().getId();
                
                List<UserEntity> warehouses = userRepository.findByInstitutionIdAndRole(institutionId, Role.WAREHOUSE);
                warehouses.forEach(warehouse -> userIdsToNotify.add(warehouse.getId()));
            }
            
            // 5. Admin institution del centro al cual pertenece el inventario
            if (inventory.getInstitution() != null) {
                Long institutionId = inventory.getInstitution().getId();
                
                List<UserEntity> adminInstitutions = userRepository.findByInstitutionIdAndRole(institutionId, Role.ADMIN_INSTITUTION);
                adminInstitutions.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // Remover al usuario actual y al usuario afectado de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            if (affectedUserId != null) {
                userIdsToNotify.remove(affectedUserId);
            }
            
            // Preparar datos de la notificación
            String inventoryName = inventory.getName() != null ? inventory.getName() : "Inventario sin nombre";
            String roleName = roleType.equals("MANAGER") ? "manejador" : "firmante";
            String message = String.format("Se ha %s un %s en el inventario '%s'", action, roleName, inventoryName);
            
            String notificationType = roleType.equals("MANAGER") 
                    ? (action.equals("asignado") ? "MANAGER_ASSIGNED" : "MANAGER_REMOVED")
                    : (action.equals("asignado") ? "SIGNATORY_ASSIGNED" : "SIGNATORY_REMOVED");
            
            String notificationTitle = roleType.equals("MANAGER")
                    ? (action.equals("asignado") ? "Manejador Asignado" : "Manejador Eliminado")
                    : (action.equals("asignado") ? "Firmante Asignado" : "Firmante Eliminado");
            
            NotificationMessage notification = new NotificationMessage(
                    notificationType,
                    notificationTitle,
                    message,
                    new InventoryNotificationData(inventory.getId(), inventoryName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    notificationPersistenceService.saveNotification(
                            userId,
                            notificationType,
                            notificationTitle,
                            message,
                            new InventoryNotificationData(inventory.getId(), inventoryName)
                    );
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }
    
    /**
     * DTO interno para datos del inventario en la notificación
     */
    private record InventoryNotificationData(
            Long inventoryId,
            String inventoryName
    ) {}
}
