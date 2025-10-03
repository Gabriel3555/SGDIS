import React from "react";
import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import DashboardScreen from "../../Screens/Auth/ScreenUser/homeUser"; // tu dashboard

function InventariosScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Inventarios</Text>
    </View>
  );
}

function VerificacionScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Verificación</Text>
    </View>
  );
}

function NotificacionesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Notificaciones</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#16a34a", // Verde SENA
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "home-outline";
          else if (route.name === "Inventarios") iconName = "cube-outline";
          else if (route.name === "Verificación") iconName = "checkmark-done-outline";
          else if (route.name === "Notificaciones") iconName = "notifications-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventarios" component={InventariosScreen} />
      <Tab.Screen name="Verificación" component={VerificacionScreen} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} />
    </Tab.Navigator>
  );
}