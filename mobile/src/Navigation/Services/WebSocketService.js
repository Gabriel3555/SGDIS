import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

/**
 * Servicio de WebSocket para notificaciones en tiempo real
 * Utiliza la API nativa de WebSocket de React Native
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.userId = null;
    this.stompClient = null;
    this.subscriptions = [];
    this.heartbeatInterval = null;
    this.notificationHandler = null;
  }

  /**
   * Conecta al servidor WebSocket
   */
  async connect() {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No hay token disponible, no se puede conectar al WebSocket");
        return;
      }

      this.userId = this.getUserIdFromToken(token);
      if (!this.userId) {
        console.error("No se pudo obtener el userId del token");
        return;
      }

      // NOTA: WebSocket en React Native requiere SockJS client nativo
      // Por ahora, las notificaciones en mobile se manejarán solo con Push Notifications
      console.log("⚠️ WebSocket en React Native requiere configuración adicional");
      console.log("📱 Usando Push Notifications para notificaciones en mobile");
      
      // Marcar como "conectado" para evitar reintentos
      this.isConnected = true;
      return;

      // WebSocket nativo de React Native no soporta SockJS directamente
      // Las notificaciones se manejarán completamente con Push Notifications
    } catch (error) {
      console.error("Error al conectar WebSocket:", error);
      // No reintentar, usar solo Push Notifications
      this.isConnected = false;
    }
  }

  /**
   * Establece la conexión STOMP sobre WebSocket
   */
  connectStomp() {
    try {
      // Enviar comando CONNECT de STOMP
      const connectFrame = `CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\x00`;
      this.ws.send(connectFrame);

      // Iniciar heartbeat
      this.startHeartbeat();
    } catch (error) {
      console.error("Error al conectar STOMP:", error);
    }
  }

  /**
   * Maneja los mensajes recibidos del servidor
   */
  handleMessage(data) {
    try {
      // Detectar tipo de frame STOMP
      if (data.startsWith("CONNECTED")) {
        console.log("✅ STOMP conectado, suscribiéndose a notificaciones...");
        this.subscribeToNotifications();
      } else if (data.startsWith("MESSAGE")) {
        const notification = this.parseStompMessage(data);
        if (notification) {
          this.handleNotification(notification);
        }
      } else if (data.startsWith("ERROR")) {
        console.error("Error STOMP:", data);
      }
    } catch (error) {
      console.error("Error al procesar mensaje:", error);
    }
  }

  /**
   * Parsea un mensaje STOMP
   */
  parseStompMessage(data) {
    try {
      // Extraer el body del mensaje STOMP
      const lines = data.split("\n");
      const bodyIndex = lines.findIndex((line) => line === "");
      if (bodyIndex > 0 && bodyIndex < lines.length - 1) {
        const body = lines.slice(bodyIndex + 1).join("\n").replace(/\x00$/, "");
        return JSON.parse(body);
      }
    } catch (error) {
      console.error("Error al parsear mensaje STOMP:", error);
    }
    return null;
  }

  /**
   * Se suscribe al canal de notificaciones del usuario
   */
  subscribeToNotifications() {
    try {
      const destination = `/user/queue/notifications`;
      const subscriptionId = `sub-${this.userId}`;

      const subscribeFrame = `SUBSCRIBE\nid:${subscriptionId}\ndestination:${destination}\nack:auto\n\n\x00`;
      this.ws.send(subscribeFrame);

      console.log(`📬 Suscrito a notificaciones para el usuario ${this.userId}`);
    } catch (error) {
      console.error("Error al suscribirse:", error);
    }
  }

  /**
   * Maneja las notificaciones recibidas
   */
  handleNotification(notification) {
    console.log("🔔 Notificación recibida:", notification);

    // Mostrar alerta en la app
    if (notification.title && notification.message) {
      Alert.alert(
        notification.title,
        notification.message,
        [
          {
            text: "OK",
            onPress: () => console.log("Notificación cerrada"),
          },
        ],
        { cancelable: true }
      );
    }

    // Llamar al handler personalizado si existe
    if (this.notificationHandler) {
      this.notificationHandler(notification);
    }
  }

  /**
   * Registra un handler para notificaciones
   */
  setNotificationHandler(handler) {
    this.notificationHandler = handler;
  }

  /**
   * Inicia el heartbeat para mantener la conexión activa
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        try {
          // Enviar frame de heartbeat vacío
          this.ws.send("\n");
        } catch (error) {
          console.error("Error al enviar heartbeat:", error);
        }
      }
    }, 20000); // Cada 20 segundos
  }

  /**
   * Extrae el userId del token JWT
   */
  getUserIdFromToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = JSON.parse(
        Buffer.from(payload, "base64").toString("utf-8")
      );
      return decoded.userId || decoded.sub || decoded.id;
    } catch (error) {
      // Fallback para React Native
      try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        return decoded.userId || decoded.sub || decoded.id;
      } catch (e) {
        console.error("Error al decodificar token:", error);
        return null;
      }
    }
  }

  /**
   * Maneja la reconexión automática
   */
  handleReconnect() {
    // Deshabilitado en React Native - usar Push Notifications
    console.log("ℹ️ WebSocket no disponible en mobile, usando Push Notifications");
    this.isConnected = false;
    return;
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect() {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {
          // Ignorar errores al cerrar
        }
      }

      this.isConnected = false;
      this.ws = null;
      console.log("WebSocket service limpiado");
    } catch (error) {
      console.error("Error al desconectar:", error);
    }
  }

  /**
   * Verifica si está conectado
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Exportar instancia singleton
const webSocketService = new WebSocketService();
export default webSocketService;

