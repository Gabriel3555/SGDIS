import React, { useState, useRef } from "react";
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
} from "react-native";
import { login } from "../../src/Navigation/Services/AuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../../src/Navigation/NavigationService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated values for input borders
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <View style={styles.container}>
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
              outputRange: ['#ccc', '#28a745']
            })
          }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            onFocus={() => animateInputFocus(emailBorderAnim)}
            onBlur={() => animateInputBlur(emailBorderAnim)}
          />
        </Animated.View>

        {/* Password */}
        <Animated.View style={[
          styles.inputContainer,
          {
            borderColor: passwordBorderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#ccc', '#28a745']
            })
          }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => animateInputFocus(passwordBorderAnim)}
            onBlur={() => animateInputBlur(passwordBorderAnim)}
          />
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
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text style={{ color: "#28a745", fontWeight: "bold" }}>
              Regístrate aquí
            </Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2025 SENA - Servicio Nacional de Aprendizaje
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoInside: {
    width: 100,
    height: 60,
    marginVertical: 10,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#28a745",
  },
  institution: {
    fontSize: 12,
    color: "#555",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  input: {
    padding: 12,
    fontSize: 14,
    borderWidth: 0, // Remove border since it's on the container
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    fontSize: 13,
    color: "#28a745",
    marginBottom: 15,
  },
  registerText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  footer: {
    fontSize: 10,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
  },
});