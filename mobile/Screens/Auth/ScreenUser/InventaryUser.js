// src/Screens/Inventary.js
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const data = [
  {
    id: "1",
    title: "Oficina Principal",
    location: "Edificio A - Piso 1",
    description: "Inventario de la oficina administrativa principal",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 45,
    activos: 42,
    mantenimiento: 2,
    valor: "$125.000.000",
    actualizado: "15/1/2024",
  },
  {
    id: "2",
    title: "Laboratorio de Sistemas",
    location: "Edificio B - Piso 2",
    description: "Equipos del laboratorio de sistemas y programación",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 78,
    activos: 75,
    mantenimiento: 3,
    valor: "$245.000.000",
    actualizado: "15/1/2024",
  },
  {
    id: "3",
    title: "Biblioteca",
    location: "Edificio C - Piso 1",
    description: "Inventario de equipos y mobiliario de la biblioteca",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 32,
    activos: 30,
    mantenimiento: 2,
    valor: "$85.000.000",
    actualizado: "14/1/2024",
  },
  {
    id: "4",
    title: "Oficina Coordinación",
    location: "Edificio A - Piso 2 - Oficina 201",
    description: "Inventario personal del coordinador académico",
    responsable: "Dr. Juan Carlos Pérez",
    totalItems: 15,
    activos: 14,
    mantenimiento: 1,
    valor: "$35.000.000",
    actualizado: "13/1/2024",
  },
];

export default function Inventary() {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.status}>Activo</Text>
      </View>

      {/* Subtítulo */}
      <Text style={styles.subtitle}>{item.location}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.responsable}>{item.responsable}</Text>

      {/* Datos */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: "green" }]}>{item.activos}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: "orange" }]}>{item.mantenimiento}</Text>
          <Text style={styles.statLabel}>Mantenimiento</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.valor}</Text>
          <Text style={styles.statLabel}>Valor Total</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.updated}>Actualizado: {item.actualizado}</Text>
        <View style={styles.actions}>
          <TouchableOpacity>
            <Ionicons name="eye-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="trash-outline" size={20} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Inventarios</Text>
      <Text style={styles.screenSubtitle}>Gestiona los inventarios del sistema</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Nuevo Inventario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc", padding: 16 },
  screenTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  list: { paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "bold" },
  status: { fontSize: 12, color: "green", fontWeight: "600" },
  subtitle: { fontSize: 13, color: "#777", marginTop: 2 },
  description: { fontSize: 13, color: "#555", marginTop: 2 },
  responsable: { fontSize: 12, color: "#444", marginBottom: 8 },
  stats: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  stat: { flex: 1, alignItems: "center", marginVertical: 4 },
  statNumber: { fontSize: 14, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  updated: { fontSize: 11, color: "#777" },
  actions: { flexDirection: "row", gap: 12 },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
});
