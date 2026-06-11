// src/pages/ClientTrips.jsx
// Historial de envíos del cliente con estado y calificación

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientShipments, updateShipmentStatus, rateShipment } from '../services/shipmentService';
import { useNavigate } from 'react-router-dom';

export const ClientTrips = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [ratingModal, setRatingModal] = useState({ open: false, shipmentId: null });
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userData?.email) {
      loadShipments();
    }
  }, [userData]);

  const loadShipments = async () => {
    setLoading(true);
    const result = await getClientShipments(userData.email);
    if (result.success) {
      setShipments(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCancelShipment = async (shipmentId) => {
    if (!window.confirm('¿Cancelar este envío?')) return;
    const result = await updateShipmentStatus(shipmentId, 'cancelled');
    if (result.success) {
      await loadShipments();
      alert('✅ Envío cancelado');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const openRatingModal = (shipmentId) => {
    setRatingModal({ open: true, shipmentId });
    setRatingValue(0);
    setRatingComment('');
  };

  const submitRating = async () => {
    if (ratingValue === 0) {
      alert('Selecciona una calificación');
      return;
    }
    setSubmitting(true);
    const result = await rateShipment(ratingModal.shipmentId, ratingValue, ratingComment);
    if (result.success) {
      await loadShipments();
      setRatingModal({ open: false, shipmentId: null });
      alert('✅ ¡Gracias por calificar!');
    } else {
      alert('❌ Error: ' + result.error);
    }
    setSubmitting(false);
  };

  const getStatusText = (status) => {
    const map = {
      'pending': '🕐 Pendiente',
      'accepted': '✅ Aceptado',
      'loaded': '🚚 En camino',
      'delivered': '🏁 Entregado',
      'cancelled': '❌ Cancelado'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      'pending': '#ffc107',
      'accepted': '#17a2b8',
      'loaded': '#007bff',
      'delivered': '#28a745',
      'cancelled': '#dc3545'
    };
    return map[status] || '#6c757d';
  };

  const filteredShipments = shipments.filter(s => filter === 'todos' || s.status === filter);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>← Volver al mapa</button>
        <h1 style={styles.title}>📦 Mis envíos</h1>
        <button onClick={loadShipments} style={styles.refreshButton}>🔄</button>
      </div>

      <div style={styles.filters}>
        {['todos', 'pending', 'accepted', 'loaded', 'delivered'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{...styles.filterBtn, ...(filter === s ? styles.filterActive : {})}}>
            {s === 'todos' ? 'Todos' : getStatusText(s)}
          </button>
        ))}
      </div>

      {loading && <div style={styles.loading}>Cargando...</div>}
      {error && <div style={styles.error}>❌ {error}</div>}

      {!loading && !error && filteredShipments.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📭</div>
          <div>No hay envíos</div>
        </div>
      )}

      <div style={styles.list}>
        {filteredShipments.map(shipment => {
          const isCompleted = shipment.status === 'delivered';
          const isRated = !!shipment.rating;
          const isPending = shipment.status === 'pending';
          const isActive = ['accepted', 'loaded'].includes(shipment.status);
          const canRate = isCompleted && !isRated;

          return (
            <div key={shipment.id} style={{...styles.card, opacity: isCompleted ? 0.8 : 1, background: isCompleted ? '#f5f5f5' : 'white'}}>
              <div style={styles.cardHeader}>
                <span style={styles.shipmentId}>#{shipment.id.slice(-6)}</span>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(shipment.status)}}>
                  {getStatusText(shipment.status)}
                </span>
              </div>

              <div style={styles.addresses}>
                <div>📍 {shipment.pickupAddress}</div>
                <div>🏁 {shipment.deliveryAddress}</div>
              </div>

              <div style={styles.cargoInfo}>
                📦 {shipment.cargoType} - {shipment.cargoWeight} kg
              </div>

              <div style={styles.driverInfo}>
                {shipment.driverName ? `🛵 Conductor: ${shipment.driverName}` : '⏳ Buscando conductor...'}
              </div>

              <div style={styles.actions}>
                {isPending && (
                  <button onClick={() => handleCancelShipment(shipment.id)} style={styles.cancelBtn}>
                    ❌ Cancelar
                  </button>
                )}

                {isActive && (
                 // En el botón "Seguir envío"
<button onClick={() => navigate('/', { state: { shipmentId: shipment.id } })}>
  📍 Seguir envío
</button>
                )}

                {canRate && (
                  <button onClick={() => openRatingModal(shipment.id)} style={styles.rateBtn}>
                    ⭐ Calificar viaje
                  </button>
                )}

                {isRated && (
                  <div style={styles.ratedBox}>
                    ⭐ Calificado: {shipment.rating.stars}/5
                    {shipment.rating.comment && <div style={styles.ratedComment}>"{shipment.rating.comment}"</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de calificación */}
      {ratingModal.open && (
        <>
          <div style={styles.modalOverlay} onClick={() => setRatingModal({ open: false, shipmentId: null })} />
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>⭐ Calificar viaje</h3>
            <div style={styles.stars}>
              {[1,2,3,4,5].map(star => (
                <span key={star} onClick={() => setRatingValue(star)} style={{fontSize: 40, cursor: 'pointer', color: star <= ratingValue ? '#FFD700' : '#ccc'}}>★</span>
              ))}
            </div>
            <textarea placeholder="Escribe un comentario (opcional)" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} style={styles.commentInput} rows={3} />
            <div style={styles.modalActions}>
              <button onClick={() => setRatingModal({ open: false, shipmentId: null })} style={styles.cancelModalBtn}>Cancelar</button>
              <button onClick={submitRating} disabled={submitting} style={styles.submitModalBtn}>{submitting ? 'Enviando...' : 'Enviar calificación'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', padding: '20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  backButton: { background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' },
  refreshButton: { background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '18px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '600' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' },
  filterActive: { background: '#667eea', color: 'white', borderColor: '#667eea' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { textAlign: 'center', padding: '20px', color: '#c00', background: '#fee', borderRadius: '12px' },
  empty: { textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #eee' },
  shipmentId: { fontFamily: 'monospace', fontSize: '11px', color: '#888' },
  statusBadge: { padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', color: 'white' },
  addresses: { fontSize: '13px', marginBottom: '8px', color: '#333' },
  cargoInfo: { fontSize: '12px', color: '#666', marginBottom: '8px' },
  driverInfo: { fontSize: '12px', color: '#888', marginBottom: '12px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  cancelBtn: { padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  trackBtn: { padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  rateBtn: { padding: '8px 12px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  ratedBox: { padding: '8px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: '#2e7d32' },
  ratedComment: { fontSize: '11px', color: '#666', marginTop: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '20px', padding: '24px', maxWidth: '320px', width: '90%', zIndex: 2001 },
  modalTitle: { textAlign: 'center', marginBottom: '20px' },
  stars: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  commentInput: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', resize: 'vertical', marginBottom: '20px' },
  modalActions: { display: 'flex', gap: '12px' },
  cancelModalBtn: { flex: 1, padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitModalBtn: { flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};