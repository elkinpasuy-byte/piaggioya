import { useState, useEffect, useCallback, useRef } from 'react';
import { generarPiaggiosCercanos } from '../utils/generatePiaggios';

// Genera movimiento realista (20-50 metros por actualización)
const generateMovement = (currentLat, currentLng, centerLat, centerLng, maxRadiusKm = 2.5) => {
  const maxMovementMeters = 40;
  const movementInDegrees = maxMovementMeters / 111320;
  
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * movementInDegrees;
  
  let newLat = currentLat + Math.cos(angle) * distance;
  let newLng = currentLng + Math.sin(angle) * distance;
  
  // Limitar al radio permitido
  const latDiff = newLat - centerLat;
  const lngDiff = newLng - centerLng;
  const distanceFromCenter = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  const maxDistance = maxRadiusKm / 111.32;
  
  if (distanceFromCenter > maxDistance) {
    newLat = currentLat - (newLat - currentLat) * 0.5;
    newLng = currentLng - (newLng - currentLng) * 0.5;
  }
  
  return { lat: newLat, lng: newLng };
};

// Cambio de estado ocasional
const shouldChangeState = () => Math.random() < 0.03;

export const useRealTimePiaggios = (userLocation, updateInterval = 4000) => {
  const [piaggios, setPiaggios] = useState([]);
  const positionsRef = useRef(new Map());
  const intervalRef = useRef(null);
  const centerRef = useRef(null);

  // Inicializar Piaggios
  useEffect(() => {
    if (userLocation && piaggios.length === 0) {
      centerRef.current = { lat: userLocation.lat, lng: userLocation.lng };
      const initialPiaggios = generarPiaggiosCercanos(
        userLocation.lat,
        userLocation.lng,
        5
      );
      
      // Guardar posiciones iniciales
      initialPiaggios.forEach(piaggio => {
        positionsRef.current.set(piaggio.id, {
          lat: piaggio.coordenadas[0],
          lng: piaggio.coordenadas[1]
        });
      });
      
      setPiaggios(initialPiaggios);
    }
  }, [userLocation, piaggios.length]);

  // Actualizar posiciones
  const updatePositions = useCallback(() => {
    if (!centerRef.current || piaggios.length === 0) return;

    setPiaggios(prevPiaggios => {
      let hasChanges = false;
      
      const updatedPiaggios = prevPiaggios.map(piaggio => {
        const currentPos = positionsRef.current.get(piaggio.id);
        if (!currentPos) return piaggio;
        
        const newPos = generateMovement(
          currentPos.lat,
          currentPos.lng,
          centerRef.current.lat,
          centerRef.current.lng
        );
        
        const hasMoved = Math.abs(newPos.lat - currentPos.lat) > 0.000001 ||
                        Math.abs(newPos.lng - currentPos.lng) > 0.000001;
        
        if (hasMoved) {
          hasChanges = true;
          positionsRef.current.set(piaggio.id, newPos);
        }
        
        // Cambiar estado ocasionalmente
        let newEstado = piaggio.estado;
        let newEntregas = piaggio.entregasHoy;
        
        if (shouldChangeState()) {
          newEstado = piaggio.estado === 'disponible' ? 'ocupado' : 'disponible';
          if (piaggio.estado === 'ocupado' && newEstado === 'disponible') {
            newEntregas = piaggio.entregasHoy + 1;
          }
          hasChanges = true;
        }
        
        if (hasMoved || newEstado !== piaggio.estado) {
          return {
            ...piaggio,
            coordenadas: hasMoved ? [newPos.lat, newPos.lng] : piaggio.coordenadas,
            estado: newEstado,
            entregasHoy: newEntregas
          };
        }
        
        return piaggio;
      });
      
      return hasChanges ? updatedPiaggios : prevPiaggios;
    });
  }, [piaggios.length]);

  // Iniciar intervalo
  useEffect(() => {
    if (piaggios.length > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(updatePositions, updateInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updatePositions, piaggios.length, updateInterval]);

  return { 
    piaggios,
    lastUpdate: Date.now(),
    getPiaggioById: (id) => piaggios.find(p => p.id === id)
  };
};