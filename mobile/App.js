import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  senaGreen: "#39A900",
  senaGreenDark: "#2E8A00",
  card: "#FFFFFF",
  border: "#DDE7DD",
  inputBg: "#F7FCF7",
  text: "#1F2937",
  subText: "#6B7280",
  bg1: "#EAF8EE",
  bg2: "#D1F1DC",
};



//  console.log("App loaded");

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu email y contraseña.");
      return;
    }
    // Aquí va tu lógica real de autenticación (fetch/axios)
    Alert.alert("Bienvenido", "Inicio de sesión exitoso (demo).");
  };

  return (
    <LinearGradient colors={[COLORS.bg1, COLORS.bg2]} style={styles.flex1}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              {/* Opción 1: archivo local en ./assets/sena-logo.png */}
              <Image
                source={require("./assets/sena-logo.png")}
                style={styles.logo}
                resizeMode="contain"
                onError={() => {}}
              />
              {/* Opción 2: si prefieres URL, reemplaza la línea de arriba por:
              <Image
                source={{ uri: "https://www.sena.edu.co/es-co/PublishingImages/logo-sena-vertical.png" }}
                style={styles.logo}
                resizeMode="contain"
              />
              */}
            </View>

            {/* Títulos */}
            <Text style={styles.title}>Inventario SENA</Text>
            <Text style={styles.subtitle}>
              Ingresa tus credenciales para acceder al sistema
            </Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={COLORS.subText} />
              <TextInput
                style={styles.input}
                placeholder="usuario@sena.edu.co"
                placeholderTextColor={COLORS.subText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Contraseña */}
            <Text style={[styles.label, { marginTop: 14 }]}>Contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.subText} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.subText}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass((s) => !s)}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Botón */}
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            {/* Link recuperar */}
            <TouchableOpacity onPress={() => Alert.alert("Recuperar", "Función no implementada (demo).")}>
              <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logoWrap: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EFF5EF",
  },
  logo: { width: 40, height: 40 },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  button: {
    marginTop: 18,
    backgroundColor: COLORS.senaGreen,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  forgot: {
    textAlign: "center",
    marginTop: 12,
    color: COLORS.senaGreen,
    fontWeight: "600",
  },
  helpBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F5FBF6",
    borderRadius: 12,
    padding: 12,
  },
  helpTitle: { fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  helpItem: { color: COLORS.subText, marginBottom: 2 },
});
