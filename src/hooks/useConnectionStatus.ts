import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const isConnectedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      const connected = data.status === 'ok';
      setIsConnected(connected);
      isConnectedRef.current = connected;
    } catch {
      setIsConnected(false);
      isConnectedRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        checkConnection();
      }, isConnectedRef.current ? 30000 : 5000);
    };

    startPolling();

    // Re-setup polling when connection state changes
    const id = window.setInterval(() => {
      const currentInterval = isConnectedRef.current ? 30000 : 5000;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(checkConnection, currentInterval);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(id);
    };
  }, [checkConnection]);

  return { isConnected, checkConnection };
}
