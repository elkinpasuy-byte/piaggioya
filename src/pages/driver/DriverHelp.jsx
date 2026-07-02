import { useNavigate } from 'react-router-dom';

export default function DriverHelp() {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>❓ Ayuda</h1>
      <div style={styles.card}>
        <h3>Preguntas frecuentes</h3>
        <p><strong>¿Cómo veo los envíos disponibles?</strong> Ve a "Disponibles" en el menú.</p>
        <p><strong>¿Cómo acepto un envío?</strong> Toca "Aceptar" en la lista de disponibles.</p>
        <p><strong>¿Qué hago si tengo problemas?</strong> Contacta a soporte.</p>
        <p style={{ marginTop: '16px' }}>📧 Soporte: soporte@piaggioya.com</p>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
};