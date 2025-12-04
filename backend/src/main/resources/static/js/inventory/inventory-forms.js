async function handleNewInventorySubmit(e) {
  e.preventDefault();

  const name = document.getElementById("newInventoryName").value;
  const location = document.getElementById("newInventoryLocation").value;
  
  // Get owner ID from CustomSelect or hidden input
  let ownerId = '';
  if (window.newInventoryOwnerSelect && window.newInventoryOwnerSelect.getValue) {
    ownerId = window.newInventoryOwnerSelect.getValue();
  }
  if (!ownerId) {
    const ownerIdElement = document.getElementById("newInventoryOwnerId");
    if (ownerIdElement) {
      ownerId = ownerIdElement.value;
    }
  }

  const requiresRegionalSelection =
    typeof window.shouldDisplayInventoryRegionalSelect === "function" &&
    window.shouldDisplayInventoryRegionalSelect();
  let regionalId = "";

  if (requiresRegionalSelection) {
    if (
      window.newInventoryRegionalSelect &&
      window.newInventoryRegionalSelect.getValue
    ) {
      regionalId = window.newInventoryRegionalSelect.getValue();
    }

    if (!regionalId) {
      const regionalIdElement = document.getElementById(
        "newInventoryRegionalId"
      );
      if (regionalIdElement) {
        regionalId = regionalIdElement.value;
      }
    }

    if (!regionalId || regionalId.trim() === "") {
      showErrorToast(
        "Regional requerida",
        "Por favor selecciona la regional para continuar"
      );
      return;
    }
  }

  // Get institution ID from CustomSelect or hidden input
  let institutionId = '';
  if (window.newInventoryInstitutionSelect && window.newInventoryInstitutionSelect.getValue) {
    institutionId = window.newInventoryInstitutionSelect.getValue();
  }
  if (!institutionId) {
    const institutionIdElement = document.getElementById("newInventoryInstitutionId");
    if (institutionIdElement) {
      institutionId = institutionIdElement.value;
    }
  }

  if (!name || !location) {
    showErrorToast(
      "Campos obligatorios",
      "Por favor complete todos los campos obligatorios"
    );
    return;
  }
  
  // Owner is now optional, so we skip validation
  
  if (!institutionId || institutionId.trim() === '') {
    showErrorToast(
      "Institución requerida",
      "Por favor selecciona la institución a la que pertenecerá el inventario"
    );
    return;
  }
  
  // Validate owner ID is a valid number (only if ownerId is provided)
  let numericOwnerId = null;
  if (ownerId && ownerId.trim() !== '') {
    numericOwnerId = parseInt(ownerId);
    if (isNaN(numericOwnerId)) {
      showErrorToast(
        "ID de propietario inválido",
        "El propietario seleccionado no es válido"
      );
      return;
    }
  }

  const numericInstitutionId = parseInt(institutionId);
  if (isNaN(numericInstitutionId)) {
    showErrorToast(
      "ID de institución inválido",
      "La institución seleccionada no es válida"
    );
    return;
  }

  // Validate inventory name length
  if (name.length < 3) {
    showErrorToast(
      "Nombre muy corto",
      "El nombre del inventario debe tener al menos 3 caracteres"
    );
    return;
  }

  if (name.length > 100) {
    showErrorToast(
      "Nombre muy largo",
      "El nombre del inventario no puede exceder 100 caracteres"
    );
    return;
  }

  // Validate location
  if (location.length < 3) {
    showErrorToast(
      "Ubicación muy corta",
      "La ubicación debe tener al menos 3 caracteres"
    );
    return;
  }

  if (location.length > 100) {
    showErrorToast(
      "Ubicación muy larga",
      "La ubicación no puede exceder 100 caracteres"
    );
    return;
  }

  try {
    const inventoryDataToCreate = {
      name: name.trim(),
      location: location.trim(),
      institutionId: numericInstitutionId,
    };

    // Only include ownerId if it's not null
    if (numericOwnerId !== null && numericOwnerId !== undefined) {
      inventoryDataToCreate.ownerId = numericOwnerId;
    }

    const result = await createInventory(inventoryDataToCreate);

    // Upload image if selected
    const imageInput = document.getElementById("newInventoryPhoto");
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      try {
        await window.uploadInventoryPhotoById(imageInput.files[0], result.id);
      } catch (imageError) {
        console.error("Error uploading inventory image:", imageError);
        // Don't fail the whole operation if image upload fails
      }
    }

    showSuccessToast("Inventario creado", "Inventario creado exitosamente");
    closeNewInventoryModal();
    await loadInventoryData();
  } catch (error) {
    console.error("Error creating inventory:", error);
    
    let errorMessage = error.message || "Inténtalo de nuevo.";
    
    // Mejorar mensajes de error específicos
    if (errorMessage.includes("ya tiene un inventario asignado") || 
        errorMessage.includes("ya tiene un inventorio") ||
        errorMessage.includes("already assigned")) {
      errorMessage = `El usuario seleccionado ya tiene un inventario asignado como propietario. Un usuario solo puede ser propietario de un inventario. Si necesitas asignar este inventario a este usuario, primero debes quitarle el inventario actual o asignar otro usuario como propietario.`;
    } else if (errorMessage.includes("409") || errorMessage.includes("Conflict")) {
      errorMessage = "No se puede crear el inventario: El usuario seleccionado ya tiene un inventario asignado como propietario.";
    }
    
    showErrorToast(
      "Error al crear inventario",
      errorMessage
    );
  }
}

async function handleEditInventorySubmit(e) {
  e.preventDefault();

  if (!inventoryData.currentInventoryId) {
    showEditErrorToast("No se ha seleccionado un inventario para editar");
    return;
  }

  const name = document.getElementById("editInventoryName").value;
  const location = document.getElementById("editInventoryLocation").value;
  const statusCheckbox = document.getElementById("editInventoryStatus");
  const status = statusCheckbox ? statusCheckbox.checked : true;

  if (!name || !location) {
    showEditErrorToast("Por favor complete todos los campos obligatorios");
    return;
  }

  // Validate inventory name length
  if (name.length < 3) {
    showEditErrorToast(
      "El nombre del inventario debe tener al menos 3 caracteres"
    );
    return;
  }

  if (name.length > 100) {
    showEditErrorToast(
      "El nombre del inventario no puede exceder 100 caracteres"
    );
    return;
  }

  // Validate location
  if (location.length < 3) {
    showEditErrorToast("La ubicación debe tener al menos 3 caracteres");
    return;
  }

  if (location.length > 100) {
    showEditErrorToast("La ubicación no puede exceder 100 caracteres");
    return;
  }

  try {
    const updateData = {
      id: inventoryData.currentInventoryId,
      name: name.trim(),
      location: location.trim(),
      status: status
    };

    const result = await updateInventory(
      inventoryData.currentInventoryId,
      updateData
    );

    showEditSuccessToast();
    closeEditInventoryModal();
    await loadInventoryData();
  } catch (error) {
    console.error("Error updating inventory:", error);

    let errorMessage = error.message || "Inténtalo de nuevo.";

    // Customize error messages based on the error
    if (errorMessage.includes("401") || errorMessage.includes("expired")) {
      errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("permission")
    ) {
      errorMessage = "No tienes permisos para actualizar este inventario.";
    } else if (errorMessage.includes("404")) {
      errorMessage = "Inventario no encontrado. Puede que haya sido eliminado.";
    } else if (
      errorMessage.includes("400") &&
      errorMessage.includes("validation")
    ) {
      errorMessage =
        "Los datos ingresados no son válidos. Verifica el formato.";
    }

    // Si el error es por inventario inactivo, usar showErrorToast directamente
    if (errorMessage.includes("inactivo") || errorMessage.includes("está inactivo")) {
      showErrorToast("Inventario inactivo", errorMessage);
    } else {
      showEditErrorToast(errorMessage);
    }
  }
}

function viewInventory(inventoryId) {
  const numericInventoryId =
    typeof inventoryId === "string" ? parseInt(inventoryId, 10) : inventoryId;
  
  // Get inventoryData from window if available
  const inventoryDataRef = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : null);
  
  if (inventoryDataRef && inventoryDataRef.inventories) {
    const inventory = inventoryDataRef.inventories.find(
      (i) => i && i.id === numericInventoryId
    );

    if (inventory) {
      if (typeof window.showViewInventoryModal === 'function') {
        window.showViewInventoryModal(inventoryId);
      } else if (typeof showViewInventoryModal === 'function') {
        showViewInventoryModal(inventoryId);
      } else {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast(
            "Error",
            "La función de visualización no está disponible. Por favor, recarga la página."
          );
        }
      }
    } else {
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast(
          "Inventario no encontrado",
          "El inventario ya no existe en la lista. Puede que ya haya sido eliminado."
        );
      }
    }
  } else {
    // If inventoryData is not available, try to show modal directly
    if (typeof window.showViewInventoryModal === 'function') {
      window.showViewInventoryModal(inventoryId);
    } else if (typeof showViewInventoryModal === 'function') {
      showViewInventoryModal(inventoryId);
    } else {
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast(
          "Error",
          "La función de visualización no está disponible. Por favor, recarga la página."
        );
      }
    }
  }
}

function editInventory(inventoryId) {
  if (typeof window.showEditInventoryModal === 'function') {
    window.showEditInventoryModal(inventoryId);
  } else if (typeof showEditInventoryModal === 'function') {
    showEditInventoryModal(inventoryId);
  } else {
    if (typeof window.showErrorToast === 'function') {
      window.showErrorToast(
        "Error",
        "La función de edición no está disponible. Por favor, recarga la página."
      );
    } else if (typeof showErrorToast === 'function') {
      showErrorToast(
        "Error",
        "La función de edición no está disponible. Por favor, recarga la página."
      );
    }
  }
}

async function confirmDeleteInventory() {
  if (!inventoryData.currentInventoryId) {
    showErrorToast(
      "Error",
      "No se ha seleccionado un inventario para eliminar"
    );
    return;
  }

  // Verificar que el inventario aún existe en la lista
  const currentInventory = inventoryData.inventories.find(
    (i) => i && i.id == inventoryData.currentInventoryId
  );
  if (!currentInventory) {
    showErrorToast(
      "Inventario no encontrado",
      "El inventario ya no existe en la lista. Puede que ya haya sido eliminado."
    );
    closeDeleteInventoryModal();
    return;
  }

  try {
    const result = await deleteInventory(inventoryData.currentInventoryId);

    showSuccessToast(
      "Inventario eliminado",
      "Inventario eliminado exitosamente"
    );
    closeDeleteInventoryModal();
    await loadInventoryData();
  } catch (error) {
    console.error("Error deleting inventory:", error);

    if (error.message && error.message.includes("contiene items asociados")) {
      showErrorToast(
        "No se puede eliminar",
        "Este inventario contiene items asociados. Transfiere o elimina los items primero."
      );
    } else {
      showErrorToast(
        "Error al eliminar inventario",
        error.message || "Inténtalo de nuevo."
      );
    }
  }
}

function showInventoryAssignment(inventoryId) {
  const numericInventoryId =
    typeof inventoryId === "string" ? parseInt(inventoryId, 10) : inventoryId;
  const inventory = inventoryData.inventories.find(
    (i) => i && i.id === numericInventoryId
  );

  if (inventory) {
    if (typeof window.showAssignInventoryModal === 'function') {
      window.showAssignInventoryModal(inventoryId);
    } else if (typeof showAssignInventoryModal === 'function') {
      showAssignInventoryModal(inventoryId);
    } else {
      showErrorToast(
        "Error",
        "La función de asignación no está disponible. Por favor, recarga la página."
      );
    }
  } else {
    showErrorToast("Inventario no encontrado", "Inventario no encontrado");
  }
}

function showInventoryManagerAssignment(inventoryId) {
  const numericInventoryId =
    typeof inventoryId === "string" ? parseInt(inventoryId, 10) : inventoryId;
  
  // Get inventoryData from window if available
  const inventoryDataRef = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : null);
  
  if (inventoryDataRef && inventoryDataRef.inventories) {
    const inventory = inventoryDataRef.inventories.find(
      (i) => i && i.id === numericInventoryId
    );

    if (inventory) {
      if (typeof window.showAssignManagerModal === 'function') {
        window.showAssignManagerModal(inventoryId);
      } else if (typeof showAssignManagerModal === 'function') {
        showAssignManagerModal(inventoryId);
      } else {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast(
            "Error",
            "La función de asignación de rol no está disponible. Por favor, recarga la página."
          );
        }
      }
    } else {
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast("Inventario no encontrado", "Inventario no encontrado");
      }
    }
  } else {
    // If inventoryData is not available, try to show modal directly
    if (typeof window.showAssignManagerModal === 'function') {
      window.showAssignManagerModal(inventoryId);
    } else if (typeof showAssignManagerModal === 'function') {
      showAssignManagerModal(inventoryId);
    } else {
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast(
          "Error",
          "La función de asignación de rol no está disponible. Por favor, recarga la página."
        );
      }
    }
  }
}

async function handleAssignInventorySubmit(e) {
  e.preventDefault();

  if (!inventoryData.currentInventoryId) {
    showAssignErrorToast("No se ha seleccionado un inventario para asignar");
    return;
  }

  // Try to get value from CustomSelect first, then fallback to hidden input
  let userId = "";

  if (window.assignUserSelect && window.assignUserSelect.getValue) {
    userId = window.assignUserSelect.getValue();
  }

  // Fallback to hidden input if CustomSelect value is empty
  if (!userId) {
    const userIdElement = document.getElementById("assignUserId");
    if (userIdElement) {
      userId = userIdElement.value;
    }
  }

  if (!userId || userId.trim() === "") {
    showAssignErrorToast("Por favor selecciona un usuario para la asignación");
    return;
  }

  // Validate userId is a valid number
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) {
    showAssignErrorToast("ID de usuario inválido");
    return;
  }

  // Validate inventoryId is a valid number
  const numericInventoryId = parseInt(inventoryData.currentInventoryId);
  if (isNaN(numericInventoryId)) {
    showAssignErrorToast("ID de inventario inválido");
    console.error("Invalid inventory ID:", inventoryData.currentInventoryId);
    return;
  }

  try {
    const assignmentData = {
      inventoryId: numericInventoryId, // Backend expects numeric ID (Long)
      userId: numericUserId,
    };

    console.log('Asignando inventario:', assignmentData);
    const result = await assignInventory(assignmentData);

    showAssignSuccessToast();
    closeAssignInventoryModal();
    await loadInventoryData();
  } catch (error) {
    console.error("Error assigning inventory:", error);

    let errorMessage = error.message || "Inténtalo de nuevo.";

    // Customize error messages based on the error
    if (errorMessage.includes("401") || errorMessage.includes("expired")) {
      errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("permission")
    ) {
      errorMessage = "No tienes permisos para asignar este inventario.";
    } else if (errorMessage.includes("404")) {
      errorMessage = "Usuario o inventario no encontrado.";
    } else if (
      errorMessage.includes("400") &&
      errorMessage.includes("validation")
    ) {
      errorMessage = "Los datos de asignación no son válidos.";
    } else if (
      errorMessage.includes("ya tiene un inventario") ||
      errorMessage.includes("ya tiene un inventorio") ||
      errorMessage.includes("already assigned")
    ) {
      errorMessage = "Este usuario ya tiene un inventario asignado.";
    }

    showAssignErrorToast(errorMessage);
  }
}

async function handleAssignManagerSubmit(e) {
  e.preventDefault();

  if (!inventoryData.currentInventoryId) {
    showAssignManagerErrorToast(
      "No se ha seleccionado un inventario para asignar roles"
    );
    return;
  }

  // Get user ID from CustomSelect or hidden input
  let userId = "";
  if (window.roleUserSelect && window.roleUserSelect.getValue) {
    userId = window.roleUserSelect.getValue();
  }
  if (!userId) {
    const userIdElement = document.getElementById("roleUserId");
    if (userIdElement) {
      userId = userIdElement.value;
    }
  }

  // Get selected role
  const selectedRoleElement = document.getElementById("selectedRole");
  const selectedRole = selectedRoleElement ? selectedRoleElement.value : "";

  // Validate user selection
  if (!userId || userId.trim() === "") {
    showAssignManagerErrorToast(
      "Por favor selecciona un usuario para asignar el rol"
    );
    return;
  }

  // Validate role selection
  if (!selectedRole || selectedRole.trim() === "") {
    showAssignManagerErrorToast(
      "Por favor selecciona un rol (Manejador o Firmante)"
    );
    return;
  }

  // Validate user ID
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) {
    showAssignManagerErrorToast("ID de usuario inválido");
    return;
  }

  try {
    // Store inventory ID before closing modal and ensure it's a number
    const assignedInventoryId = parseInt(inventoryData.currentInventoryId);
    
    // Validate that inventory ID is a valid number
    if (isNaN(assignedInventoryId)) {
      showAssignManagerErrorToast("ID de inventario inválido");
      console.error("Invalid inventory ID:", inventoryData.currentInventoryId);
      return;
    }

    // Execute assignment based on selected role (backend expects numeric ID, not UUID)
    if (selectedRole === "manager") {
      const managerData = {
        inventoryId: assignedInventoryId, // Numeric ID (Long)
        managerId: numericUserId,
      };
      
      await assignManager(managerData);
      showAssignManagerSuccessToast();
    } else if (selectedRole === "signatory") {
      const signatoryData = {
        inventoryId: assignedInventoryId, // Numeric ID (Long)
        signatoryId: numericUserId,
      };
      
      await assignSignatory(signatoryData);
      showAssignSignatorySuccessToast();
    } else {
      showAssignManagerErrorToast("Rol inválido seleccionado");
      return;
    }

    // Close modal and reload data
    closeAssignManagerModal();
    await loadInventoryData();

    // Check if inventory tree modal is open and update it
    const treeModal = document.getElementById("inventoryTreeModal");
    if (
      treeModal &&
      !treeModal.classList.contains("hidden") &&
      window.inventoryTreeState &&
      window.inventoryTreeState.currentInventoryId === assignedInventoryId
    ) {
      // Add a small delay to ensure backend has processed the assignment
      setTimeout(async () => {
        try {
          // Refresh the tree using the new dedicated function
          if (window.refreshInventoryTree) {
            await window.refreshInventoryTree();
          }
        } catch (error) {
          console.error("Error refreshing inventory tree:", error);
        }
      }, 500);
    }
  } catch (error) {
    console.error("Error assigning role:", error);

    let errorMessage = error.message || "Inténtalo de nuevo.";

    // Si el error es por inventario inactivo, usar showErrorToast directamente
    if (errorMessage.includes("inactivo") || errorMessage.includes("está inactivo")) {
      showErrorToast("Inventario inactivo", errorMessage);
      return;
    }

    // Customize error messages based on the error
    if (errorMessage.includes("401") || errorMessage.includes("expired")) {
      errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("permission")
    ) {
      errorMessage = "No tienes permisos para asignar roles a este inventario.";
    } else if (errorMessage.includes("404")) {
      errorMessage = "Usuario o inventario no encontrado.";
    } else if (
      errorMessage.includes("400") &&
      errorMessage.includes("validation")
    ) {
      errorMessage = "Los datos de asignación no son válidos.";
    } else if (
      errorMessage.includes("already assigned") ||
      errorMessage.includes("ya asignado") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("duplicado") ||
      errorMessage.includes("ya existe") ||
      errorMessage.includes("already exists")
    ) {
      errorMessage =
        "Este usuario ya tiene un rol asignado en este inventario. No se pueden asignar roles duplicados.";
    } else if (errorMessage.includes("Ha ocurrido un error inesperado")) {
      errorMessage =
        "No se pudo asignar el rol. Es posible que el usuario ya tenga un rol asignado en este inventario.";
    }

    if (selectedRole === "manager") {
      showAssignManagerErrorToast(errorMessage);
    } else {
      showAssignSignatoryErrorToast(errorMessage);
    }
  }
}

// Export functions to make them available globally
// Ensure functions are available immediately for onclick handlers
if (typeof window !== 'undefined') {
    window.handleNewInventorySubmit = handleNewInventorySubmit;
    window.editInventory = editInventory;
    window.viewInventory = viewInventory;
    window.showInventoryAssignment = showInventoryAssignment;
    window.showInventoryManagerAssignment = showInventoryManagerAssignment;
    window.confirmDeleteInventory = confirmDeleteInventory;
    
    // Also make sure they're available as direct references
    if (typeof window.viewInventory !== 'function') {
        window.viewInventory = viewInventory;
    }
    if (typeof window.editInventory !== 'function') {
        window.editInventory = editInventory;
    }
    if (typeof window.showInventoryManagerAssignment !== 'function') {
        window.showInventoryManagerAssignment = showInventoryManagerAssignment;
    }
}
