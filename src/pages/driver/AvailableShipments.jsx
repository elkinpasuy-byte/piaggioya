import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPendingShipments, makeOffer } from '../../services/shipmentService';

export const AvailableShipments = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offeringId, setOfferingId] = useState(null);
  const [offerPrice, setOfferPrice] = useState({});

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    const result = await getPendingShipments();
    if (result.success) {
      // Filtrar envíos que no tengan conductor asignado
      const available = result.data.filter(s => !s.driverId);
      setShipments(available);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleMakeOffer = async (shipmentId) => {
    const price = offerPrice[shipmentId];
    if (!price || parseFloat(price) <= 0) {
      alert('Ingresa un valor válido');
      return;
    }

    setOfferingId(shipmentId);
    const result = await makeOffer(shipmentId, {
      driverId: userData.uid,
      driverName: userData.nombre,
      driverPhone: userData.telefono,
      proposedPrice: parseFloat(price)
    });
    
    if (result.success) {
      alert('✅ Oferta enviada. Espera la respuesta del cliente.');
      setOfferPrice(prev => ({ ...prev, [shipmentId]: '' }));
      loadShipments(); // Recargar lista
    } else {
      alert('❌ Error: ' + result.error);
    }
    setOfferingId(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!userData || userData.role !== 'conductor') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Acceso denegado</h2>
          <p>Solo conductores pueden ver esta página.</p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/driver/home')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📦 Envíos disponibles</h1>
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
          <div style={styles.emptyText}>No hay envíos disponibles</div>
          <div style={styles.emptySub}>Los envíos aparecerán aquí cuando los clientes los soliciten</div>
        </div>
      ) : (
        <div style={styles.list}>
          {shipments.map((shipment) => (
            <div key={shipment.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.tripId}>#{shipment.id.slice(-6)}</span>
                <span style={styles.badge}>🕐 Disponible</span>
                <span style={styles.time}>
                  {shipment.createdAt?.toDate?.() 
                    ? new Date(shipment.createdAt.toDate()).toLocaleTimeString()
                    : 'Reciente'}
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
                  <span>👤 Cliente:</span>
                  <span>{shipment.clientName || shipment.clientId}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>💰 Pago estimado:</span>
                  <span style={styles.price}>{formatPrice(shipment.estimatedPrice || 0)}</span>
                </div>
              </div>

              <div style={styles.offerSection}>
                <div style={styles.offerInputGroup}>
                  <input
                    type="number"
                    placeholder="Tu oferta (COP)"
                    value={offerPrice[shipment.id] || ''}
                    onChange={(e) => setOfferPrice(prev => ({ ...prev, [shipment.id]: e.target.value }))}
                    style={styles.offerInput}
                    disabled={offeringId === shipment.id}
                  />
                  <button
                    onClick={() => handleMakeOffer(shipment.id)}
                    disabled={offeringId === shipment.id || !offerPrice[shipment.id]}
                    style={styles.offerButton}
                  >
                    {offeringId === shipment.id ? 'Enviando...' : '💰 Ofertar'}
                  </button>
                </div>
                <div style={styles.offerInfo}>
                  Las ofertas se envían al cliente, quien decidirá cuál aceptar.
                </div>
              </div>
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
    borderBottom: '1px solid #eee',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tripId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888'
  },
  badge: {
    background: '#d4edda',
    color: '#155724',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
  },
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
    marginBottom: '12px',
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
  offerSection: {
    marginTop: '12px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  offerInputGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '6px'
  },
  offerInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  offerButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  offerInfo: {
    fontSize: '11px',
    color: '#888',
    textAlign: 'center'
  }
};