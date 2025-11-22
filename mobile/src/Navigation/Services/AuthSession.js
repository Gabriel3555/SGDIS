import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { resetToAuth } from "../NavigationService";

let logoutInProgress = false;

const SESSION_KEYS = ["userToken", "refreshToken", "userRole"];

export const clearSessionAndRedirect = async (options = {}) => {
  if (logoutInProgress) {
    return;
  }

  const {
    title = "Sesión expirada",
    message = "Por seguridad, vuelve a iniciar sesión.",
    showAlert = true,
  } = options;

  logoutInProgress = true;

  try {
    await AsyncStorage.multiRemove(SESSION_KEYS);
  } catch (error) {
    console.warn("Error clearing auth storage", error);
  } finally {
    if (showAlert) {
      Alert.alert(title, message);
    }
    resetToAuth();
    logoutInProgress = false;
  }
};

export const getValidTokenOrLogout = async (options = {}) => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) {
    await clearSessionAndRedirect(options);
    throw new Error("Missing auth token");
  }
  return token;
};

export const ensureAuthToken = async (options = {}) => {
  try {
    return await getValidTokenOrLogout(options);
  } catch (error) {
    return null;
  }
};



