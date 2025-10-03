import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { register } from "../../src/Navigation/Services/AuthService";

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargo, setCargo] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    try {
      const data = await register(nombre, correo, cargo, departamento, password, confirmPassword);
      Alert.alert("Éxito", "Registro exitoso 🎉");
      navigation.navigate('Login');
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", error.message || "Error en el registro");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Registro</Text>
      <Text style={styles.subtitulo}>Sistema de Gestión de Inventario</Text>
      <Text style={styles.subSena}>Servicio Nacional de Aprendizaje - SENA</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Cargo Laboral"
        value={cargo}
        onChangeText={setCargo}
      />

      <TextInput
        style={styles.input}
        placeholder="Departamento Laboral"
        value={departamento}
        onChangeText={setDepartamento}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.boton} onPress={handleRegister}>
        <Text style={styles.textoBoton}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.textoLink}>
          ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 16,
    color: "green",
    fontWeight: "600",
  },
  subSena: {
    fontSize: 14,
    marginBottom: 20,
    color: "#555",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  boton: {
    width: "100%",
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  textoLink: {
    marginTop: 15,
    fontSize: 14,
    color: "#555",
  },
  link: {
    color: "green",
    fontWeight: "600",
  },
});
