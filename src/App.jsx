
import { BrowserRouter as Router,  Routes,  Route,  Navigate,  useNavigate} from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { PiaggioMap } from './components/map/PiaggioMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { ClientRequest } from './pages/client/ClientRequest.jsx';
import { ClientTrips } from './pages/client/ClientTrips.jsx';
import { DriverTrips } from './pages/DriverTrips';
import { DriverHistory } from './pages/DriverHistory';
import { TripTracking } from './pages/TripTracking';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRoute } from './components/AdminRoute';
import { AdminShipments } from './pages/admin/AdminShipments';

import DriverHome from "./pages/DriverHome.jsx";

import DriverTrip from './pages/driver/DriverTrip';
import ClientTrip from './pages/client/ClientTrip';

import { AdminDrivers } from './pages/admin/AdminDrivers';

import { AdminClients } from './pages/admin/AdminClients';






import { ClientHome } from './pages/client/ClientHome.jsx';
  
// Cliente
import ClientTrack from './pages/client/ClientTrack';
import ClientRatings from './pages/client/ClientRatings';
import ClientProfile from './pages/client/ClientProfile';
import ClientHelp from './pages/client/ClientHelp';


// Conductor
import DriverRatings from './pages/driver/DriverRatings';
import DriverEarnings from './pages/driver/DriverEarnings';
import DriverProfile from './pages/driver/DriverProfile';
import DriverHelp from './pages/driver/DriverHelp';





// ==================== ESTILOS ====================
const styles = {
  menuButton: { position: 'fixed', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 2000 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1999, cursor: 'pointer' },
  menu: { position: 'fixed', top: 60, right: 16, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '8px 0', minWidth: 200, zIndex: 2000 },
  userInfo: { padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f8f9fa', fontSize: 12, textAlign: 'center' },
  menuItem: { width: '100%', padding: '12px 16px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #eee' }
};



// ==================== HOME CLIENTE ====================
const ClientHomeold = () => {
  const { location, loading, error } = useGeolocation();
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position:'relative' }}>
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



// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { user, loading, userData } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  // ✅ Redirigir según rol
  if (userData?.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  if (userData?.role === 'conductor') {
    return children || <DriverHome />;
  }

  if (userData?.role === 'cliente') {
    return children || <ClientHome />;
  }

  return <Navigate to="/login" />;
};


// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />} />
          
          <Route path="/admin" element={<AdminRoute><AdminDashboard /> </AdminRoute>} />

          <Route path="/client/request" element={<ProtectedRoute><ClientRequest /></ProtectedRoute>} />
          <Route path="/client/trips" element={<ProtectedRoute><ClientTrips /></ProtectedRoute>} />
          
          <Route path="/driver/trips" element={<ProtectedRoute><DriverTrips /></ProtectedRoute>} />
          <Route path="/driver/history" element={<ProtectedRoute><DriverHistory /></ProtectedRoute>} />
          <Route path="/driver/home" element={<ProtectedRoute><DriverHome /></ProtectedRoute>} />
          
          {/* 👇 ESTA ES LA RUTA QUE FALTABA */}
          <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />

          <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><DriverTrip /></ProtectedRoute>} />
          <Route path="/track/:id" element={<ProtectedRoute><ClientTrip /></ProtectedRoute>} />
          
          <Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />

          <Route path="/track/:id" element={<ProtectedRoute><ClientTrip /></ProtectedRoute>} />
          <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><DriverTrip /></ProtectedRoute>} />
          
          <Route path="/driver/dashboard" element={<ProtectedRoute><DriverHome /></ProtectedRoute>} />

          <Route path="/client/track" element={<ProtectedRoute><ClientTrack /></ProtectedRoute>} />
          <Route path="/client/ratings" element={<ProtectedRoute><ClientRatings /></ProtectedRoute>} />
          <Route path="/client/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
          <Route path="/client/help" element={<ProtectedRoute><ClientHelp /></ProtectedRoute>} />

          <Route path="/driver/ratings" element={<ProtectedRoute><DriverRatings /></ProtectedRoute>} />
          <Route path="/driver/earnings" element={<ProtectedRoute><DriverEarnings /></ProtectedRoute>} />
          <Route path="/driver/profile" element={<ProtectedRoute><DriverProfile /></ProtectedRoute>} />
          <Route path="/driver/help" element={<ProtectedRoute><DriverHelp /></ProtectedRoute>} />     

          <Route path="/admin/shipments" element={<AdminRoute><AdminShipments /></AdminRoute>}/>
          <Route path="/admin/drivers" element={<AdminRoute><AdminDrivers/></AdminRoute>} />

          <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />

          <Route path="/driver/earnings" element={<ProtectedRoute><DriverEarnings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}



export default App;