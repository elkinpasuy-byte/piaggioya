// src/pages/ClientChat.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatModal } from '../components/ChatModal';
import { getShipmentById } from '../services/shipmentService';

export const ClientChat = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShipment = async () => {
      const result = await getShipmentById(shipmentId);
      if (result.success) {
        setShipment(result.data);
      }
      setLoading(false);
    };
    loadShipment();
  }, [shipmentId]);

  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (!shipment) return <div style={styles.loading}>Viaje no encontrado</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h2 style={styles.title}>💬 Chat con el conductor</h2>
      <div style={styles.info}>
        <p><strong>Viaje:</strong> {shipment.pickupAddress} → {shipment.deliveryAddress}</p>
        <p><strong>Conductor:</strong> {shipment.driverName || 'Asignando...'}</p>
      </div>
      <div style={styles.chatWrapper}>
        <ChatModal
          isOpen={true}
          onClose={() => navigate(-1)}
          shipmentId={shipmentId}
          userData={userData}
        />
      </div>
    </div>
  );
};

const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '600px', 
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f5f7fb',
  },
  backBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#667eea', 
    fontSize: '16px', 
    cursor: 'pointer',
    padding: '8px 0',
  },
  title: { 
    fontSize: '20px', 
    fontWeight: '600', 
    marginBottom: '12px',
    color: '#1a1a2e',
  },
  info: { 
    background: '#fff', 
    padding: '12px 16px', 
    borderRadius: '12px', 
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  chatWrapper: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    height: '60vh',
  },
  loading: { 
    textAlign: 'center', 
    padding: '40px',
    color: '#888',
  },
};
export default ClientChat;