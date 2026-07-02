import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DriverProfile() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState(userData?.nombre || '');
  const [telefono, setTelefono] = useState(userData?.telefono || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    await updateDoc(doc(db, 'users', user.uid), { nombre, telefono });
    setSaving(false);
    alert('✅ Perfil actualizado');
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Volver</button>
      <h1 style={styles.title}>👤 Mi perfil</h1>
      <div style={styles.card}>
        <label>Nombre</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={styles.input} />
        <label>Teléfono</label>
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={styles.input} />
        <button onClick={handleSave} disabled={saving} style={styles.btn}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px' },
  btn: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};