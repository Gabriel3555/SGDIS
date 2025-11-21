import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";


//change password
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";
import { ensureAuthToken } from "../../../src/Navigation/Services/AuthSession";
import { useTheme } from "../../../src/ThemeContext";

export default function ChangePhotoScreen() {
  const { colors, isDarkMode } = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageUri, setCurrentImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userEmail } = route.params;

  const styles = getStyles(colors);

  useEffect(() => {
    loadCurrentImage();
  }, []);

  const loadCurrentImage = async () => {
    try {
      const localImage = await AsyncStorage.getItem(`userProfileImage_${userEmail}`);
      setCurrentImageUri(localImage);
    } catch (error) {
      console.error("Error loading current image:", error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions for both camera and media library
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== "granted" || mediaLibraryPermission.status !== "granted") {
        Alert.alert("Permisos denegados", "Necesitas permisos de cámara y galería para seleccionar una imagen");
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo abrir la galería");
    }
  };

  const saveImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Selecciona una imagen primero");
      return;
    }

    // Check file size (5MB limit)
    const fileSizeMB = selectedImage.fileSize / (1024 * 1024);
    if (fileSizeMB > 5) {
      Alert.alert("Error", "La imagen es demasiado grande. Máximo 5MB permitido.");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      // Upload image to backend
      await api.post("api/v1/users/me/image", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch updated user data to get new imgUrl
      const userResponse = await api.get("api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Download and store the image locally
      if (userResponse.data.imgUrl) {
        const fullImageUrl = `https://sgdis.cloud${userResponse.data.imgUrl}`;
        try {
          const localUri = `${FileSystem.cacheDirectory}profile_${userEmail}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(fullImageUrl, localUri);
          await AsyncStorage.setItem(`userProfileImage_${userEmail}`, downloadResult.uri);
          setCurrentImageUri(downloadResult.uri);
        } catch (downloadError) {
          console.error("Error downloading image:", downloadError);
          // Fallback to storing the URL if download fails
          await AsyncStorage.setItem(`userProfileImage_${userEmail}`, fullImageUrl);
          setCurrentImageUri(fullImageUrl);
        }
      }

      Alert.alert("Éxito", "Foto de perfil actualizada correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "No se pudo subir la imagen al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2a2a2a', '#3a3a3a'] : ['#28a745', '#4CAF50', '#66BB6A']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Cambiar Foto de Perfil</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Current Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto Actual</Text>
        <View style={styles.currentPhotoCard}>
          <View style={styles.avatarContainer}>
            {currentImageUri ? (
              <Image source={{ uri: currentImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Change Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nueva Foto</Text>
        <View style={styles.changePhotoCard}>
          <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={48} color={colors.buttonBackground} />
            <Text style={styles.selectText}>Seleccionar de Galería</Text>
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Vista Previa</Text>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            </View>
          )}

          {selectedImage && (
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveImage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={24} color={colors.buttonText} />
                  <Text style={styles.saveText}>Guardar Foto</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  currentPhotoCard: {
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
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.card,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.card,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  changePhotoCard: {
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
    alignItems: "center",
  },
  selectButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderStyle: "dashed",
  },
  selectText: {
    fontSize: 16,
    color: colors.buttonBackground,
    fontWeight: "600",
    marginTop: 10,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.placeholder,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.buttonBackground,
  },
  saveButton: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: "100%",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveText: {
    fontSize: 16,
    color: colors.buttonText,
    fontWeight: "600",
    marginLeft: 8,
  },
});