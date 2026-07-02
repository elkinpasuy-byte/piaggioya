import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DriverEarnings() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadEarnings = async () => {
      if (!userData?.email) return;
      const q = query(collection(db, 'shipments'), where('driverId', '==', userData.email), where('status', '==', 'delivered'));
      const snapshot = await getDocs(q);
      let sum = 0;
      let cnt = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        sum += data.estimatedPrice || 0;
        cnt++;
      });
      setTotal(sum);
      setCount(cnt);
    };
    loadEarnings();
  }, [userData]);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>💰 Ganancias</h1>
      <div style={styles.card}>
        <p style={styles.total}>${total.toLocaleString()}</p>
        <p>Total ganado en {count} viajes completados</p>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  total: { fontSize: '32px', fontWeight: '700', color: '#4CAF50' }
};