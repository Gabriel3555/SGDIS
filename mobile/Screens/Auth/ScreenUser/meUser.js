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
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";
import { ensureAuthToken, clearSessionAndRedirect } from "../../../src/Navigation/Services/AuthSession";
import { useTheme } from "../../../src/ThemeContext";

export default function MeUserScreen() {
    const { colors, isDarkMode } = useTheme();
    const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
     const [localImageUri, setLocalImageUri] = useState(null);
     const [imageLoading, setImageLoading] = useState(false);
     const [imageError, setImageError] = useState(false);
     const [imageKey, setImageKey] = useState(Date.now()); // For cache busting
     const imageTimeoutRef = useRef(null);
     const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  useEffect(() => {
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, []);


  const fetchUserData = async () => {
    try {
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get("api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
      setImageError(false);
      setImageKey(Date.now()); // Bust cache for new image
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

  const handleLogout = async () => {
    try {
      await clearSessionAndRedirect({ showAlert: false });
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonBackground} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color={colors.placeholder} />
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
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2a2a2a', '#3a3a3a'] : ['#28a745', '#4CAF50', '#66BB6A']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {localImageUri ? (
              <Image
                source={{ uri: localImageUri }}
                style={styles.avatar}
                contentFit="cover"
                priority="high"
              />
            ) : user?.imgUrl && !imageError ? (
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: `https://sgdis.cloud${user.imgUrl}?t=${imageKey}` }}
                  style={styles.avatar}
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
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
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
      </LinearGradient>

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
            <Ionicons name="camera-outline" size={24} color={colors.buttonBackground} />
            <Text style={styles.actionText}>Cambiar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePassword')}>
            <Ionicons name="key-outline" size={24} color={colors.buttonBackground} />
            <Text style={styles.actionText}>Cambiar Contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color={colors.buttonBackground} />
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.buttonBackground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 16,
    color: "#f0f0f0",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
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
    color: colors.institution,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  statusActive: {
    color: colors.subtitle,
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
    justifyContent: "space-around",
  },
  actionButton: {
    width: "45%",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  logoutText: {
    color: "#f44336",
  },
});