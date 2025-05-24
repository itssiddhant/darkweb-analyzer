import { createContext, useContext, useState, useEffect } from 'react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState(() => {
    const savedAlerts = localStorage.getItem('customAlerts');
    return savedAlerts ? JSON.parse(savedAlerts) : [];
  });

  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  useEffect(() => {
    localStorage.setItem('customAlerts', JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = (alert) => {
    setAlerts([...alerts, { id: Date.now(), ...alert }]);
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const updateAlert = (id, updatedAlert) => {
    setAlerts(alerts.map(alert => alert.id === id ? { ...alert, ...updatedAlert } : alert));
  };

  const triggerAlert = (alert) => {
    setTriggeredAlerts([...triggeredAlerts, { id: Date.now(), alert, timestamp: new Date() }]);
  };

  const dismissTriggeredAlert = (id) => {
    setTriggeredAlerts(triggeredAlerts.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider 
      value={{ 
        alerts, 
        addAlert, 
        removeAlert, 
        updateAlert, 
        triggeredAlerts, 
        triggerAlert, 
        dismissTriggeredAlert 
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertContext);
}