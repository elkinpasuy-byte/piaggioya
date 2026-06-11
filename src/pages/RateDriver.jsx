// src/pages/RateDriver.jsx
// Pantalla para calificar al conductor después del viaje

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getShipmentById, rateShipment, updateDriverAverageRating } from '../services/shipmentService';
import { StarRating } from '../components/ui/StarRating';

export const RateDriver = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrip = async () => {
      const result = await getShipmentById(tripId);
      if (result.success) {
        setTrip(result.data);
        // Si ya fue calificado, mostrar la calificación existente
        if (result.data.driverRating) {
          setRating(result.data.driverRating.stars);
          setComment(result.data.driverRating.comment || '');
        }
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    loadTrip();
  }, [tripId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setSubmitting(true);
    
    // Guardar calificación
    const result = await rateShipment(tripId, rating, comment);
    
    if (result.success) {
      // Actualizar promedio del conductor
      await updateDriverAverageRating(trip?.driverId);
      alert('✅ ¡Gracias por calificar!');
      navigate('/client/trips');
    } else {
      setError(result.error);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Error</h2>
          <p>{error || 'Viaje no encontrado'}</p>
          <button onClick={() => navigate('/client/trips')} style={styles.button}>
            Volver al historial
          </button>
        </div>
      </div>
    );
  }

  // Verificar que el viaje sea del cliente y esté completado
  if (trip.clientId !== userData?.email) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Acceso denegado</h2>
          <p>Este viaje no te pertenece</p>
          <button onClick={() => navigate('/client/trips')} style={styles.button}>
            Volver al historial
          </button>
        </div>
      </div>
    );
  }

  const alreadyRated = !!trip.driverRating;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🛵 Calificar viaje</h1>
        
        <div style={styles.driverInfo}>
          <div style={styles.driverName}>Conductor: {trip.piaggioName}</div>
          <div style={styles.driverPlaca}>Placa: {trip.piaggioPlaca}</div>
          <div style={styles.date}>
            Fecha: {new Date(trip.createdAt?.toDate()).toLocaleDateString('es-CO')}
          </div>
        </div>

        <div style={styles.ratingSection}>
          <p style={styles.ratingLabel}>
            {alreadyRated ? 'Tu calificación' : '¿Cómo fue tu experiencia?'}
          </p>
          
          <StarRating
            initialRating={rating}
            onRatingChange={setRating}
            readonly={alreadyRated}
            size={40}
          />
          
          {!alreadyRated && (
            <p style={styles.hint}>Toca las estrellas para calificar</p>
          )}
        </div>

        <div style={styles.commentSection}>
          <label style={styles.label}>Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos cómo fue tu experiencia..."
            style={styles.textarea}
            rows={4}
            disabled={alreadyRated}
          />
        </div>

        {!alreadyRated && (
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{
              ...styles.submitButton,
              opacity: (submitting || rating === 0) ? 0.6 : 1
            }}
          >
            {submitting ? 'Enviando...' : '⭐ Enviar calificación'}
          </button>
        )}

        {alreadyRated && (
          <div style={styles.alreadyRated}>
            <p>✅ Ya calificaste este viaje</p>
            <p style={styles.thanksText}>¡Gracias por tu opinión!</p>
          </div>
        )}

        <button onClick={() => navigate('/client/trips')} style={styles.backButton}>
          ← Volver al historial
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '24px',
    color: '#333'
  },
  driverInfo: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'center'
  },
  driverName: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  driverPlaca: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px'
  },
  date: {
    fontSize: '12px',
    color: '#888'
  },
  ratingSection: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  ratingLabel: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '12px',
    color: '#555'
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px'
  },
  commentSection: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#555'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px'
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  alreadyRated: {
    textAlign: 'center',
    padding: '16px',
    background: '#e8f5e9',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  thanksText: {
    fontSize: '12px',
    color: '#4CAF50',
    marginTop: '4px'
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px'
  }
};