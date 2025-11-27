// src/Screens/Inventary.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../src/Navigation/Services/Connection";
import { ensureAuthToken } from "../../../src/Navigation/Services/AuthSession";
import { useTheme } from "../../../src/ThemeContext";

export default function Inventary({ navigation }) {
   const { colors } = useTheme();
   const [inventories, setInventories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
   const [showQuitModal, setShowQuitModal] = useState(false);
   const [selectedInventoryId, setSelectedInventoryId] = useState(null);
   const [ownerInventories, setOwnerInventories] = useState([]);
   const [assignedInventories, setAssignedInventories] = useState([]);
   const [managerInventories, setManagerInventories] = useState([]);
   const [expandedOwner, setExpandedOwner] = useState(true);
   const [expandedAssigned, setExpandedAssigned] = useState(false);
   const [expandedManager, setExpandedManager] = useState(false);

   const styles = getStyles(colors);

  useEffect(() => {
    fetchInventories();
    fetchOwnerInventories();
    fetchAssignedInventories();
    fetchManagerInventories();
  }, []);

  const fetchItemStats = async (inventoryId, token) => {
    try {
      const response = await api.get(`api/v1/items/inventory/${inventoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 0,
          size: 1000, // Fetch up to 1000 items to calculate stats
        },
      });

      const pageData = response.data;
      const total = pageData.totalElements || 0;
      const items = pageData.content || [];

      // Calculate stats
      const activos = total; // Assuming all items are active
      const mantenimiento = 0; // No maintenance status available
      const valor = items.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);

      return {
        total,
        activos,
        mantenimiento,
        valor: valor.toFixed(2), // Format as currency
      };
    } catch (error) {
      // Handle server errors gracefully by returning default stats
      return {
        total: 0,
        activos: 0,
        mantenimiento: 0,
        valor: '0.00',
      };
    }
  };

  const handleQuitConfirm = async () => {
    setShowQuitModal(false);
    const inventoryId = selectedInventoryId;
    setSelectedInventoryId(null);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.post(`api/v1/inventory/quitManager/${inventoryId}`, { inventoryId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Has renunciado como manager del inventario");
      // Refetch inventories to update the list
      fetchManagerInventories();
      fetchAssignedInventories();
      fetchOwnerInventories();
    } catch (error) {
      console.error("Error quitting manager:", error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      Alert.alert("Error", `No se pudo renunciar como manager: ${status || 'Desconocido'} - ${message}`);
    }
  };

  const fetchOwnerInventories = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) return;
      const response = await api.get("api/v1/inventory/myInventory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        const inventory = response.data;
        const stats = await fetchItemStats(inventory.id, token);
        setOwnerInventories([{ ...inventory, stats }]);
      } else {
        setOwnerInventories([]);
      }
    } catch (error) {
      console.error("Error fetching owner inventories:", error);
      setOwnerInventories([]);
    }
  };

  const fetchAssignedInventories = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) return;
      const response = await api.get("api/v1/inventory/myManagedInventories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let data = response.data || [];
      if (!Array.isArray(data)) {
        data = [];
      }
      data = data.filter(item => item && typeof item === 'object' && item.id !== undefined);
      const inventoriesWithStats = await Promise.all(
        data.map(async (inventory) => {
          const stats = await fetchItemStats(inventory.id, token);
          return { ...inventory, stats };
        })
      );
      setAssignedInventories(inventoriesWithStats);
    } catch (error) {
      console.error("Error fetching assigned inventories:", error);
      setAssignedInventories([]);
    }
  };

  const fetchManagerInventories = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) return;
      const response = await api.get("api/v1/inventory/mySignatoryInventories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Manager inventories response:", response.data);
      let data = response.data || [];
      if (!Array.isArray(data)) {
        data = [];
      }
      data = data.filter(item => item && typeof item === 'object' && item.id !== undefined);
      const inventoriesWithStats = await Promise.all(
        data.map(async (inventory) => {
          const stats = await fetchItemStats(inventory.id, token);
          return { ...inventory, stats };
        })
      );
      setManagerInventories(inventoriesWithStats);
    } catch (error) {
      console.error("Error fetching manager inventories:", error);
      setManagerInventories([]);
    }
  };

  const fetchInventories = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get("api/v1/users/me/inventories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = response.data || [];
      if (!Array.isArray(data)) {
        data = [];
      }

      console.log(data);

      data = data.filter(item => item && typeof item === 'object' && item.id !== undefined);

      // Fetch stats for each inventory
      const inventoriesWithStats = await Promise.all(
        data.map(async (inventory) => {
          const stats = await fetchItemStats(inventory.id, token);
          return {
            ...inventory,
            stats,
          };
        })
      );

      setInventories(inventoriesWithStats);
    } catch (error) {
      console.error("Error fetching inventories:", error);
      const status = error.response?.status;
      if (status >= 500) {
        // Handle server errors by assuming no inventories assigned
        setInventories([]);
      } else {
        const message = error.response?.data?.message || error.message;
        Alert.alert("Error", `No se pudo cargar los inventarios: ${status || 'Desconocido'} - ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInventoryCard = (item) => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    return (
      <View key={item.id} style={styles.inventoryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="business" size={20} color={colors.icon} />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.cardTitle}>{item.name || 'Sin nombre'}</Text>
              <Text style={styles.cardLocation}>{item.location || 'Sin ubicación'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.icon} />
            <Text style={styles.statusText}>Activo</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>Dueño de inventario {item.ownerName || 'Sin propietario'}</Text>

        <View style={styles.responsibleSection}>
          <Ionicons name="person-outline" size={14} color={colors.icon} />
          <Text style={styles.responsibleText}>{item.ownerName || 'Sin propietario'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>{item.stats?.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.subtitle }]}>{item.stats?.activos || 0}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.institution }]}>{item.stats?.mantenimiento || 0}</Text>
            <Text style={styles.statLabel}>Mantenimiento</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>${item.stats?.valor || '0.00'}</Text>
            <Text style={styles.statLabel}>Valor</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.updateInfo}>
            <Ionicons name="time-outline" size={14} color={colors.icon} />
            <Text style={styles.updateText}>ID: {item.id || 'Sin ID'}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('Items', { inventoryId: item.id, inventoryName: item.name })}
            >
              <Ionicons name="eye-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => {
                setSelectedInventoryId(item.id);
                setShowQuitModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    return (
      <View style={styles.inventoryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="business" size={20} color={colors.icon} />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.cardTitle}>{item.name || 'Sin nombre'}</Text>
              <Text style={styles.cardLocation}>{item.location || 'Sin ubicación'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.icon} />
            <Text style={styles.statusText}>Activo</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>Dueño de inventario {item.ownerName || 'Sin propietario'}</Text>

        <View style={styles.responsibleSection}>
          <Ionicons name="person-outline" size={14} color={colors.icon} />
          <Text style={styles.responsibleText}>{item.ownerName || 'Sin propietario'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>{item.stats?.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.subtitle }]}>{item.stats?.activos || 0}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.institution }]}>{item.stats?.mantenimiento || 0}</Text>
            <Text style={styles.statLabel}>Mantenimiento</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>${item.stats?.valor || '0.00'}</Text>
            <Text style={styles.statLabel}>Valor</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.updateInfo}>
            <Ionicons name="time-outline" size={14} color={colors.icon} />
            <Text style={styles.updateText}>ID: {item.id || 'Sin ID'}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('Items', { inventoryId: item.id, inventoryName: item.name })}
            >
              <Ionicons name="eye-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => {
                setSelectedInventoryId(item.id);
                setShowQuitModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
   return (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color="#28a745" />
       <Text style={styles.loadingText}>Cargando inventarios...</Text>
     </View>
   );
 }

  const onRefresh = () => {
    fetchInventories();
    fetchOwnerInventories();
    fetchAssignedInventories();
    fetchManagerInventories();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.institution]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={[styles.headerIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="cube" size={24} color={colors.icon} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Mis Inventarios</Text>
              <Text style={styles.headerSubtitle}>Gestiona tus inventarios asignados</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar removed as inventory list is removed */}

      {/* Dropdowns Section */}
      <View style={styles.dropdownsSection}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: expandedOwner ? colors.card : colors.background }]}
            onPress={() => {
              if (expandedOwner) {
                setExpandedOwner(false);
              } else {
                setExpandedOwner(true);
                setExpandedAssigned(false);
                setExpandedManager(false);
              }
            }}
          >
            <Text style={styles.dropdownLabel}>Inventarios como Dueño ({ownerInventories.length})</Text>
            <Ionicons name={expandedOwner ? "chevron-up" : "chevron-down"} size={20} color={colors.icon} />
          </TouchableOpacity>
          {expandedOwner && (
            <View style={styles.expandedContent}>
              {ownerInventories.length > 0 ? (
                ownerInventories.map((item) => renderInventoryCard(item))
              ) : (
                <Text style={styles.emptyText}>No hay inventarios como dueño</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: expandedAssigned ? colors.card : colors.background }]}
            onPress={() => {
              if (expandedAssigned) {
                setExpandedAssigned(false);
              } else {
                setExpandedAssigned(true);
                setExpandedOwner(false);
                setExpandedManager(false);
              }
            }}
          >
            <Text style={styles.dropdownLabel}>Inventarios Asignados ({assignedInventories.length})</Text>
            <Ionicons name={expandedAssigned ? "chevron-up" : "chevron-down"} size={20} color={colors.icon} />
          </TouchableOpacity>
          {expandedAssigned && (
            <View style={styles.expandedContent}>
              {assignedInventories.length > 0 ? (
                assignedInventories.map((item) => renderInventoryCard(item))
              ) : (
                <Text style={styles.emptyText}>No hay inventarios asignados</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: expandedManager ? colors.card : colors.background }]}
            onPress={() => {
              if (expandedManager) {
                setExpandedManager(false);
              } else {
                setExpandedManager(true);
                setExpandedOwner(false);
                setExpandedAssigned(false);
              }
            }}
          >
            <Text style={styles.dropdownLabel}>Inventarios como Firmador ({managerInventories.length})</Text>
            <Ionicons name={expandedManager ? "chevron-up" : "chevron-down"} size={20} color={colors.icon} />
          </TouchableOpacity>
          {expandedManager && (
            <View style={styles.expandedContent}>
              {managerInventories.length > 0 ? (
                managerInventories.map((item) => renderInventoryCard(item))
              ) : (
                <Text style={styles.emptyText}>No hay inventarios como firmador</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Note: Inventory list removed as dropdowns now handle selection */}

      <Modal
        visible={showQuitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirmar</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>¿Deseas dejar de ser gestor de este inventario?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.buttonBackground }]}
                onPress={() => setShowQuitModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.institution }]}
                onPress={handleQuitConfirm}
              >
                <Text style={[styles.modalButtonText, { color: colors.card }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
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
  filterButton: {
    padding: 8,
  },

  // Search Section
  searchSection: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  // Dropdowns Section
  dropdownsSection: {
    padding: 20,
  },
  dropdownContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
    paddingBottom: 16,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  expandedContent: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyModalText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
    color: colors.institution,
  },

  // Inventory Cards
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  inventoryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  cardLocation: {
    fontSize: 14,
    color: colors.institution,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtitle,
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  responsibleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  responsibleText: {
    fontSize: 13,
    color: colors.institution,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.institution,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateText: {
    fontSize: 12,
    color: colors.institution,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    // backgroundColor set in component
  },
  confirmButton: {
    // backgroundColor set in component
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

