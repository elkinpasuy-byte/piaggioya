
import { BrowserRouter as Router,  Routes,  Route,  Navigate,  useNavigate} from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { PiaggioMap } from './components/map/PiaggioMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { ClientRequest } from './pages/ClientRequest';
import { ClientTrips } from './pages/ClientTrips';
import { DriverTrips } from './pages/DriverTrips';
import { DriverHistory } from './pages/DriverHistory';
import { TripTracking } from './pages/TripTracking';

// ==================== ESTILOS ====================
const styles = {
  menuButton: { position: 'fixed', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 2000 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1999, cursor: 'pointer' },
  menu: { position: 'fixed', top: 60, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px 0', minWidth: 200, zIndex: 2000 },
  userInfo: { padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f8f9fa', fontSize: 12, textAlign: 'center' },
  menuItem: { width: '100%', padding: '12px 16px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #eee' }
};



// ==================== HOME CLIENTE ====================
const ClientHome = () => {
  const { location, loading, error } = useGeolocation();
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PiaggioMap userLocation={location} />
      <button onClick={() => setShowMenu(!showMenu)} style={styles.menuButton}><User size={20} color="#333" /></button>
      {showMenu && (
        <>
          <div style={styles.overlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.userInfo}>Conectado como<br/><strong>{user?.email}</strong></div>
            <button onClick={() => { navigate('/client/request'); setShowMenu(false); }} style={styles.menuItem}>📦 Solicitar envío</button>
            <button onClick={() => { navigate('/client/trips'); setShowMenu(false); }} style={styles.menuItem}>📋 Mi historial</button>
            <button onClick={async () => { await logout(); navigate('/login'); }} style={{ ...styles.menuItem, color: '#dc3545' }}>🚪 Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== HOME CONDUCTOR ====================
const DriverHome = () => {
  const { location, loading, error } = useGeolocation();
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PiaggioMap userLocation={location} />
      <button onClick={() => setShowMenu(!showMenu)} style={styles.menuButton}><User size={20} color="#333" /></button>
      {showMenu && (
        <>
          <div style={styles.overlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.userInfo}>Conectado como<br/><strong>{user?.email}</strong></div>
            <button onClick={() => { navigate('/driver/trips'); setShowMenu(false); }} style={styles.menuItem}>📦 Envíos disponibles</button>
            <button onClick={() => { navigate('/driver/history'); setShowMenu(false); }} style={styles.menuItem}>📋 Mi historial</button>
            <button onClick={async () => { await logout(); navigate('/login'); }} style={{ ...styles.menuItem, color: '#dc3545' }}>🚪 Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  );
};




// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  const email = user.email || '';
  const isConductor = email.includes('conductor');
  
  if (isConductor) return children || <DriverHome />;
  return children || <ClientHome />;
};

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />} />
          
          <Route path="/client/request" element={<ProtectedRoute><ClientRequest /></ProtectedRoute>} />
          <Route path="/client/trips" element={<ProtectedRoute><ClientTrips /></ProtectedRoute>} />
          
          <Route path="/driver/trips" element={<ProtectedRoute><DriverTrips /></ProtectedRoute>} />
          <Route path="/driver/history" element={<ProtectedRoute><DriverHistory /></ProtectedRoute>} />
          
          {/* 👇 ESTA ES LA RUTA QUE FALTABA */}
          <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />
          
          <Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}



export default App;