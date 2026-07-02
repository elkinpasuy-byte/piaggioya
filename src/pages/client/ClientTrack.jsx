import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { MapPin, Package, Clock } from 'lucide-react';

export default function ClientTrack() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeShipment, setActiveShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActive = async () => {
      if (!userData?.email) return;
      const q = query(
        collection(db, 'shipments'),
        where('clientId', '==', userData.email),
        where('status', 'in', ['pending', 'accepted', 'in_progress'])
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setActiveShipment(list[0] || null);
      setLoading(false);
    };
    loadActive();
  }, [userData]);

  if (loading) return <div style={styles.loading}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>📍 Mi envío</h1>
      {activeShipment ? (
        <div style={styles.card}>
          <p><MapPin size={16} /> <strong>Recogida:</strong> {activeShipment.pickupAddress}</p>
          <p><MapPin size={16} /> <strong>Entrega:</strong> {activeShipment.deliveryAddress}</p>
          <p><Package size={16} /> <strong>Carga:</strong> {activeShipment.cargoType} - {activeShipment.cargoWeight} kg</p>
          <p><Clock size={16} /> <strong>Estado:</strong> {activeShipment.status}</p>
          <button onClick={() => navigate(`/track/${activeShipment.id}`)} style={styles.btn}>Ver en mapa</button>
        </div>
      ) : (
        <p>No tienes envíos activos.</p>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  btn: { marginTop: '12px', padding: '10px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px' }
};