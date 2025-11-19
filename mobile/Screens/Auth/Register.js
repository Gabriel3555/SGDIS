import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { register } from "../../src/Navigation/Services/AuthService";
import { useTheme } from "../../src/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = getStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardAvoidingView]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Registro</Text>
        <Text style={styles.subtitulo}>Sistema de Gestión de Inventario</Text>
        <Text style={styles.subSena}>Servicio Nacional de Aprendizaje - SENA</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre Completo"
          placeholderTextColor={colors.placeholder}
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          placeholderTextColor={colors.placeholder}
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Cargo Laboral"
          placeholderTextColor={colors.placeholder}
          value={cargo}
          onChangeText={setCargo}
        />

        <TextInput
          style={styles.input}
          placeholder="Departamento Laboral"
          placeholderTextColor={colors.placeholder}
          value={departamento}
          onChangeText={setDepartamento}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          placeholderTextColor={colors.placeholder}
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
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    backgroundColor: colors.background,
  },
  container: {
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.background,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 16,
    color: colors.subtitle,
    fontWeight: "600",
  },
  subSena: {
    fontSize: 14,
    marginBottom: 20,
    color: colors.institution,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  boton: {
    width: "100%",
    backgroundColor: colors.buttonBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textoBoton: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: "bold",
  },
  textoLink: {
    marginTop: 15,
    fontSize: 14,
    color: colors.registerText,
  },
  link: {
    color: colors.link,
    fontWeight: "600",
  },
});
