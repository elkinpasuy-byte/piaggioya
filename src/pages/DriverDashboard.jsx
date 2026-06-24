// src/pages/DriverDashboard.jsx
// Panel exclusivo para conductores (sin simulación)

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const DriverHome = () => {
  console.log('🚀 ESTOY EN DRIVERDASHBOARD');

  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalViajes: 0,
    viajesCompletados: 0,
    viajesPendientes: 0,
    calificacionPromedio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userData?.email) return;

      try {
        // Obtener viajes del conductor
        const q = query(
          collection(db, 'shipments'),
          where('driverId', '==', userData.email)
        );
        const snapshot = await getDocs(q);
        const viajes = [];
        snapshot.forEach(doc => viajes.push(doc.data()));

        const completados = viajes.filter(v => v.status === 'delivered');
        const pendientes = viajes.filter(v => v.status === 'pending' || v.status === 'accepted');

        // Calcular promedio de calificaciones
        let totalStars = 0;
        let totalRatings = 0;
        viajes.forEach(v => {
          if (v.rating?.stars) {
            totalStars += v.rating.stars;
            totalRatings++;
          }
        });
        const promedio = totalRatings > 0 ? totalStars / totalRatings : 0;

        setStats({
          totalViajes: viajes.length,
          viajesCompletados: completados.length,
          viajesPendientes: pendientes.length,
          calificacionPromedio: Math.round(promedio * 10) / 10
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
      setLoading(false);
    };

    loadStats();
  }, [userData]);

  if (loading) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📊 Panel del Conductor</h1>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalViajes}</div>
          <div style={styles.statLabel}>Total Viajes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.viajesCompletados}</div>
          <div style={styles.statLabel}>Completados</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.viajesPendientes}</div>
          <div style={styles.statLabel}>Pendientes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.calificacionPromedio.toFixed(1)}</div>
          <div style={styles.statLabel}>⭐ Calificación</div>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={() => navigate('/driver/trips')} style={styles.primaryButton}>
          📦 Ver envíos disponibles
        </button>
        <button onClick={() => navigate('/driver/history')} style={styles.secondaryButton}>
          📋 Ver historial
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  backButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '150px'
  },
  secondaryButton: {
    flex: 1,
    padding: '12px',
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '150px'
  }
};