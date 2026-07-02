import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DriverRatings() {
  const { userData } = useAuth();
  console.log("Email conductor:", userData?.email);
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    const loadRatings = async () => {
      if (!userData?.email) return;
      const q = query(collection(db, 'shipments'), where('driverId', '==', userData.email), where('rating.stars', '!=', null));
      const snapshot = await getDocs(q);
      console.log("Viajes encontrados:", snapshot.docs.length);
      const list = [];
      let total = 0;
      snapshot.forEach(doc => {console.log(doc.data());
        const data = doc.data();
        list.push(data);
        total += data.rating.stars;
      });
      setRatings(list);
      setAverage(list.length ? total / list.length : 0);
    };
    loadRatings();
  }, [userData]);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>⭐ Mis calificaciones</h1>
      <p style={styles.average}>Promedio: {average.toFixed(1)} / 5.0 ({ratings.length} calificaciones)</p>
      {ratings.length === 0 ? <p>Aún no tienes calificaciones.</p> : ratings.map((r, i) => (
        <div key={i} style={styles.card}>
          <p><strong>{r.clientName || 'Cliente'}</strong></p>
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
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
  average: { fontSize: '18px', fontWeight: '600', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
};