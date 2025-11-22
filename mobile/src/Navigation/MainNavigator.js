import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AppState } from "react-native";
import { useTheme } from "../ThemeContext";
import { checkTokenExpirationAndLogout } from "./Services/AuthSession";

// Screens
import DashboardScreen from "../../Screens/Auth/ScreenUser/homeUser"; // tu dashboard
import Inventary from "../../Screens/Auth/ScreenUser/InventaryUser";
import Verification from "../../Screens/Auth/ScreenUser/VerificationUser";
import Notifications from "../../Screens/Auth/ScreenUser/Notifications";
import ProfileScreen from "../../Screens/Auth/ScreenUser/meUser";

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { colors } = useTheme();

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // Check token expiration when app comes to foreground
        checkTokenExpirationAndLogout();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Check on mount as well
    checkTokenExpirationAndLogout();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.buttonBackground,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.card,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "home-outline";
          else if (route.name === "Inventarios") iconName = "cube-outline";
          else if (route.name === "Verificación") iconName = "checkmark-done-outline";
          else if (route.name === "Notificaciones") iconName = "notifications-outline";
          else if (route.name === "Perfil") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventarios" component={Inventary} />
      <Tab.Screen name="Verificación" component={Verification} />
      <Tab.Screen name="Notificaciones" component={Notifications} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}