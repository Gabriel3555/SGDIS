import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";

export default function MeUserScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localImageUri, setLocalImageUri] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

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

  const handleLogout = async () => {
    try {
      // Clear all stored authentication data
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("userRole");

      // Navigate back to Auth screen
      navigation.navigate("Auth");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con información básica */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {localImageUri ? (
              <Image source={{ uri: localImageUri }} style={styles.avatar} />
            ) : user.imgUrl ? (
              <Image source={{ uri: user.imgUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Información detallada */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={20} color="#28a745" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Cargo</Text>
              <Text style={styles.detailValue}>{user.jobTitle}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color="#28a745" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Departamento Laboral</Text>
              <Text style={styles.detailValue}>{user.laborDepartment}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estado</Text>
              <Text style={[styles.detailValue, user.status ? styles.statusActive : styles.statusInactive]}>
                {user.status ? "Activo" : "Inactivo"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePhoto', { userEmail: user.email })}>
            <Ionicons name="camera-outline" size={24} color="#28a745" />
            <Text style={styles.actionText}>Cambiar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePassword')}>
            <Ionicons name="key-outline" size={24} color="#28a745" />
            <Text style={styles.actionText}>Cambiar Contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#28a745" />
            <Text style={styles.actionText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#f44336" />
            <Text style={[styles.actionText, styles.logoutText]}>Cerrar Sesión</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#28a745",
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statusActive: {
    color: "#28a745",
  },
  statusInactive: {
    color: "#f44336",
  },
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    backgroundColor: "#fff",
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
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  logoutText: {
    color: "#f44336",
  },
});