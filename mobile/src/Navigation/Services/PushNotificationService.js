import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axios from "axios";

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Inicializa el servicio de notificaciones push
   */
  async initialize() {
    try {
      // Verificar si estamos en un emulador/simulador
      const isDevice = Constants.isDevice;
      if (!isDevice) {
        console.log("Las notificaciones push solo funcionan en dispositivos físicos");
        return null;
      }

      // Solicitar permisos
      const token = await this.registerForPushNotifications();
      if (token) {
        this.expoPushToken = token;
        console.log("📱 Expo Push Token:", token);

        // Registrar el token en el backend
        await this.registerTokenInBackend(token);

        // Configurar listeners de notificaciones
        this.setupNotificationListeners();

        return token;
      }
    } catch (error) {
      console.error("Error al inicializar notificaciones push:", error);
      return null;
    }
  }

  /**
   * Solicita permisos y obtiene el token de Expo
   */
  async registerForPushNotifications() {
    try {
      // Verificar permisos existentes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Si no tiene permisos, solicitarlos
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Si no se concedieron permisos
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permisos de Notificaciones",
          "No se pueden enviar notificaciones sin permisos. Por favor, habilita las notificaciones en la configuración de tu dispositivo."
        );
        return null;
      }

      // Obtener el token de Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || "sgdis-mobile";
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      // Configuración específica de Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#00AF00",
        });
      }

      return token.data;
    } catch (error) {
      console.error("Error al registrar para push notifications:", error);
      return null;
    }
  }

  /**
   * Registra el token en el backend
   */
  async registerTokenInBackend(token) {
    try {
      const deviceType = Platform.OS === "ios" ? "IOS" : "ANDROID";
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        console.error("No hay token de usuario disponible");
        return;
      }

      const response = await axios.post(
        "https://sgdis.cloud/api/v1/notifications/register-token",
        {
          token: token,
          deviceType: deviceType,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        console.log("✅ Token registrado en el backend exitosamente");
        await AsyncStorage.setItem("pushToken", token);
      }
    } catch (error) {
      console.error("Error al registrar token en el backend:", error.response?.data || error.message);
    }
  }

  /**
   * Configura los listeners de notificaciones
   */
  setupNotificationListeners() {
    // Listener para cuando llega una notificación mientras la app está activa
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notificación recibida:", notification);
        const { title, body, data } = notification.request.content;
        
        // Mostrar alerta personalizada si la app está activa
        if (title && body) {
          Alert.alert(title, body, [
            {
              text: "OK",
              onPress: () => this.handleNotificationData(data),
            },
          ]);
        }
      }
    );

    // Listener para cuando el usuario toca la notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👆 Usuario interactuó con la notificación:", response);
        const data = response.notification.request.content.data;
        this.handleNotificationData(data);
      }
    );
  }

  /**
   * Maneja los datos de la notificación
   */
  handleNotificationData(data) {
    console.log("📦 Datos de la notificación:", data);
    
    // Aquí puedes agregar lógica para navegar a pantallas específicas
    // basándote en el tipo de notificación
    if (data.type === "INVENTORY_CREATED") {
      // Por ejemplo, navegar a la pantalla de inventario
      console.log("Navegar a inventario:", data.inventoryId);
    }
  }

  /**
   * Desactiva el token en el backend
   */
  async deactivateToken() {
    try {
      const token = await AsyncStorage.getItem("pushToken");
      const userToken = await AsyncStorage.getItem("userToken");
      
      if (token && userToken) {
        await axios.delete(
          `https://sgdis.cloud/api/v1/notifications/deactivate-token?token=${token}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        await AsyncStorage.removeItem("pushToken");
        console.log("Token desactivado en el backend");
      }
    } catch (error) {
      console.error("Error al desactivar token:", error);
    }
  }

  /**
   * Limpia los listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Exportar instancia singleton
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

