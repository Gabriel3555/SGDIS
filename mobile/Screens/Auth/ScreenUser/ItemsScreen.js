import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../src/Navigation/Services/Connection";
import { ensureAuthToken } from "../../../src/Navigation/Services/AuthSession";
import { useTheme } from "../../../src/ThemeContext";

export default function ItemsScreen({ route, navigation }) {
   const { colors } = useTheme();
   const { inventoryId, inventoryName } = route.params;
   const [items, setItems] = useState([]);
   const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get(`api/v1/items/inventory/${inventoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 0,
          size: 1000, // Fetch up to 1000 items
        },
      });

      const pageData = response.data;
      const itemsData = pageData.content || [];

      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "No se pudieron cargar los items. Verifica tu conexión e intenta de nuevo.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
        <View style={styles.imagePlaceholder}>
          {/* Espacio reservado para cargar imagen del item más tarde */}
        </View>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="cube" size={20} color={colors.icon} />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.cardTitle}>{item.productName || 'Sin nombre'}</Text>
              <Text style={styles.cardDescription}>{item.attributes?.OBSERVATIONS || 'Sin descripción'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>${item.acquisitionValue || '0.00'}</Text>
            <Text style={styles.statLabel}>Valor</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>{item.id || 'Sin ID'}</Text>
            <Text style={styles.statLabel}>ID</Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonBackground} />
        <Text style={styles.loadingText}>Cargando items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <View style={[styles.headerIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="cube" size={24} color={colors.icon} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Items de {inventoryName}</Text>
              <Text style={styles.headerSubtitle}>Inventario</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No hay items en este inventario</Text>
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
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 12,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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

  // Items Cards
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  itemCard: {
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
  imagePlaceholder: {
    height: 150,
    backgroundColor: colors.placeholder || '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
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
  cardDescription: {
    fontSize: 14,
    color: colors.institution,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});