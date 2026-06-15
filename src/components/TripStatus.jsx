// src/components/TripStatus.jsx
// Muestra el estado del viaje activo del cliente

import { useState, useEffect } from 'react';
import { getClientShipments } from '../services/shipmentService';

export const TripStatus = ({ userEmail }) => {
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const checkActiveTrip = async () => {
      const result = await getClientShipments(userEmail);
      if (result.success) {
        // Buscar viaje no completado
        const active = result.data.find(trip => 
          trip.status === 'pending' || trip.status === 'accepted' || trip.status === 'in_progress'
        );
        setActiveTrip(active);
      }
    };

    checkActiveTrip();
    const interval = setInterval(checkActiveTrip, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (!activeTrip) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '16px',
      right: '16px',
      background: 'white',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        🛵 Estado de tu viaje
      </div>
      <div style={{ fontSize: '13px', color: '#666' }}>
        {activeTrip.status === 'pending' && '🕐 Buscando conductor...'}
        {activeTrip.status === 'accepted' && '✅ Conductor en camino'}
        {activeTrip.status === 'completed' && '🏁 Viaje completado'}
      </div>
      {activeTrip.driverName && (
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          Conductor: {activeTrip.driverName}
        </div>
      )}
    </div>
  );
};