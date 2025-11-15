import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [inventories, setInventories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageTimeoutRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchInventoryCount();
  }, []);

  useEffect(() => {
    if (inventories.length > 0) {
      fetchTotalItemsAndValue();
    }
  }, [inventories]);

  useEffect(() => {
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación");
        return;
      }

      const response = await api.get("api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
      setImageError(false);
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
        imageTimeoutRef.current = null;
      }
      setImageLoading(false);

      // Load local profile image
      const localImage = await AsyncStorage.getItem(`userProfileImage_${response.data.email}`);
      setLocalImageUri(localImage);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "No se pudo cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryCount = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const response = await api.get("api/v1/users/me/inventories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data || [];
      setInventories(data);
      setInventoryCount(data.length);
    } catch (error) {
      console.error("Error fetching inventory count:", error);
    }
  };

  const fetchTotalItemsAndValue = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      let totalItemsCount = 0;
      let totalValueSum = 0;
      for (const inv of inventories) {
        let page = 0;
        const size = 100; // Fetch in batches
        while (true) {
          const response = await api.get(`api/v1/items/inventory/${inv.id}?page=${page}&size=${size}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const items = response.data.content || [];
          totalItemsCount += items.length;
          for (const item of items) {
            totalValueSum += item.acquisitionValue || 0;
          }
          if (items.length < size) break;
          page++;
        }
      }
      setTotalItems(totalItemsCount);
      setTotalValue(totalValueSum);
    } catch (error) {
      console.error("Error fetching total items and value:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {localImageUri ? (
                <Image
                  source={{ uri: localImageUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  priority="high"
                />
              ) : user?.imgUrl && !imageError ? (
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: `https://sgdis.cloud${user.imgUrl}` }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    priority="high"
                    onLoadStart={() => {
                      setImageLoading(true);
                      imageTimeoutRef.current = setTimeout(() => {
                        setImageLoading(false);
                        imageTimeoutRef.current = null;
                      }, 10000);
                    }}
                    onLoad={() => {
                      if (imageTimeoutRef.current) {
                        clearTimeout(imageTimeoutRef.current);
                        imageTimeoutRef.current = null;
                      }
                      setImageLoading(false);
                    }}
                    onError={() => {
                      if (imageTimeoutRef.current) {
                        clearTimeout(imageTimeoutRef.current);
                        imageTimeoutRef.current = null;
                      }
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                  {imageLoading && (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator size="small" color="#28a745" />
                    </View>
                  )}
                </View>
              ) : (
                <Ionicons name="person" size={24} color="#fff" />
              )}
            </View>
            <View>
              <Text style={styles.welcomeText}>¡Bienvenido!</Text>
              <Text style={styles.userName}>{user?.fullName || "Usuario"}</Text>
              <Text style={styles.userRole}>Rol: {user?.role || "USER"}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas Principales */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Estadísticas del Sistema</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="cube" size={24} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{inventoryCount}</Text>
              <Text style={styles.statLabel}>Total Inventarios</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Activos</Text>
              <Text style={styles.statSubtext}>75%</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="cube" size={24} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statSubtext}>En inventarios</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#9c27b0' }]}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>${(totalValue / 1000000).toFixed(1)}M</Text>
              <Text style={styles.statLabel}>Valor Total</Text>
              <Text style={styles.statSubtext}>De items</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Categorías y Estado */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categorías de Items</Text>
        <View style={styles.categoriesGrid}>
          <View style={[styles.categoryCard, { backgroundColor: '#ffebee' }]}>
            <Ionicons name="desktop" size={20} color="#f44336" />
            <Text style={styles.categoryText}>Cómputo</Text>
          </View>
          <View style={[styles.categoryCard, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="videocam" size={20} color="#ff9800" />
            <Text style={styles.categoryText}>Audiovisual</Text>
          </View>
          <View style={[styles.categoryCard, { backgroundColor: '#e8f5e8' }]}>
            <Ionicons name="flask" size={20} color="#4caf50" />
            <Text style={styles.categoryText}>Laboratorio</Text>
          </View>
          <View style={[styles.categoryCard, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="phone-portrait" size={20} color="#2196f3" />
            <Text style={styles.categoryText}>Móviles</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Estado Actual</Text>
        <View style={styles.statusList}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.statusText}>Activos: 3 items</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.statusText}>Mantenimiento: 1 item</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#f44336' }]} />
            <Text style={styles.statusText}>Inactivos: 0 items</Text>
          </View>
        </View>
      </View>

      {/* Estadísticas Mensuales */}
      <View style={styles.monthlySection}>
        <Text style={styles.sectionTitle}>Actividad Mensual</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthlyScroll}>
          <View style={[styles.monthCard, styles.monthCardActive]}>
            <Text style={styles.monthName}>Enero</Text>
            <Text style={styles.monthItems}>4 items</Text>
            <Text style={styles.monthValue}>$12.1M</Text>
            <View style={styles.monthBar}>
              <View style={[styles.monthBarFill, { width: '100%' }]} />
            </View>
          </View>
          <View style={styles.monthCard}>
            <Text style={styles.monthName}>Feb</Text>
            <Text style={styles.monthItems}>0 items</Text>
            <Text style={styles.monthValue}>$0</Text>
            <View style={styles.monthBar}>
              <View style={[styles.monthBarFill, { width: '0%' }]} />
            </View>
          </View>
          <View style={styles.monthCard}>
            <Text style={styles.monthName}>Mar</Text>
            <Text style={styles.monthItems}>0 items</Text>
            <Text style={styles.monthValue}>$0</Text>
            <View style={styles.monthBar}>
              <View style={[styles.monthBarFill, { width: '0%' }]} />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#e3f2fd' }]}
            onPress={() => navigation.navigate('Inventarios')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="cube-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Inventario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#e8f5e8' }]}
            onPress={() => navigation.navigate('Verificación')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Verificación</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#f3e5f5' }]}
            onPress={() => navigation.navigate('Notificaciones')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#9c27b0' }]}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Notificaciones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#fff3e0' }]}
            onPress={() => navigation.navigate('Perfil')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="person-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },

  // Header Styles
  header: {
    backgroundColor: "#fff",
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28a745",
  },
  userRole: {
    fontSize: 12,
    color: "#666",
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Stats Section
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statChange: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "600",
    marginTop: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  // Categories Section
  categoriesSection: {
    padding: 20,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  statusList: {
    marginTop: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#333",
  },

  // Monthly Section
  monthlySection: {
    padding: 20,
  },
  monthlyScroll: {
    marginTop: 12,
  },
  monthCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 120,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthCardActive: {
    borderWidth: 2,
    borderColor: "#28a745",
  },
  monthName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  monthItems: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  monthValue: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "600",
    marginTop: 2,
  },
  monthBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginTop: 8,
  },
  monthBarFill: {
    height: "100%",
    backgroundColor: "#28a745",
    borderRadius: 2,
  },

  // Actions Section
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
