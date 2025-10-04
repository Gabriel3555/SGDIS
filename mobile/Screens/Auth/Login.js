import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { login } from "../../src/Navigation/Services/AuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../../src/Navigation/NavigationService";


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
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

      // Navigate to main app
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (error) {
      console.error("Error en login:", error);
      const errorMessage = error.error || error.message || "Credenciales inválidas o servidor no disponible";
      Alert.alert("❌ Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
