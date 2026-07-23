import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { StarRating } from '../../components/ui/StarRating';

export default function ClientRatings() {
  const { shipmentId } = useParams();
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Estados para calificación individual
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Estados para listado de calificaciones
  const [ratings, setRatings] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // ==========================================================
  // MODO 1: Calificar un envío específico (tiene shipmentId)
  // ==========================================================
  useEffect(() => {
    if (!shipmentId) {
      setLoading(false);
      return;
    }

    const loadShipment = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'shipments', shipmentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setShipment(data);
          if (data.rating) {
            setStars(data.rating.stars || 0);
            setComment(data.rating.comment || '');
            setSubmitted(true);
          }
        } else {
          setError('Envío no encontrado');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadShipment();
  }, [shipmentId]);

  // ==========================================================
  // MODO 2: Listar todas las calificaciones (no tiene shipmentId)
  // ==========================================================
  useEffect(() => {
    if (shipmentId || !userData?.email) {
      return;
    }

    const loadRatings = async () => {
      setLoadingList(true);
      try {
        // Dentro del useEffect del listado:
const q = query(
  collection(db, 'shipments'),
  where('clientId', '==', userData.uid), // ← CAMBIADO: uid en lugar de email
  where('rating.stars', '!=', null)
);
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setRatings(list);
      } catch (err) {
        console.error('Error cargando calificaciones:', err);
      } finally {
        setLoadingList(false);
      }
    };

    loadRatings();
  }, [shipmentId, userData?.email]);

  // ==========================================================
  // Enviar calificación (modo individual)
  // ==========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars === 0) {
      alert('Por favor selecciona una calificación de estrellas.');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = doc(db, 'shipments', shipmentId);
      await updateDoc(docRef, {
        rating: {
          stars,
          comment: comment.trim(),
          ratedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });
      setSubmitted(true);
      alert('✅ Calificación guardada. ¡Gracias!');
      setTimeout(() => navigate('/client/trips'), 1500);
    } catch (err) {
      alert('❌ Error al guardar la calificación: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER: Si hay shipmentId, mostrar el formulario de calificación
  // ==========================================================
  if (shipmentId) {
    if (loading) return <div style={styles.container}>Cargando...</div>;
    if (error) return (
      <div style={styles.container}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      </div>
    );
    if (!shipment) return <div style={styles.container}>Envío no encontrado</div>;

    if (shipment.status !== 'delivered') {
      return (
        <div style={styles.container}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
          <p style={{ marginTop: '16px' }}>Este viaje aún no ha sido entregado. No puedes calificarlo.</p>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
        <h1 style={styles.title}>⭐ Calificar viaje</h1>

        <div style={styles.infoCard}>
          <p><strong>Conductor:</strong> {shipment.driverName || 'No asignado'}</p>
          <p><strong>Carga:</strong> {shipment.cargoType || 'Carga general'} - {shipment.cargoWeight} kg</p>
          <p><strong>Fecha:</strong> {shipment.updatedAt?.toDate?.()?.toLocaleDateString() || 'Fecha desconocida'}</p>
        </div>

        {submitted ? (
          <div style={styles.submittedCard}>
            <p style={styles.submittedIcon}>✅</p>
            <p style={styles.submittedText}>¡Ya calificaste este viaje!</p>
            <p>⭐ {stars}/5</p>
            {comment && <p><em>"{comment}"</em></p>}
            <button onClick={() => navigate('/client/trips')} style={styles.button}>
              Ver mis envíos
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.starsSection}>
              <label style={styles.label}>Calificación:</label>
              <StarRating rating={stars} onRatingChange={setStars} />
            </div>

            <div style={styles.commentSection}>
              <label style={styles.label}>Comentario (opcional):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos tu experiencia con el conductor..."
                style={styles.textarea}
                rows="4"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || stars === 0}
              style={styles.button}
            >
              {submitting ? 'Enviando...' : 'Enviar calificación'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ==========================================================
  // RENDER: Si NO hay shipmentId, mostrar el LISTADO de calificaciones
  // ==========================================================
  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>⭐ Mis calificaciones</h1>

      {loadingList ? (
        <p>Cargando calificaciones...</p>
      ) : ratings.length === 0 ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyIcon}>📭</p>
          <p>No has calificado ningún viaje aún.</p>
          <p style={styles.emptySub}>Cuando completes un viaje, podrás calificar al conductor.</p>
        </div>
      ) : (
        ratings.map((r) => (
          <div key={r.id} style={styles.ratingCard}>
            <div style={styles.ratingHeader}>
              <span style={styles.driverName}>{r.driverName || 'Conductor'}</span>
              <span style={styles.ratingStars}>⭐ {r.rating.stars}/5</span>
            </div>
            <p style={styles.cargoType}>{r.cargoType || 'Carga general'} - {r.cargoWeight} kg</p>
            {r.rating.comment && (
              <p style={styles.commentText}><em>"{r.rating.comment}"</em></p>
            )}
            <p style={styles.ratingDate}>
              {r.rating.ratedAt ? new Date(r.rating.ratedAt).toLocaleDateString() : 'Fecha desconocida'}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 0'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px'
  },
  infoCard: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    border: '1px solid #eee'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  starsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  commentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#333'
  },
  textarea: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  button: {
    padding: '12px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  submittedCard: {
    textAlign: 'center',
    padding: '24px',
    background: '#d4edda',
    borderRadius: '12px',
    border: '1px solid #c3e6cb'
  },
  submittedIcon: {
    fontSize: '48px',
    marginBottom: '8px'
  },
  submittedText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#155724',
    marginBottom: '8px'
  },
  emptyCard: {
    textAlign: 'center',
    padding: '40px 20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #eee'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '8px'
  },
  emptySub: {
    fontSize: '14px',
    color: '#888',
    marginTop: '8px'
  },
  ratingCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    border: '1px solid #eee'
  },
  ratingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  driverName: {
    fontWeight: '600',
    fontSize: '16px'
  },
  ratingStars: {
    fontWeight: '600',
    color: '#f59e0b'
  },
  cargoType: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px'
  },
  commentText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '4px'
  },
  ratingDate: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  }
};