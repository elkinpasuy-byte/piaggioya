import { PiaggioMap } from '../components/map/PiaggioMap';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';

export const DriverHome = () => {
  const [selectedPiaggio, setSelectedPiaggio] = useState(null);
  const { location, loading, error } = useGeolocation();
  const { logout, user, userData } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PiaggioMap userLocation={location} />
      
      <button onClick={() => setShowMenu(!showMenu)} style={styles.menuButton}>
        <User size={20} color="#333" />
      </button>

      {showMenu && (
        <>
          <div style={styles.overlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.userInfo}>
              <div>Conectado como</div>
              <strong>{user?.email}</strong>
            </div>
            <button onClick={() => { setShowMenu(false); navigate('/driver/trips'); }} style={styles.menuItem}>
              📦 Envíos disponibles
            </button>
            <button onClick={() => { setShowMenu(false); navigate('/driver/history'); }} style={styles.menuItem}>
              📋 Mi historial
            </button>
            <button onClick={async () => { await logout(); navigate('/login'); }} style={{ ...styles.menuItem, color: '#dc3545' }}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  menuButton: { position: 'fixed', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1999, cursor: 'pointer' },
  menu: { position: 'fixed', top: 60, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px 0', minWidth: 200, zIndex: 2000, overflow: 'hidden' },
  userInfo: { padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f8f9fa' },
  menuItem: { width: '100%', padding: '12px 16px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #eee' }
};