import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function ChangePasswordScreen() {
  const [userId, setUserId] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "https://tu-backend.com/api/v1/users"; // ⚠️ Cambia por tu URL real

  // Trae el usuario actual al montar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        const response = await axios.get(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserId(response.data.id);
      } catch (error) {
        Alert.alert("Error", "No se pudo obtener el usuario actual.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      return Alert.alert("Error", "Por favor ingresa la nueva contraseña.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Las contraseñas no coinciden.");
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      await axios.put(
        `${API_URL}/${userId}`,
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert("Éxito", "Contraseña actualizada correctamente.");
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actualizar Contraseña</Text>

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007BFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
