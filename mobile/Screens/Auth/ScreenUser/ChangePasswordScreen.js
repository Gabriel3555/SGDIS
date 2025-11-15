import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../src/Navigation/Services/Connection";
import senaLogo from "../../../assets/sena-logo.png";
import { useTheme } from "../../../src/ThemeContext";

export default function ChangePasswordScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!oldPassword || !password || !confirmPassword) {
      return Alert.alert("Error", "Por favor ingresa todas las contraseñas.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Las contraseñas no coinciden.");
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      await api.post(
        "api/v1/users/changePassword",
        { oldPassword, newPassword: password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Perfil' } }],
      });
      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2a2a2a', '#3a3a3a'] : ['#f5f7fa', '#c8e6c9', '#a5d6a7']}
        style={styles.center}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.buttonBackground} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1a1a1a', '#2a2a2a', '#3a3a3a'] : ['#f5f7fa', '#c8e6c9', '#a5d6a7']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={senaLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Actualizar Contraseña</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.buttonBackground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña actual"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showOldPassword}
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
            <Ionicons name={showOldPassword ? "eye-off" : "eye"} size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color={colors.buttonBackground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.buttonBackground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
          <Text style={styles.buttonText}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 70,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: colors.inputBackground,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: colors.buttonText,
    fontWeight: "bold",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
