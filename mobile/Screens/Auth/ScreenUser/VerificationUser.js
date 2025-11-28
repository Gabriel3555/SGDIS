// src/Screens/Verification.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/ThemeContext";
import api from "../../../src/Navigation/Services/Connection";
import { ensureAuthToken } from "../../../src/Navigation/Services/AuthSession";
import * as ImagePicker from "expo-image-picker";
import { Camera, CameraView } from "expo-camera";

export default function Verification() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationMode, setVerificationMode] = useState("serial");
  const [verificationInput, setVerificationInput] = useState("");
  const [itemPreview, setItemPreview] = useState(null);
  const [itemPreviewLoading, setItemPreviewLoading] = useState(false);
  const [itemPreviewError, setItemPreviewError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoriesLoading, setInventoriesLoading] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasScannerPermission, setHasScannerPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationsError, setVerificationsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewVerification, setPreviewVerification] = useState(null);

  useEffect(() => {
    loadInventories();
  }, []);

  useEffect(() => {
    if (selectedInventory) {
      fetchVerifications(selectedInventory);
    } else {
      setVerifications([]);
      setLoading(false);
    }
  }, [selectedInventory]);

  const handleManualRefresh = async () => {
    if (!selectedInventory) {
      return;
    }
    setRefreshing(true);
    await fetchVerifications(selectedInventory, { showLoader: false });
    setRefreshing(false);
  };

  const loadInventories = async () => {
    try {
      setInventoriesLoading(true);
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get("api/v1/users/me/inventories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];
      setInventories(data);

      if (data.length === 0) {
        setSelectedInventory(null);
      } else {
        setSelectedInventory((current) => {
          if (!current) {
            return data[0];
          }

          const next = data.find(
                  (inventory) =>
                    (current.id && inventory.id === current.id) ||
                    (current.uuid && inventory.uuid === current.uuid)
                ) || data[0];

          return next;
        });
      }
    } catch (error) {
      console.error("Error loading inventories:", error);
      Alert.alert("Error", "No se pudieron cargar los inventarios asignados.");
    } finally {
      setInventoriesLoading(false);
    }
  };

  const fetchVerifications = async (inventory, options = {}) => {
    const { showLoader = true } = options;

    if (!inventory?.id) {
      setVerifications([]);
      if (showLoader) setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }
      setVerificationsError(null);
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get(
        `api/v1/verifications/inventories/${inventory.id}/verifications/latest`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            limit: 50,
          },
        }
      );

      setVerifications(response.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching verifications:", error);
      const status = error.response?.status;
      const message =
        status === 404
          ? "No hay verificaciones registradas en este inventario todavía."
          : "No se pudieron cargar las verificaciones. Intenta nuevamente.";
      setVerifications([]);
      setVerificationsError(message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const resetVerificationModalState = () => {
    setVerificationInput("");
    setItemPreview(null);
    setItemPreviewError(null);
    setSelectedVerification(null);
  };

  const openVerificationModal = (mode, presetValue = "") => {
    setVerificationMode(mode);
    setVerificationInput(presetValue);
    setVerificationModalVisible(true);
    setItemPreview(null);
    setItemPreviewError(null);
    setSelectedVerification(null);
    if (presetValue) {
      fetchItemPreview(presetValue, mode);
    }
  };

  const closeVerificationModal = () => {
    setVerificationModalVisible(false);
    resetVerificationModalState();
  };

  const openPreviewModal = (verification) => {
    setPreviewVerification(verification);
    setPreviewModalVisible(true);
  };

  const closePreviewModal = () => {
    setPreviewVerification(null);
    setPreviewModalVisible(false);
  };

  const fetchItemPreview = async (value = verificationInput, mode = verificationMode) => {
    const cleanValue = value?.trim();
    if (!cleanValue) {
      setItemPreview(null);
      setItemPreviewError("Ingresa un valor válido para buscar.");
      return;
    }

    try {
      setItemPreviewLoading(true);
      setItemPreviewError(null);
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const encodedValue = encodeURIComponent(cleanValue);
      const endpoint =
        mode === "serial"
          ? `api/v1/items/serial/${encodedValue}`
          : `api/v1/items/licence-plate/${encodedValue}`;

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItemPreview(response.data);
    } catch (error) {
      console.error("Error fetching item preview:", error);
      const message =
        error.response?.data?.message ||
        (error.response?.status === 404
          ? "No se encontró un ítem con ese identificador."
          : "No se pudo obtener la información del ítem. Intenta de nuevo.");
      setItemPreview(null);
      setItemPreviewError(message);
    } finally {
      setItemPreviewLoading(false);
    }
  };

  const handleCreateVerification = async () => {
    if (!selectedInventory) {
      Alert.alert("Inventario requerido", "Selecciona un inventario para realizar la verificación.");
      return;
    }

    const cleanValue = verificationInput?.trim();
    if (!cleanValue) {
      Alert.alert("Error", "Debes ingresar un valor válido.");
      return;
    }

    if (!itemPreview) {
      Alert.alert("Item requerido", "Primero busca el ítem para confirmar la información.");
      return;
    }

    try {
      setActionLoading(true);
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const endpoint =
        verificationMode === "serial"
          ? "api/v1/verifications/by-serial"
          : "api/v1/verifications/by-licence-plate";
      const payload =
        verificationMode === "serial"
          ? { serial: cleanValue }
          : { licencePlateNumber: cleanValue };

      const { data } = await api.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const verificationSummary = {
        verificationId: data.verificationId,
        itemLicencePlateNumber: itemPreview?.licencePlateNumber || cleanValue,
      };

      setSelectedVerification(verificationSummary);
      Alert.alert(
        "Éxito",
        "Verificación creada. Ahora puedes subir la evidencia desde este mismo modal."
      );
      fetchVerifications(selectedInventory);
    } catch (error) {
      console.error("Error creating verification:", error);
      Alert.alert("Error", error.response?.data?.message || "No se pudo crear la verificación.");
    } finally {
      setActionLoading(false);
    }
  };

  const normalizedQuery = search.trim().toLowerCase();
  const filteredData = verifications.filter((item) => {
    if (!normalizedQuery) return true;
    const byPlate = item.itemLicencePlateNumber?.toLowerCase().includes(normalizedQuery);
    const byUser = item.userFullName?.toLowerCase().includes(normalizedQuery);
    const byId = item.itemId?.toString().includes(normalizedQuery);
    return byPlate || byUser || byId;
  });

  const styles = getStyles(colors);
  const hasInventorySelected = Boolean(selectedInventory);

  const renderItem = ({ item }) => (
    <View style={styles.verificationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemImage}>
          {item.photoUrls && item.photoUrls.length > 0 ? (
            <Image source={{ uri: item.photoUrls[0] }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={24} style={styles.photoPlaceholderIcon} />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.plateSection}>
              <Text style={styles.plateNumber}>{item.itemLicencePlateNumber || 'Sin placa'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: "#4caf50" }]}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.statusText}>Verificado</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => openPreviewModal(item)}
            >
              <Ionicons name="eye-outline" size={20} style={styles.viewButtonIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemName}>Item ID: {item.itemId}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="scan-outline" size={14} style={styles.detailIcon} />
              <Text style={styles.detailText}>Verificación</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="images-outline" size={14} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.photoUrls ? item.photoUrls.length : 0} fotos</Text>
            </View>
          </View>
          <View style={styles.verifierRow}>
            <Ionicons name="person-outline" size={14} style={styles.verifierIcon} />
            <Text style={styles.verifierText}>
              Verificado por {item.userFullName} • {new Date(item.verifiedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Found":
        return { backgroundColor: "#4caf50" };
      case "Moved":
        return { backgroundColor: "#2196f3" };
      case "Not Found":
        return { backgroundColor: "#f44336" };
      case "Damaged":
        return { backgroundColor: "#ff9800" };
      default:
        return { backgroundColor: "#666" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Found":
        return "checkmark-circle";
      case "Moved":
        return "arrow-forward-circle";
      case "Not Found":
        return "close-circle";
      case "Damaged":
        return "warning";
      default:
        return "help-circle";
    }
  };

  const getSerialFromItem = (item) => {
    if (!item?.attributes) {
      return null;
    }
    return (
      item.attributes.SERIAL ||
      item.attributes.Serial ||
      item.attributes.serial ||
      item.attributes?.SerialNumber ||
      null
    );
  };

  const createVerificationBySerial = async (serial, options = {}) => {
    const { skipModalReset = false } = options;

    try {
      setActionLoading(true);
      if (!selectedInventory) {
        Alert.alert("Inventario requerido", "Selecciona un inventario para realizar la verificación.");
        return;
      }

      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const cleanSerial = serial?.trim();
      if (!cleanSerial) {
        Alert.alert("Error", "Debes ingresar un número de serial válido.");
        return;
      }

      await api.post("api/v1/verifications/by-serial", { serial: cleanSerial }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Verificación creada exitosamente");
      if (!skipModalReset) {
        setSerialModalVisible(false);
      }
      setInputValue("");
      fetchVerifications(selectedInventory); // Refresh the list
    } catch (error) {
      console.error("Error creating verification by serial:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al crear verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const createVerificationByLicencePlate = async (licencePlateNumber, options = {}) => {
    const { skipModalReset = false } = options;

    try {
      setActionLoading(true);
      if (!selectedInventory) {
        Alert.alert("Inventario requerido", "Selecciona un inventario para realizar la verificación.");
        return;
      }

      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const cleanLicencePlate = licencePlateNumber?.trim();
      if (!cleanLicencePlate) {
        Alert.alert("Error", "Debes ingresar un número de placa válido.");
        return;
      }

      await api.post("api/v1/verifications/by-licence-plate", { licencePlateNumber: cleanLicencePlate }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Verificación creada exitosamente");
      if (!skipModalReset) {
        setLicencePlateModalVisible(false);
      }
      setInputValue("");
      fetchVerifications(selectedInventory); // Refresh the list
    } catch (error) {
      console.error("Error creating verification by licence plate:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al crear verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const ensureVerificationAvailable = () => {
    if (!selectedVerification) {
      Alert.alert("Verificación requerida", "Primero registra una verificación para este ítem.");
      return false;
    }
    return true;
  };

  const uploadEvidence = async (verificationId, imageUri) => {
    try {
      setActionLoading(true);
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      // Create form data
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const file = {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      };
      formData.append('file', file);

      const response = await api.post(`api/v1/verifications/${verificationId}/evidence`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert("Éxito", "Evidencia subida exitosamente");
      closeVerificationModal();
      fetchVerifications(selectedInventory); // Refresh the list
    } catch (error) {
      console.error("Error uploading evidence:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al subir evidencia");
    } finally {
      setActionLoading(false);
    }
  };

  const pickImage = async () => {
    if (!ensureVerificationAvailable()) {
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para subir evidencia');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadEvidence(selectedVerification.verificationId, result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!ensureVerificationAvailable()) {
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadEvidence(selectedVerification.verificationId, result.assets[0].uri);
    }
  };

  const openScanner = async () => {
    try {
      if (!selectedInventory) {
        Alert.alert("Inventario requerido", "Selecciona un inventario antes de escanear una placa.");
        return;
      }

      setHasScannerPermission(null);
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setHasScannerPermission(false);
        Alert.alert("Permiso requerido", "Se necesita acceder a la cámara para escanear la placa.");
        return;
      }

      setHasScannerPermission(true);
      setScannerVisible(true);
      setIsScanning(false);
    } catch (error) {
      console.error("Error opening scanner:", error);
      Alert.alert("Error", "No se pudo abrir el escáner. Intenta de nuevo.");
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (isScanning) {
      return;
    }

    setIsScanning(true);
    setScannerVisible(false);

    const scannedPlate = data?.trim();
    if (!scannedPlate) {
      Alert.alert("Código inválido", "No se detectó un número de placa válido.");
      setIsScanning(false);
      return;
    }

    // Abrir modal prellenado con el valor escaneado
    setTimeout(() => {
      openVerificationModal("plate", scannedPlate);
      setIsScanning(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-done-circle" size={24} style={styles.headerIconInner} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Verificación</Text>
              <Text style={styles.headerSubtitle}>Verifica ubicación y estado de items</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.scanButton, !selectedInventory && styles.scanButtonDisabled]}
            onPress={openScanner}
            disabled={!selectedInventory}
          >
            <Ionicons name="scan" size={24} style={styles.scanButtonIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inventory Selector */}
      <View style={styles.inventorySection}>
        <View style={styles.inventoryHeader}>
          <Text style={styles.inventoryTitle}>Inventarios asignados</Text>
          <TouchableOpacity onPress={loadInventories} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={18} color={colors.icon} />
          </TouchableOpacity>
        </View>
        {inventoriesLoading ? (
          <View style={styles.inventoryLoading}>
            <ActivityIndicator size="small" color={colors.buttonBackground} />
            <Text style={styles.inventoryHint}>Cargando inventarios...</Text>
          </View>
        ) : inventories.length === 0 ? (
          <Text style={styles.inventoryHint}>No tienes inventarios asignados.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {inventories.map((inventory) => {
              const selectedKey = selectedInventory?.id ?? selectedInventory?.uuid;
              const inventoryKey = inventory.id ?? inventory.uuid;
              const isSelected = selectedKey !== undefined && selectedKey !== null
                ? selectedKey === inventoryKey
                : inventory.id === selectedInventory?.id;
              return (
                <TouchableOpacity
                  key={inventoryKey || inventory.id || inventory.uuid}
                  style={[styles.inventoryChip, isSelected && styles.inventoryChipActive]}
                  onPress={() => setSelectedInventory(inventory)}
                >
                  <Ionicons
                    name="cube-outline"
                    size={18}
                    color={isSelected ? "#fff" : colors.icon}
                    style={styles.inventoryChipIcon}
                  />
                  <View>
                    <Text style={[styles.inventoryChipTitle, isSelected && styles.inventoryChipTitleActive]}>
                      {inventory.name || `Inventario ${inventory.id}`}
                    </Text>
                    <Text style={[styles.inventoryChipSubtitle, isSelected && styles.inventoryChipSubtitleActive]}>
                      {inventory.location || "Sin ubicación"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por placa o item..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} style={styles.searchIcon} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.barcodeButton, !selectedInventory && styles.barcodeButtonDisabled]}
          onPress={openScanner}
          disabled={!selectedInventory}
        >
          <Ionicons name="barcode-outline" size={20} color={colors.buttonText} />
          <Text style={styles.barcodeText}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsSection}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!selectedInventory || actionLoading) && styles.actionButtonDisabled,
          ]}
          onPress={() => openVerificationModal("serial")}
          disabled={!selectedInventory || actionLoading}
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Verificar por Serial</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!selectedInventory || actionLoading) && styles.actionButtonDisabled,
          ]}
          onPress={() => openVerificationModal("plate")}
          disabled={!selectedInventory || actionLoading}
        >
          <Ionicons name="car-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Verificar por Placa</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Última actualización</Text>
            <Text style={styles.summaryValueSmall}>
              {lastUpdated ? lastUpdated.toLocaleTimeString() : "Pendiente"}
            </Text>
          </View>
          <TouchableOpacity style={styles.summaryRefresh} onPress={handleManualRefresh}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {verificationsError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText}>{verificationsError}</Text>
        </View>
      )}

      {/* Verification List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Historial de Verificación</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.buttonBackground} />
            <Text style={styles.loadingText}>Cargando verificaciones...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => {
              // Use verificationId if available, otherwise fallback to index
              if (item?.verificationId != null) {
                return item.verificationId.toString();
              }
              // Fallback to a combination of itemId and index if verificationId is missing
              const itemId = item?.itemId != null ? item.itemId.toString() : 'unknown';
              return `${itemId}-${index}`;
            }}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.placeholder} />
                <Text style={styles.emptyText}>No hay verificaciones disponibles</Text>
                <TouchableOpacity
                  style={styles.emptyCTA}
                  onPress={() => openVerificationModal("serial")}
                >
                  <Text style={styles.emptyCTAText}>Registrar primera verificación</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scannerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setScannerVisible(false)}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Escanear Placa</Text>
            <Text style={styles.modalSubtitle}>Alinea el código de barras dentro del recuadro</Text>
            <View style={styles.scannerBox}>
              {hasScannerPermission === null ? (
                <View style={styles.scannerMessageContainer}>
                  <ActivityIndicator size="large" color={colors.buttonBackground} />
                  <Text style={styles.scannerMessage}>Solicitando permisos...</Text>
                </View>
              ) : hasScannerPermission === false ? (
                <View style={styles.scannerMessageContainer}>
                  <Ionicons name="alert-circle" size={32} color="#ff9800" />
                  <Text style={styles.scannerMessage}>
                    No se otorgó acceso a la cámara. Habilítalo en los ajustes para poder escanear.
                  </Text>
                </View>
              ) : (
                <View style={styles.barcodeWrapper}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: [
                        "code128",
                        "code39",
                        "ean13",
                        "ean8",
                        "qr",
                        "upc_a",
                        "upc_e",
                      ],
                    }}
                  />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setScannerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verification Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closePreviewModal}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalle de verificación</Text>
            {previewVerification ? (
              <>
                <Text style={styles.previewMeta}>
                  Placa: {previewVerification.itemLicencePlateNumber || "Sin placa"}
                </Text>
                <Text style={styles.previewMeta}>
                  Verificado por: {previewVerification.userFullName || "Desconocido"}
                </Text>
                <Text style={styles.previewMeta}>
                  Fecha:{" "}
                  {previewVerification.verifiedAt
                    ? new Date(previewVerification.verifiedAt).toLocaleString()
                    : "Sin fecha"}
                </Text>
                <View style={styles.previewPhotosWrapper}>
                  <Text style={styles.previewPhotosTitle}>Evidencias</Text>
                  {previewVerification.photoUrls && previewVerification.photoUrls.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {previewVerification.photoUrls.map((url, index) => (
                        <Image
                          key={index}
                          source={{ uri: url.startsWith("http") ? url : `https://sgdis.cloud${url}` }}
                          style={styles.previewPhoto}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.previewNoPhoto}>
                      <Ionicons name="images-outline" size={28} color={colors.placeholder} />
                      <Text style={styles.previewNoPhotoText}>Sin evidencia cargada</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color={colors.buttonBackground} />
            )}
            <TouchableOpacity style={styles.modalCancelButton} onPress={closePreviewModal}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVerificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeVerificationModal}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {verificationMode === "serial" ? "Verificar por Serial" : "Verificar por Placa"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Ingresa el {verificationMode === "serial" ? "serial" : "número de placa"} del ítem
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                verificationMode === "serial"
                  ? "Ej: SN-123456"
                  : "Ej: PLACA-001"
              }
              value={verificationInput}
              onChangeText={(text) => {
                setVerificationInput(text);
                setItemPreview(null);
                setItemPreviewError(null);
                setSelectedVerification(null);
              }}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => fetchItemPreview()}
              disabled={itemPreviewLoading || !verificationInput.trim()}
            >
              {itemPreviewLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>Buscar ítem</Text>
              )}
            </TouchableOpacity>

            {itemPreviewError && (
              <Text style={styles.previewError}>{itemPreviewError}</Text>
            )}

            {itemPreview && (
              <View style={styles.previewCard}>
                <View style={styles.previewImageWrapper}>
                  {itemPreview.urlImg ? (
                    <Image
                      source={{ uri: `https://sgdis.cloud${itemPreview.urlImg}` }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={colors.placeholder} />
                    </View>
                  )}
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{itemPreview.productName || "Sin nombre"}</Text>
                  <Text style={styles.previewDetail}>
                    Ubicación: {itemPreview.location || "Sin ubicación"}
                  </Text>
                  <Text style={styles.previewDetail}>
                    Placa: {itemPreview.licencePlateNumber || "Sin placa"}
                  </Text>
                  <Text style={styles.previewDetail}>
                    Serial: {getSerialFromItem(itemPreview) || "Sin serial"}
                  </Text>
                  <Text style={styles.previewDetail}>
                    Valor: $
                    {itemPreview.acquisitionValue
                      ? itemPreview.acquisitionValue.toLocaleString("es-CO")
                      : "0"}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                (!itemPreview || actionLoading) && styles.modalButtonDisabled,
              ]}
              onPress={handleCreateVerification}
              disabled={!itemPreview || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>Registrar verificación</Text>
              )}
            </TouchableOpacity>

            <View style={styles.evidenceInlineSection}>
              <Text style={styles.evidenceInlineTitle}>Evidencia fotográfica</Text>
              <Text style={styles.evidenceInlineHint}>
                {selectedVerification
                  ? "Sube evidencia para la verificación registrada."
                  : "Registra la verificación para habilitar la subida de evidencia."}
              </Text>
              <View style={styles.evidenceInlineButtons}>
                <TouchableOpacity
                  style={[
                    styles.evidenceInlineButton,
                    (!selectedVerification || actionLoading) && styles.evidenceInlineButtonDisabled,
                  ]}
                  onPress={takePhoto}
                  disabled={!selectedVerification || actionLoading}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.evidenceInlineButtonText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.evidenceInlineButton,
                    (!selectedVerification || actionLoading) && styles.evidenceInlineButtonDisabled,
                  ]}
                  onPress={pickImage}
                  disabled={!selectedVerification || actionLoading}
                >
                  <Ionicons name="images" size={20} color="#fff" />
                  <Text style={styles.evidenceInlineButtonText}>Galería</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCancelButton} onPress={closeVerificationModal}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header Styles
  header: {
    backgroundColor: colors.card,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: colors.statCard2, // Light green background that adapts to theme
  },
  headerIconInner: {
    color: '#4caf50', // Keep the icon green
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.institution,
  },
  scanButton: {
    padding: 8,
  },
  scanButtonDisabled: {
    opacity: 0.4,
  },
  scanButtonIcon: {
    color: colors.icon,
  },

  // Inventory Section
  inventorySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  inventoryLoading: {
    flexDirection: "row",
    alignItems: "center",
  },
  inventoryHint: {
    fontSize: 13,
    color: colors.institution,
    marginLeft: 8,
  },
  inventoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  inventoryChipActive: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  inventoryChipIcon: {
    marginRight: 10,
  },
  inventoryChipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  inventoryChipSubtitle: {
    fontSize: 12,
    color: colors.institution,
  },
  inventoryChipTitleActive: {
    color: "#fff",
  },
  inventoryChipSubtitleActive: {
    color: "#f1f1f1",
  },

  // Search Section
  searchSection: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
    color: colors.icon,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  barcodeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  barcodeButtonDisabled: {
    opacity: 0.5,
  },
  barcodeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  // List Section
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    marginTop: 10,
  },
  list: {
    paddingBottom: 20,
  },

  // Verification Cards
  verificationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
  },
  itemImage: {
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
  },
  photoPlaceholderIcon: {
    color: colors.placeholder,
  },
  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  plateSection: {
    flex: 1,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewButton: {
    padding: 8,
  },
  viewButtonIcon: {
    color: colors.icon,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailIcon: {
    color: colors.icon,
  },
  detailText: {
    fontSize: 13,
    color: colors.institution,
    marginLeft: 4,
  },
  verifierRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifierIcon: {
    color: colors.icon,
  },
  verifierText: {
    fontSize: 12,
    color: colors.institution,
    marginLeft: 4,
  },

  // Action Buttons Section
  actionButtonsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 10,
    textAlign: "center",
  },
  emptyCTA: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#28a745",
  },
  emptyCTAText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.institution,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    marginRight: 8,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#28a745",
    alignItems: "center",
    marginLeft: 8,
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    width: "100%",
    backgroundColor: "#28a745",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalPrimaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  previewError: {
    marginTop: 8,
    color: "#f44336",
    textAlign: "center",
  },
  previewCard: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  previewImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewInfo: {
    flex: 1,
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 13,
    color: colors.institution,
  },
  evidenceInlineSection: {
    width: "100%",
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
  },
  evidenceInlineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  evidenceInlineHint: {
    fontSize: 12,
    color: colors.institution,
    marginBottom: 12,
  },
  evidenceInlineButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  evidenceInlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  evidenceInlineButtonDisabled: {
    opacity: 0.5,
  },
  evidenceInlineButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  previewMeta: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  previewPhotosWrapper: {
    width: "100%",
    marginTop: 16,
  },
  previewPhotosTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  previewPhoto: {
    width: 120,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: colors.inputBackground,
  },
  previewNoPhoto: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  previewNoPhotoText: {
    marginTop: 6,
    color: colors.institution,
  },
  evidenceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  evidenceButton: {
    flex: 1,
    backgroundColor: "#007bff",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  evidenceButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.institution,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.inputBorder,
    marginHorizontal: 16,
  },
  summaryRefresh: {
    marginLeft: "auto",
    backgroundColor: "#28a745",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryHint: {
    fontSize: 12,
    color: colors.institution,
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f44336",
  },
  errorBannerText: {
    color: "#fff",
    flex: 1,
    fontSize: 13,
  },
  scannerContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  scannerBox: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  barcodeWrapper: {
    width: "100%",
    height: "100%",
  },
  scannerMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scannerMessage: {
    marginTop: 10,
    textAlign: "center",
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
});
