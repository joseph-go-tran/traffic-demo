import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface Notification {
    type: "info" | "warning" | "error" | "success";
    title: string;
    message: string;
    data?: any;
    timestamp: number;
}

export interface UseWebSocketOptions {
    url: string;
    namespace?: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    onConnect?: () => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
    onReconnect?: (attemptNumber: number) => void;
    onReconnectAttempt?: (attemptNumber: number) => void;
    onReconnectError?: (error: Error) => void;
    onReconnectFailed?: () => void;
}

export interface UseWebSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
    notifications: Notification[];
    connect: () => void;
    disconnect: () => void;
    subscribe: (userId?: string, channels?: string[]) => void;
    unsubscribe: (userId?: string, channels?: string[]) => void;
    clearNotifications: () => void;
    removeNotification: (index: number) => void;
}

export const useWebSocket = (
    options: UseWebSocketOptions
): UseWebSocketReturn => {
    const {
        url,
        namespace = "/notifications",
        autoConnect = true,
        reconnection = true,
        reconnectionAttempts = Infinity,
        reconnectionDelay = 1000,
        reconnectionDelayMax = 5000,
        onConnect,
        onDisconnect,
        onError,
        onReconnect,
        onReconnectAttempt,
        onReconnectError,
        onReconnectFailed,
    } = options;

    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const reconnectAttemptsRef = useRef(0);
    const isInitializedRef = useRef(false);

    // Store callbacks in refs to avoid recreating connect function
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    const onErrorRef = useRef(onError);
    const onReconnectRef = useRef(onReconnect);
    const onReconnectAttemptRef = useRef(onReconnectAttempt);
    const onReconnectErrorRef = useRef(onReconnectError);
    const onReconnectFailedRef = useRef(onReconnectFailed);

    // Update refs when callbacks change
    useEffect(() => {
        onConnectRef.current = onConnect;
        onDisconnectRef.current = onDisconnect;
        onErrorRef.current = onError;
        onReconnectRef.current = onReconnect;
        onReconnectAttemptRef.current = onReconnectAttempt;
        onReconnectErrorRef.current = onReconnectError;
        onReconnectFailedRef.current = onReconnectFailed;
    });

    const connect = useCallback(() => {
        // Prevent duplicate connections
        if (socketRef.current) {
            console.log("WebSocket already exists");
            return;
        }

        setIsConnecting(true);
        setError(null);

        const socketUrl = `${url}${namespace}`;
        console.log("Connecting to WebSocket:", socketUrl);

        const socket = io(socketUrl, {
            path: "/socket.io/",
            reconnection,
            reconnectionAttempts,
            reconnectionDelay,
            reconnectionDelayMax,
            transports: ["websocket", "polling"],
            autoConnect: true,
        });

        socketRef.current = socket;

        // Connection events
        socket.on("connect", () => {
            console.log("WebSocket connected:", socket.id);
            setIsConnected(true);
            setIsConnecting(false);
            setError(null);
            reconnectAttemptsRef.current = 0;
            onConnectRef.current?.();
        });

        socket.on("disconnect", (reason: string) => {
            console.log("WebSocket disconnected:", reason);
            setIsConnected(false);
            setIsConnecting(false);
            onDisconnectRef.current?.(reason);
        });

        socket.on("connect_error", (err: Error) => {
            console.error("WebSocket connection error:", err);
            setError(err);
            setIsConnecting(false);
            onErrorRef.current?.(err);
        });

        // Reconnection events
        socket.io.on("reconnect", (attemptNumber: number) => {
            console.log(
                "WebSocket reconnected after",
                attemptNumber,
                "attempts"
            );
            reconnectAttemptsRef.current = 0;
            onReconnectRef.current?.(attemptNumber);
        });

        socket.io.on("reconnect_attempt", (attemptNumber: number) => {
            console.log("WebSocket reconnection attempt:", attemptNumber);
            reconnectAttemptsRef.current = attemptNumber;
            setIsConnecting(true);
            onReconnectAttemptRef.current?.(attemptNumber);
        });

        socket.io.on("reconnect_error", (err: Error) => {
            console.error("WebSocket reconnection error:", err);
            setError(err);
            onReconnectErrorRef.current?.(err);
        });

        socket.io.on("reconnect_failed", () => {
            console.error("WebSocket reconnection failed");
            setIsConnecting(false);
            setError(new Error("Reconnection failed"));
            onReconnectFailedRef.current?.();
        });

        // Notification events
        socket.on("notification", (notification: Notification) => {
            console.log("Received notification:", notification);
            setNotifications((prev) => [notification, ...prev]);
        });

        socket.on("pong", (data: any) => {
            console.log("Pong received:", data);
        });
    }, [
        url,
        namespace,
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        reconnectionDelayMax,
    ]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            console.log("Disconnecting WebSocket");
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
            setIsConnecting(false);
        }
    }, []);

    const subscribe = useCallback((userId?: string, channels?: string[]) => {
        if (socketRef.current?.connected) {
            console.log("Subscribing to:", { userId, channels });
            socketRef.current.emit("subscribe", { userId, channels });
        } else {
            console.warn("Cannot subscribe: socket not connected");
        }
    }, []);

    const unsubscribe = useCallback((userId?: string, channels?: string[]) => {
        if (socketRef.current?.connected) {
            console.log("Unsubscribing from:", { userId, channels });
            socketRef.current.emit("unsubscribe", { userId, channels });
        }
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && !socketRef.current) {
            connect();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect]);

    return {
        socket: socketRef.current,
        isConnected,
        isConnecting,
        error,
        notifications,
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        clearNotifications,
        removeNotification,
    };
};
