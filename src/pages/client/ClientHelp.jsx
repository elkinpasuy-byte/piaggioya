import { useNavigate } from 'react-router-dom';

export default function ClientHelp() {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>❓ Ayuda</h1>
      <div style={styles.card}>
        <h3>Preguntas frecuentes</h3>
        <p><strong>¿Cómo solicito un envío?</strong> Ve a "Solicitar envío" en el menú.</p>
        <p><strong>¿Cómo veo el estado de mi envío?</strong> Ve a "Mi envío" en el menú.</p>
        <p><strong>¿Cómo contacto con el conductor?</strong> En la pantalla de seguimiento verás su teléfono.</p>
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