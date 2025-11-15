import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../../src/Navigation/Services/AuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../../src/Navigation/NavigationService";
import { useTheme } from "../../src/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated values for input borders
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          // User is logged in, navigate to Main
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  // Animation functions
  const animateInputFocus = (animValue) => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateInputBlur = (animValue) => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (loading) return; // Prevent multiple presses

    if (!email.trim()) {
      Alert.alert("Error", "Necesitas ingresar un correo");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Necesitas ingresar una contraseña");
      return;
    }

    if (!email.endsWith('@sena.edu.co') && !email.endsWith('@soy.sena.edu.co')) {
      Alert.alert("Error", "Solo se permiten correos electrónicos de @sena.edu.co o @soy.sena.edu.co");
      return;
    }

    animateButtonPress();
    setLoading(true);

    try {
      const data = await login(email, password);
      const role = data.role || (data.roles && data.roles[0]);

      if (!role || typeof role !== "string") {
        Alert.alert("🚫 Acceso denegado", "No se recibió un rol válido.");
        return;
      }

      const roleName = role.split("_")[0];
      if (roleName !== "USER") {
        Alert.alert("🚫 Acceso denegado", "Solo los usuarios pueden ingresar.");
        return;
      }

      await AsyncStorage.setItem("userToken", data.jwt);
      await AsyncStorage.setItem("refreshToken", data.refreshToken);
      await AsyncStorage.setItem("userRole", role);

      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      console.error("Error en login:", error);
      const errorMessage =
        error.error ||
        error.message ||
        "Credenciales inválidas o servidor no disponible";
      Alert.alert("❌ Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.appTitle}>SGDIS</Text>
        <Text style={styles.subtitle}>Sistema de Gestión de Inventario</Text>

        {/* Logo debajo del SGDIS */}
        <Image
          source={require("../../assets/sena-logo.png")}
          style={styles.logoInside}
          resizeMode="contain"
        />

        <Text style={styles.institution}>
          Servicio Nacional de Aprendizaje - SENA
        </Text>

        {/* Email */}
        <Animated.View style={[
          styles.inputContainer,
          {
            borderColor: emailBorderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.inputBorder, colors.inputBorderFocus]
            })
          }
        ]}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={colors.icon} style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              onFocus={() => animateInputFocus(emailBorderAnim)}
              onBlur={() => animateInputBlur(emailBorderAnim)}
            />
          </View>
        </Animated.View>

        {/* Password */}
        <Animated.View style={[
          styles.inputContainer,
          {
            borderColor: passwordBorderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.inputBorder, colors.inputBorderFocus]
            })
          }
        ]}>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contraseña"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => animateInputFocus(passwordBorderAnim)}
              onBlur={() => animateInputBlur(passwordBorderAnim)}
            />
          </View>
        </Animated.View>

        {/* Botón Login */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Links extras */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://sgdis.cloud/forgot_password.html')}
        >
          <Text style={[styles.link, { color: colors.link }]}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={[styles.registerText, { color: colors.registerText }]}>
            ¿No tienes cuenta?{" "}
            <Text style={{ color: "#28a745", fontWeight: "bold" }}>
              Regístrate aquí
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleDarkMode}
        >
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color={colors.icon}
          />
          <Text style={[styles.themeToggleText, { color: colors.text }]}>
            {isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.footer }]}>
          © 2025 SENA - Servicio Nacional de Aprendizaje
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoInside: {
    width: 120,
    height: 70,
    marginVertical: 15,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    padding: 30,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.subtitle,
    marginBottom: 10,
  },
  institution: {
    fontSize: 14,
    color: colors.institution,
    marginBottom: 25,
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: colors.inputBackground,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    marginRight: 10,
    color: colors.icon,
  },
  input: {
    fontSize: 14,
    color: colors.text,
  },
  loginButton: {
    width: "100%",
    backgroundColor: colors.buttonBackground,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    fontSize: 13,
    color: colors.link,
    marginBottom: 20,
  },
  registerText: {
    fontSize: 13,
    color: colors.registerText,
    marginBottom: 25,
    textAlign: "center",
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  themeToggleText: {
    fontSize: 14,
    marginLeft: 10,
  },
  footer: {
    fontSize: 10,
    color: colors.footer,
    marginTop: 15,
    textAlign: "center",
  },
});