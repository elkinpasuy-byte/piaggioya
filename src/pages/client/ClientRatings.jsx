import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ClientRatings() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const loadRatings = async () => {
      if (!userData?.email) return;
      const q = query(collection(db, 'shipments'), where('clientId', '==', userData.email), where('rating.stars', '!=', null));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setRatings(list);
    };
    loadRatings();
  }, [userData]);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>⭐ Mis calificaciones</h1>
      {ratings.length === 0 ? <p>No has calificado ningún viaje aún.</p> : ratings.map(r => (
        <div key={r.id} style={styles.card}>
          <p><strong>{r.driverName || 'Conductor'}</strong> - {r.cargoType}</p>
          <p>⭐ {r.rating.stars}/5</p>
          {r.rating.comment && <p><em>"{r.rating.comment}"</em></p>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
};