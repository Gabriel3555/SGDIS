# 📋 Tarjeta Trello: Crear/Mejorar Función de Verificación por Lotes (Frontend)

## 📝 Descripción

Desarrollar y mejorar la funcionalidad completa de verificación por lotes en el frontend del sistema SGDIS, permitiendo a los usuarios verificar múltiples ítems de manera eficiente mediante escaneo de códigos QR/placas, captura de fotos automática, y gestión de evidencias. La función debe incluir una interfaz intuitiva con modal dedicado, escáner de cámara integrado, gestión de lista de ítems escaneados, adjuntar evidencias por ítem, y procesamiento en lote con feedback visual del progreso.

El sistema debe soportar tanto escaneo automático con cámara como entrada manual de placas, validar que los ítems pertenezcan a los inventarios del usuario, capturar fotos automáticamente al escanear, permitir adjuntar evidencias adicionales por ítem, y mostrar resultados detallados del proceso de verificación. La interfaz debe ser responsive, accesible, y proporcionar una experiencia fluida tanto en desktop como en dispositivos móviles.

---

## ✅ Criterios de Aceptación

### 1. **Interfaz de Usuario Completa y Funcional**
- Debe existir un botón visible en la página de verificaciones para abrir el modal de verificación por lotes
- El modal debe tener un diseño moderno, responsive y fácil de usar con secciones claramente definidas
- Debe incluir una sección de escáner de cámara con controles para iniciar/detener la cámara y capturar fotos manualmente
- Debe mostrar una lista en tiempo real de los ítems escaneados con información: placa, nombre del ítem, foto capturada, evidencia adjuntada, y timestamp
- Debe incluir un campo de entrada manual para agregar placas sin usar la cámara
- Debe mostrar contadores visuales: cantidad de ítems escaneados, cantidad pendientes de finalizar
- El botón de finalizar debe estar deshabilitado cuando no hay ítems escaneados y mostrar el conteo de ítems a procesar

### 2. **Funcionalidad de Escaneo y Captura**
- El escáner debe usar la biblioteca Html5Qrcode para leer códigos QR/placas desde la cámara
- Debe implementar un sistema de cooldown (2 segundos) para prevenir escaneos duplicados del mismo código
- Al detectar un código válido, debe buscar automáticamente el ítem en el sistema y validar que pertenece a los inventarios del usuario
- Debe capturar automáticamente una foto del frame de video cuando se escanea un código válido
- Debe mostrar notificaciones toast apropiadas: éxito al escanear, error si el ítem no se encuentra, advertencia si ya fue escaneado
- Debe permitir captura manual de fotos con un botón dedicado cuando la cámara está activa
- Debe manejar correctamente los permisos de cámara y mostrar mensajes de error si no están disponibles

### 3. **Gestión de Lista de Ítems Escaneados**
- Cada ítem en la lista debe mostrar: miniatura de foto (si existe), placa, nombre del ítem, fecha/hora de escaneo
- Debe permitir eliminar ítems individuales de la lista antes de finalizar
- Debe permitir adjuntar evidencias adicionales (imágenes, PDFs, documentos) por cada ítem escaneado
- Debe permitir tomar fotos de evidencia directamente con la cámara del dispositivo
- Debe validar el tamaño de archivos de evidencia y comprimir imágenes grandes automáticamente si es necesario
- Debe mostrar un indicador visual cuando un ítem tiene evidencia adjuntada
- La lista debe actualizarse en tiempo real cuando se agregan, eliminan o modifican ítems

### 4. **Procesamiento y Finalización**
- Al finalizar, debe enviar todos los ítems escaneados al endpoint `/api/v1/verifications/batch` usando FormData
- Debe mostrar un estado de carga durante el procesamiento con indicador de progreso
- Debe procesar las evidencias adicionales después de crear las verificaciones, subiéndolas al endpoint `/api/v1/verifications/{id}/evidence`
- Debe mostrar resultados detallados: cantidad exitosa, cantidad fallida, y detalles de los ítems que fallaron
- Debe manejar errores de forma elegante mostrando mensajes descriptivos según el tipo de error
- Debe recargar automáticamente la lista de verificaciones después de un proceso exitoso
- Debe cerrar el modal y resetear el estado después de finalizar exitosamente

### 5. **Validaciones y Manejo de Errores**
- Debe validar que el usuario tenga inventarios asignados antes de permitir verificación por lotes
- Debe validar que cada placa escaneada pertenezca a los inventarios del usuario (owner, manager, o signatory)
- Debe prevenir agregar placas duplicadas a la lista
- Debe validar el formato de placas (solo letras y números, sin caracteres especiales)
- Debe manejar errores de red, timeouts, y respuestas del servidor de forma apropiada
- Debe mostrar mensajes de error específicos: "Placa no encontrada", "Item no está en tu inventario", "Error de conexión", etc.
- Debe manejar casos donde algunos ítems se procesan exitosamente y otros fallan (procesamiento parcial)
- Debe validar que los archivos de evidencia no excedan el tamaño máximo permitido (5MB)

---

## 🚀 Pasos para Realizarlo

### Paso 1: **Diseño y Estructura de la Interfaz (HTML/CSS)**
- Crear el archivo HTML del modal de verificación por lotes en las páginas de verificaciones (`verification.html`, `verification-superadmin.html`, etc.)
- Diseñar la estructura del modal con secciones: escáner de cámara, lista de ítems escaneados, controles de acción
- Crear el botón en la página principal de verificaciones que abra el modal de verificación por lotes
- Implementar el diseño responsive del modal usando Tailwind CSS siguiendo el estilo del resto de la aplicación
- Agregar indicadores visuales: contador de ítems escaneados, estado de la cámara (activa/inactiva), indicador de progreso
- Crear la estructura HTML para la lista de ítems escaneados con tarjetas que muestren: foto, placa, nombre, timestamp
- Agregar campos de entrada: campo manual para placas, inputs de archivo para evidencias
- Implementar estilos para estados: éxito, error, advertencia, carga, consistentes con el diseño del sistema
- Asegurar que el modal sea completamente responsive y funcione correctamente en dispositivos móviles

### Paso 2: **Implementación del Escáner y Captura de Códigos**
- Crear el archivo JavaScript `verification-batch.js` para la lógica de verificación por lotes
- Integrar la biblioteca Html5Qrcode en las páginas HTML (incluir el CDN o archivo local)
- Implementar la función `startBatchScanner()` para inicializar la cámara y comenzar el escaneo
- Implementar la función `stopBatchScanner()` para detener la cámara y limpiar recursos
- Crear la función `handleScannedCode()` que procesa los códigos escaneados con validación de cooldown (2 segundos)
- Implementar la función `getItemByLicencePlate()` para buscar ítems en el sistema mediante el endpoint `/api/v1/items/licence-plate/{plate}`
- Crear la función `capturePhotoForScannedCode()` que captura automáticamente una foto del frame de video cuando se escanea un código válido
- Implementar la función `captureFrameToCanvas()` que convierte el frame de video a imagen usando Canvas API
- Agregar manejo de permisos de cámara con mensajes de error apropiados si no están disponibles
- Implementar la función `addManualPlate()` para agregar placas manualmente sin usar la cámara

### Paso 3: **Gestión de Estado y Lista de Ítems Escaneados**
- Crear el objeto de estado `batchVerificationState` que almacene: lista de ítems escaneados, instancia de Html5Qrcode, estado de escaneo, último código escaneado
- Implementar la función `addScannedItem()` que agrega un ítem a la lista con su placa, nombre, foto, y timestamp
- Crear la función `updateScannedItemsList()` que renderiza dinámicamente la lista de ítems escaneados en el DOM
- Implementar la función `removeScannedItem()` para eliminar ítems individuales de la lista antes de finalizar
- Crear la función `resetBatchVerificationState()` que limpia el estado cuando se abre/cierra el modal
- Implementar funciones para abrir y cerrar el modal: `showBatchVerificationModal()` y `closeBatchVerificationModal()`
- Agregar validación para prevenir duplicados: verificar si una placa ya está en la lista antes de agregarla
- Implementar actualización en tiempo real de contadores: cantidad de ítems escaneados, estado del botón de finalizar

### Paso 4: **Gestión de Evidencias y Procesamiento en Lote**
- Implementar la función `handleEvidenceChange()` para adjuntar archivos de evidencia a cada ítem escaneado
- Crear la función `handleEvidenceCameraChange()` para capturar fotos de evidencia directamente con la cámara
- Implementar la función de compresión de imágenes que reduzca el tamaño de archivos grandes (máximo 5MB) manteniendo calidad aceptable
- Agregar validación de tipos de archivo permitidos: imágenes (JPG, PNG), PDFs, documentos (DOC, DOCX)
- Crear la función `removeEvidence()` para eliminar evidencias adjuntadas antes de finalizar
- Implementar la función `finalizeBatchVerification()` que:
  - Prepara FormData con las placas escaneadas y sus fotos
  - Envía la petición POST al endpoint `/api/v1/verifications/batch`
  - Procesa la respuesta y muestra resultados (exitosos, fallidos)
  - Sube evidencias adicionales al endpoint `/api/v1/verifications/{id}/evidence` para cada verificación exitosa
- Agregar indicadores de progreso durante el procesamiento y subida de evidencias
- Implementar manejo de errores específicos: red, timeout, validación del servidor, procesamiento parcial

### Paso 5: **Integración, Validaciones y Pruebas**
- Integrar con el sistema de notificaciones toast existente para mostrar mensajes de éxito, error y advertencia
- Implementar validación inicial: verificar que el usuario tenga inventarios asignados antes de permitir verificación por lotes
- Agregar validación de formato de placas: solo letras y números, sin caracteres especiales
- Implementar validación de pertenencia: verificar que cada placa pertenezca a los inventarios del usuario (el backend valida, pero el frontend debe mostrar mensajes claros)
- Crear función de limpieza de recursos: detener cámara, liberar memoria de imágenes, resetear estado al cerrar el modal
- Implementar manejo de estados de carga con indicadores visuales apropiados durante todas las operaciones
- Agregar funciones exportadas al objeto `window` para que sean accesibles desde los event handlers del HTML
- Probar la funcionalidad en diferentes navegadores: Chrome, Firefox, Safari, Edge
- Probar en dispositivos móviles reales para verificar que la cámara funciona correctamente
- Realizar tests manuales de todos los flujos: escaneo exitoso, escaneo con errores, entrada manual, finalización parcial, manejo de evidencias
- Documentar el código y cualquier limitación conocida o comportamiento esperado

---

## 📌 Notas Adicionales

- El endpoint del backend `/api/v1/verifications/batch` debe estar disponible y funcional para recibir las verificaciones por lotes
- La biblioteca Html5Qrcode debe estar incluida en las páginas HTML (CDN o archivo local) para que funcione el escáner de códigos
- El endpoint `/api/v1/items/licence-plate/{plate}` debe estar disponible para buscar ítems por placa
- El endpoint `/api/v1/verifications/{id}/evidence` debe estar disponible para subir evidencias adicionales después de crear verificaciones
- La validación de permisos de inventario se hace en el backend, pero el frontend debe mostrar mensajes claros cuando falla
- Las fotos capturadas automáticamente se envían como parte del FormData al crear las verificaciones en el endpoint batch
- Las evidencias adicionales se suben en una segunda fase después de crear las verificaciones, una por cada verificación exitosa
- Considerar agregar funcionalidad futura de importar lista de placas desde un archivo CSV/Excel si es requerido
- Considerar agregar funcionalidad futura de "guardar borrador" para poder continuar una verificación por lotes más tarde
- El sistema debe manejar correctamente el caso donde el usuario cierra el modal sin finalizar (los datos se pierden, a menos que se implemente guardado de borrador)

