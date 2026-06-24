// src/pages/DriverHistory.jsx
// ==================== HISTORIAL DE VIAJES PARA CONDUCTORES ====================
// Muestra todos los viajes que el conductor ha aceptado/completado/cancelado

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDriverShipmentsHistory } from '../services/shipmentService';
import { useNavigate } from 'react-router-dom';

export const DriverHistory = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos'); // todos, accepted, completed, cancelled

  // Cargar viajes al montar el componente
  useEffect(() => {
    if (userData?.email) {
      loadTrips();
    }
  }, [userData]);

  // Función para cargar viajes desde Firestore
  const loadTrips = async () => {
    setLoading(true);
    const result = await getDriverShipmentsHistory(userData?.email);
    
    if (result.success) {
      setTrips(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Filtrar viajes según estado seleccionado
  const filteredTrips = trips.filter(trip => {
    if (filter === 'todos') return true;
    return trip.status === filter;
  });

  // Formatear fecha para mostrar
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Traducir estado al español
  const getStatusText = (status) => {
    const statusMap = {
      'accepted': '✅ Aceptado',
      'in_progress': '🚀 En viaje',
      'delivered': '🏁 Completado',
      'cancelled': '❌ Cancelado',
      'pending': '🕐 Pendiente'
    };
    return statusMap[status] || status;
  };

  // Obtener color según estado
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ffc107',
      'accepted': '#17a2b8',
      'in_progress': '#007bff',
      'delivered': '#28a745',
      'cancelled': '#dc3545'
    };
    return colorMap[status] || '#6c757d';
  };

  // Formatear precio
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Verificar si el usuario es conductor
  if (!userData || userData.role !== 'conductor') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Acceso denegado</h2>
          <p>Esta página es solo para conductores.</p>
          <button onClick={() => navigate('/')} style={styles.button}>
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header con botones de navegación */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📋 Mi historial de viajes</h1>
        <button onClick={loadTrips} style={styles.refreshButton}>
          🔄
        </button>
      </div>

      {/* Enlace a viajes pendientes (solo para conductores) */}
      <div style={styles.pendingLink}>
        <button onClick={() => navigate('/driver/trips')} style={styles.pendingButton}>
          🕐 Ver viajes pendientes
        </button>
      </div>

      {/* Filtros por estado */}
      <div style={styles.filters}>
        <button
          onClick={() => setFilter('todos')}
          style={{ ...styles.filterButton, ...(filter === 'todos' ? styles.filterActive : {}) }}
        >
          Todos ({trips.length})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          style={{ ...styles.filterButton, ...(filter === 'accepted' ? styles.filterActive : {}) }}
        >
          Aceptados ({trips.filter(t => t.status === 'accepted').length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          style={{ ...styles.filterButton, ...(filter === 'in_progress' ? styles.filterActive : {}) }}
        >
          En viaje ({trips.filter(t => t.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          style={{ ...styles.filterButton, ...(filter === 'delivered' ? styles.filterActive : {}) }}
        >
          Completados ({trips.filter(t => t.status === 'delivered').length})
        </button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div style={styles.loading}>
          <div>Cargando tu historial...</div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && !loading && (
        <div style={styles.error}>
          <div>❌ Error: {error}</div>
          <button onClick={loadTrips} style={styles.retryButton}>Reintentar</button>
        </div>
      )}

      {/* Lista de viajes */}
      {!loading && !error && (
        <>
          {filteredTrips.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyText}>
                {filter === 'todos' 
                  ? 'No tienes viajes en tu historial' 
                  : `No hay viajes con estado "${getStatusText(filter)}"`}
              </div>
              <div style={styles.emptySub}>
                {filter === 'todos' 
                  ? 'Los viajes que aceptes aparecerán aquí' 
                  : 'Cambia el filtro para ver otros viajes'}
              </div>
            </div>
          ) : (
            <div style={styles.list}>
              {filteredTrips.map((trip) => (
                <div key={trip.id} style={styles.card}>
                  {/* Cabecera de la tarjeta */}
                  <div style={styles.cardHeader}>
                    <span style={styles.tripId}>#{trip.id.slice(-6)}</span>
                    <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(trip.status) }}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>

                  {/* Información del cliente */}
                  <div style={styles.clientInfo}>
                    <div style={styles.clientName}>👤 {trip.clientName || 'Cliente'}</div>
                    <div style={styles.clientContact}>📞 {trip.clientPhone || 'Sin contacto'}</div>
                  </div>

                  {/* Detalles del viaje */}
                  <div style={styles.tripDetails}>
                    <div style={styles.detailRow}>
                      <span>📍 Origen:</span>
                      <span>Lat: {trip.originLat?.toFixed(4)}, Lng: {trip.originLng?.toFixed(4)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>📏 Distancia:</span>
                      <span>{trip.estimatedDistance?.toFixed(1)} km</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>💰 Precio:</span>
                      <span style={styles.price}>{formatPrice(trip.estimatedPrice)}</span>
                    </div>
                  </div>

                  {/* Pie de la tarjeta con fechas */}
                  <div style={styles.cardFooter}>
                    <div>Solicitado: {formatDate(trip.createdAt)}</div>
                    {trip.acceptedAt && (
                      <div>Aceptado: {formatDate(trip.acceptedAt)}</div>
                    )}
                    {trip.completedAt && (
                      <div>Completado: {formatDate(trip.completedAt)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==================== ESTILOS ====================
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
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
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
  refreshButton: {
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600'
  },
  pendingLink: {
    marginBottom: '16px'
  },
  pendingButton: {
    background: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px'
  },
  filterActive: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#c00',
    background: '#fee',
    borderRadius: '12px'
  },
  retryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '8px'
  },
  emptySub: {
    fontSize: '14px',
    color: '#888'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee'
  },
  tripId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
    color: 'white'
  },
  clientInfo: {
    marginBottom: '12px',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  clientName: {
    fontWeight: '600',
    fontSize: '15px',
    marginBottom: '4px'
  },
  clientContact: {
    fontSize: '12px',
    color: '#666'
  },
  tripDetails: {
    marginBottom: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    color: '#555'
  },
  price: {
    fontWeight: '600',
    color: '#28a745'
  },
  cardFooter: {
    paddingTop: '8px',
    borderTop: '1px solid #eee',
    fontSize: '11px',
    color: '#888'
  },
  button: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};