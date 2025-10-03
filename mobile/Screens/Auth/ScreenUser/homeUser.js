import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Bienvenido, Usuario Normal - USER</Text>

      {/* Resumen */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Items</Text>
          <Text style={styles.cardValue}>4</Text>
          <Text style={styles.cardFooter}>+12.5% desde el mes pasado</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Activos</Text>
          <Text style={styles.cardValue}>3</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.cardWarning}>
          <Text style={styles.cardTitle}>En Mantenimiento</Text>
          <Text style={styles.cardValue}>1</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valor Total</Text>
          <Text style={styles.cardValue}>$11.650.000</Text>
          <Text style={styles.cardFooter}>3 inventarios</Text>
        </View>
      </View>

      {/* Items por Categoría */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items por Categoría</Text>
        <Text>🔴 Equipos de Cómputo</Text>
        <Text>🟠 Equipos Audiovisuales</Text>
        <Text>🟡 Equipos de Laboratorio</Text>
        <Text>🟢 Dispositivos Móviles</Text>
      </View>

      {/* Estado de Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Items</Text>
        <Text>🟢 Activos: 3</Text>
        <Text>🟡 Mantenimiento: 1</Text>
        <Text>🔴 Inactivos: 0</Text>
      </View>

      {/* Estadísticas Mensuales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas Mensuales</Text>
        <View style={styles.row}>
          <View style={styles.miniCard}>
            <Text>Ene</Text>
            <Text>4 items</Text>
            <Text>$12.150.000</Text>
          </View>
          <View style={styles.miniCard}>
            <Text>Feb</Text>
            <Text>0 items</Text>
            <Text>$0</Text>
          </View>
          <View style={styles.miniCard}>
            <Text>Mar</Text>
            <Text>0 items</Text>
            <Text>$0</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.actionCard}>
            <MaterialCommunityIcons name="plus-box" size={32} color="#3b82f6" />
            <Text>Nuevo Item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="checkmark-done-circle" size={32} color="green" />
            <Text>Verificar Items</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <MaterialCommunityIcons name="file-chart" size={32} color="purple" />
            <Text>Generar Reporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 16,
    margin: 4,
    borderRadius: 12,
    elevation: 2,
  },
  cardWarning: {
    flex: 1,
    backgroundColor: "#fffbe6",
    padding: 16,
    margin: 4,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: "bold" },
  cardFooter: { fontSize: 12, color: "gray", marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    margin: 4,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    margin: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
