import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { resetToAuth } from "../NavigationService";

let logoutInProgress = false;

const SESSION_KEYS = ["userToken", "refreshToken", "userRole"];

// JWT decoding utility
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn("Error decoding JWT:", error);
    return null;
  }
};

// Check if JWT token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.warn("Error checking token expiration:", error);
    return true;
  }
};

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

  // Check if token is expired
  if (isTokenExpired(token)) {
    await clearSessionAndRedirect({
      ...options,
      title: "Sesión expirada",
      message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    });
    throw new Error("Token expired");
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

// Check if current token is expired and logout if necessary
export const checkTokenExpirationAndLogout = async (options = {}) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token && isTokenExpired(token)) {
    await clearSessionAndRedirect({
      ...options,
      title: "Sesión expirada",
      message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    });
    return true; // Token was expired and user was logged out
  }
  return false; // Token is still valid
};






