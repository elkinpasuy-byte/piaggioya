// src/pages/client/ClientTrips.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getClientShipments } from '../../services/shipmentService';

export const ClientTrips = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    const result = await getClientShipments(userData.uid);
    if (result.success) {
      setShipments(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    if (!price) return 'No definido';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: '🕐 Pendiente',
      accepted: '✅ Aceptado',
      in_progress: '🚚 En ruta',
      delivered: '🏁 Entregado',
    };
    return statusMap[status] || status;
  };

  if (!userData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Acceso denegado</h2>
          <p>Inicia sesión para ver tus envíos.</p>
          <button onClick={() => navigate('/login')} style={styles.backButton}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/client/home')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📦 Mis envíos</h1>
        <button onClick={loadShipments} style={styles.refreshButton}>
          🔄
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          ❌ Error: {error}
          <button onClick={loadShipments} style={styles.retryButton}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Cargando envíos...</div>
      ) : shipments.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyText}>No tienes envíos</div>
          <div style={styles.emptySub}>Solicita tu primer envío</div>
          <button onClick={() => navigate('/client/request')} style={styles.requestButton}>
            Solicitar envío
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {shipments.map((shipment) => (
            <div key={shipment.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.tripId}>#{shipment.id.slice(-6)}</span>
                <span style={styles.badge(getStatusLabel(shipment.status))}>
                  {getStatusLabel(shipment.status)}
                </span>
                <span style={styles.time}>
                  {shipment.createdAt?.toDate?.() 
                    ? new Date(shipment.createdAt.toDate()).toLocaleDateString()
                    : 'Fecha desconocida'}
                </span>
              </div>
              
              <div style={styles.cargoInfo}>
                <div style={styles.cargoType}>
                  📦 {shipment.cargoType || 'Carga general'} • {shipment.cargoWeight} kg
                </div>
              </div>
              
              <div style={styles.addresses}>
                <div style={styles.addressRow}>
                  <span style={styles.addressIcon}>📍</span>
                  <span style={styles.addressText}>{shipment.pickupAddress}</span>
                </div>
                <div style={styles.addressRow}>
                  <span style={styles.addressIcon}>🏁</span>
                  <span style={styles.addressText}>{shipment.deliveryAddress}</span>
                </div>
              </div>
              
              <div style={styles.details}>
                <div style={styles.detailRow}>
                  <span>🚚 Conductor:</span>
                  <span>{shipment.driverName || 'Sin asignar'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>💰 Precio:</span>
                  <span style={styles.price}>
                    {shipment.agreedPrice 
                      ? formatPrice(shipment.agreedPrice)
                      : shipment.proposedPrice 
                        ? `Propuesta: ${formatPrice(shipment.proposedPrice)}`
                        : 'Por acordar'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (shipment.status === 'delivered') {
                    navigate(`/client/ratings?shipment=${shipment.id}`);
                  } else {
                    navigate(`/track/${shipment.id}`);
                  }
                }}
                style={styles.viewButton}
              >
                {shipment.status === 'delivered' ? '⭐ Calificar' : '👀 Ver seguimiento'}
              </button>
            </div>
          ))}
        </div>
      )}
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
  error: {
    background: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: '8px',
    padding: '6px 12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
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
    color: '#888',
    marginBottom: '16px'
  },
  requestButton: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
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
    borderBottom: '1px solid #eee',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tripId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888'
  },
  badge: (text) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
    background: text.includes('Pendiente') ? '#fff3cd' :
                text.includes('Aceptado') ? '#d4edda' :
                text.includes('En ruta') ? '#cce5ff' :
                text.includes('Entregado') ? '#e2e3e5' : '#f8f9fa',
    color: text.includes('Pendiente') ? '#856404' :
           text.includes('Aceptado') ? '#155724' :
           text.includes('En ruta') ? '#004085' :
           text.includes('Entregado') ? '#383d41' : '#6c757d'
  }),
  time: {
    fontSize: '11px',
    color: '#888'
  },
  cargoInfo: {
    marginBottom: '12px'
  },
  cargoType: {
    background: '#e3f2fd',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1565c0',
    display: 'inline-block'
  },
  addresses: {
    marginBottom: '12px',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  addressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    marginBottom: '6px'
  },
  addressIcon: {
    fontSize: '14px',
    minWidth: '24px'
  },
  addressText: {
    color: '#333',
    flex: 1
  },
  details: {
    marginBottom: '16px',
    padding: '8px 0',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee'
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
  viewButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  }
};