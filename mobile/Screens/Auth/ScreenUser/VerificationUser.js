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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";
import * as ImagePicker from "expo-image-picker";

export default function Verification() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serialModalVisible, setSerialModalVisible] = useState(false);
  const [licencePlateModalVisible, setLicencePlateModalVisible] = useState(false);
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
        return;
      }

      // TODO: Get inventoryId - for now using a placeholder
      const inventoryId = 1; // This should be obtained from user data or route params

      const response = await api.get(`api/v1/verifications/inventories/${inventoryId}/verifications/latest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 50,
        },
      });

      setVerifications(response.data || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      Alert.alert("Error", "No se pudieron cargar las verificaciones");
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = verifications.filter(item =>
    item.licencePlateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.itemName?.toLowerCase().includes(search.toLowerCase())
  );

  const styles = getStyles(colors);

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
              onPress={() => {
                setSelectedVerification(item);
                setEvidenceModalVisible(true);
              }}
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

  const createVerificationBySerial = async (serial) => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
        return;
      }

      const response = await api.post("api/v1/verifications/by-serial", { serial }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Verificación creada exitosamente");
      setSerialModalVisible(false);
      setInputValue("");
      fetchVerifications(); // Refresh the list
    } catch (error) {
      console.error("Error creating verification by serial:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al crear verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const createVerificationByLicencePlate = async (licencePlateNumber) => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
        return;
      }

      const response = await api.post("api/v1/verifications/by-licence-plate", { licencePlateNumber }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Verificación creada exitosamente");
      setLicencePlateModalVisible(false);
      setInputValue("");
      fetchVerifications(); // Refresh the list
    } catch (error) {
      console.error("Error creating verification by licence plate:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al crear verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const uploadEvidence = async (verificationId, imageUri) => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
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
      setEvidenceModalVisible(false);
      setSelectedVerification(null);
      fetchVerifications(); // Refresh the list
    } catch (error) {
      console.error("Error uploading evidence:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al subir evidencia");
    } finally {
      setActionLoading(false);
    }
  };

  const pickImage = async () => {
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
          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="scan" size={24} style={styles.scanButtonIcon} />
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity style={styles.barcodeButton}>
          <Ionicons name="barcode-outline" size={20} color={colors.buttonText} />
          <Text style={styles.barcodeText}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSerialModalVisible(true)}
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Verificar por Serial</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setLicencePlateModalVisible(true)}
        >
          <Ionicons name="car-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Verificar por Placa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (verifications.length === 0) {
              Alert.alert("Error", "No hay verificaciones disponibles para subir evidencia");
              return;
            }
            setSelectedVerification(verifications[0]); // Default to first verification
            setEvidenceModalVisible(true);
          }}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Subir Evidencia</Text>
        </TouchableOpacity>
      </View>

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
            keyExtractor={(item) => item.verificationId.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.placeholder} />
                <Text style={styles.emptyText}>No hay verificaciones disponibles</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Serial Input Modal */}
      <Modal
        visible={serialModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSerialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verificar por Serial</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingrese el número de serial"
              value={inputValue}
              onChangeText={setInputValue}
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setSerialModalVisible(false);
                  setInputValue("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => createVerificationBySerial(inputValue)}
                disabled={actionLoading || !inputValue.trim()}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verificar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Licence Plate Input Modal */}
      <Modal
        visible={licencePlateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLicencePlateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verificar por Placa</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingrese el número de placa"
              value={inputValue}
              onChangeText={setInputValue}
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setLicencePlateModalVisible(false);
                  setInputValue("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => createVerificationByLicencePlate(inputValue)}
                disabled={actionLoading || !inputValue.trim()}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verificar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Evidence Upload Modal */}
      <Modal
        visible={evidenceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEvidenceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Subir Evidencia</Text>
            {selectedVerification && (
              <Text style={styles.modalSubtitle}>
                Verificación: {selectedVerification.itemLicencePlateNumber}
              </Text>
            )}
            <View style={styles.evidenceButtons}>
              <TouchableOpacity
                style={styles.evidenceButton}
                onPress={takePhoto}
                disabled={actionLoading}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.evidenceButtonText}>Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.evidenceButton}
                onPress={pickImage}
                disabled={actionLoading}
              >
                <Ionicons name="images" size={24} color="#fff" />
                <Text style={styles.evidenceButtonText}>Seleccionar de Galería</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setEvidenceModalVisible(false);
                setSelectedVerification(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
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
  scanButtonIcon: {
    color: colors.icon,
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
});
