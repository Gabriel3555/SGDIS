// src/Screens/Inventary.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";
import { useTheme } from "../../../src/ThemeContext";

export default function Inventary({ navigation }) {
   const { colors } = useTheme();
   const [inventories, setInventories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");

   const styles = getStyles(colors);

  useEffect(() => {
    fetchInventories();
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

  const fetchInventories = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
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

  const filteredData = inventories.filter(item =>
    item && typeof item === 'object' &&
    ((item.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  );

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

        <Text style={styles.cardDescription}>Inventario gestionado por {item.ownerName || 'Sin propietario'}</Text>

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
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="create-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
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

  return (
    <View style={styles.container}>
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

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar inventarios..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No tienes inventarios asignados</Text>
          </View>
        }
      />

    
    </View>
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
});
