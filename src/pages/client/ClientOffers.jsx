import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getClientShipments, getShipmentOffers, acceptOffer, rejectOffer } from '../../services/shipmentService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export const ClientOffers = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadShipmentsWithOffers();
  }, []);

  const loadShipmentsWithOffers = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    const result = await getClientShipments(userData.uid);
    if (result.success) {
      // Solo envíos en estado 'bidding' o 'pending' con ofertas
      const withOffers = result.data.filter(s => 
  (s.status === 'bidding' || s.status === 'pending') && 
  s.offers && s.offers.some(o => o.status === 'pending')
);
      setShipments(withOffers);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleAcceptOffer = async (shipmentId, offerId) => {
    if (!window.confirm('¿Aceptar esta oferta y asignar al conductor?')) return;
    
    setProcessingId(shipmentId);
    const result = await acceptOffer(shipmentId, offerId);
    if (result.success) {
      alert(`✅ Conductor ${result.driver.name} asignado. El viaje comenzará pronto.`);
      navigate(`/track/${shipmentId}`);
    } else {
      alert('❌ Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleRejectOffer = async (shipmentId, offerId) => {
    if (!window.confirm('¿Rechazar esta oferta?')) return;
    
    setProcessingId(shipmentId);
    const result = await rejectOffer(shipmentId, offerId);
    if (result.success) {
      alert('✅ Oferta rechazada');
      loadShipmentsWithOffers();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!userData || userData.role !== 'cliente') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Acceso denegado</h2>
          <p>Solo clientes pueden ver esta página.</p>
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
        <button onClick={() => navigate('/client/home')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📋 Ofertas recibidas</h1>
        <button onClick={loadShipmentsWithOffers} style={styles.refreshButton}>
          🔄
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          ❌ Error: {error}
          <button onClick={loadShipmentsWithOffers} style={styles.retryButton}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Cargando ofertas...</div>
      ) : shipments.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyText}>No tienes ofertas pendientes</div>
          <div style={styles.emptySub}>Los conductores harán ofertas cuando solicites un envío</div>
          <button onClick={() => navigate('/client/request')} style={styles.requestButton}>
            Solicitar envío
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {shipments.map((shipment) => {
            const offers = shipment.offers || [];
            const pendingOffers = offers.filter(o => o.status === 'pending');
            
            return (
              <div key={shipment.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.tripId}>#{shipment.id.slice(-6)}</span>
                  <span style={styles.badge}>
                    {pendingOffers.length} ofertas pendientes
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

                <div style={styles.offersList}>
                  <h4 style={styles.offersTitle}>Ofertas de conductores:</h4>
                  {pendingOffers.length === 0 ? (
                    <p style={styles.noOffers}>No hay ofertas pendientes</p>
                  ) : (
                    pendingOffers.map((offer) => (
                      <div key={offer.offerId} style={styles.offerCard}>
                        <div style={styles.offerInfo}>
                          <div style={styles.offerDriver}>
                            <strong>{offer.driverName}</strong>
                            <span style={styles.offerPhone}>📞 {offer.driverPhone || '---'}</span>
                          </div>
                          <div style={styles.offerPrice}>
                            💰 {formatPrice(offer.proposedPrice)}
                          </div>
                        </div>
                        <div style={styles.offerActions}>
                          <button
                            onClick={() => handleAcceptOffer(shipment.id, offer.offerId)}
                            disabled={processingId === shipment.id}
                            style={styles.acceptButton}
                          >
                            ✅ Aceptar
                          </button>
                          <button
                            onClick={() => handleRejectOffer(shipment.id, offer.offerId)}
                            disabled={processingId === shipment.id}
                            style={styles.rejectButton}
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {processingId === shipment.id && (
                  <div style={styles.processing}>Procesando...</div>
                )}
              </div>
            );
          })}
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
  badge: {
    background: '#fff3cd',
    color: '#856404',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
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
  offersList: {
    marginTop: '12px'
  },
  offersTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  noOffers: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    padding: '12px'
  },
  offerCard: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid #eee'
  },
  offerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  offerDriver: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  offerPhone: {
    fontSize: '12px',
    color: '#888'
  },
  offerPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#28a745'
  },
  offerActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  acceptButton: {
    padding: '6px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  },
  rejectButton: {
    padding: '6px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  },
  processing: {
    marginTop: '12px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  }
};