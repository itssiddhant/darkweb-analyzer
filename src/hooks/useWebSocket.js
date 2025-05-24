import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      try {
        // Clear any existing websocket
        if (wsRef.current) {
          wsRef.current.close();
        }
        
        console.log(`Connecting to WebSocket: ${url}`);
        wsRef.current = new WebSocket(url);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
          
          // Clear any reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            console.log('WebSocket message received:', parsedData);
            setData(parsedData);
          } catch (err) {
            console.error('Error parsing WebSocket data:', err);
            setError(new Error('Failed to parse WebSocket data'));
          }
        };
        
        wsRef.current.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };
        
        wsRef.current.onclose = (event) => {
          console.log(`WebSocket disconnected: code ${event.code}, reason: ${event.reason}`);
          setIsConnected(false);
          
          // Try to reconnect after a delay (exponential backoff would be better for production)
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        };
      } catch (err) {
        console.error('Error connecting to WebSocket:', err);
        setError(err);
        setIsConnected(false);
        
        // Try to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket after error...');
          connect();
        }, 5000);
      }
    };
    
    connect();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);
  
  return { isConnected, data, error };
};

export default useWebSocket;