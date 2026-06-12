import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
//import { PiaggioMap } from './components/map/Piaggiomap';
import { PiaggioMap } from './components/map/PiaggioMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { DriverTrips } from './pages/DriverTrips';
import { ClientTrips } from './pages/ClientTrips';
import { DriverHistory } from './pages/DriverHistory';
import { ClientRequest } from './pages/ClientRequest';
import { DriverTripDetail } from './pages/DriverTripDetail';
import { RateDriver } from './pages/RateDriver';
import { TripTracking } from './pages/TripTracking';

// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// ==================== COMPONENTE HOME (CON MAPA) ====================
const Home = () => {
  const { location, loading, error } = useGeolocation();
  const { logout, user, userData } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Obteniendo ubicación...</div>;
  }
  
  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div>;
  }
  
const handleLogout = async () => {
  try {
    await logout();
    // Limpia el estado local
    setShowMenu(false);
    // Redirige sin parámetros extra
    navigate('/login', { replace: true });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};
  
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <PiaggioMap userLocation={location} />
      
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <User size={20} color="#333" />
      </button>
      
      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 1999,
              cursor: 'pointer'
            }}
          />
          
          <div
            style={{
              position: 'fixed',
              top: '60px',
              right: '16px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '8px 0',
              minWidth: '200px',
              zIndex: 2000,
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              background: '#f8f9fa'
            }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Conectado como</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                {user?.email}
              </div>
            </div>
            
            {userData?.role === 'cliente' && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/client/request');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '1px solid #eee'
                }}
              >
                📦 Solicitar envío
              </button>
            )}
            
      
            
            <button
              onClick={() => {
                setShowMenu(false);
                navigate(userData?.role === 'cliente' ? '/client/trips' : '/driver/history');
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid #eee'
              }}
            >
              📋 Mi historial
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== APP CONTENT (RUTAS) ====================
function AppContent() {
  return (
    <Router>
     <Routes>
  <Route path="/login" element={<Login />} />

  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

  {/* CLIENTE */}
  <Route path="/client/request" element={<ProtectedRoute><ClientRequest /></ProtectedRoute>} />
  <Route path="/client/trips" element={<ProtectedRoute><ClientTrips /></ProtectedRoute>} />
  {/* Ruta para cliente (sigue su envío) */}
<Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />


  {/* CONDUCTOR */}
  <Route path="/driver/trips" element={<ProtectedRoute><DriverTrips /></ProtectedRoute>} />
  <Route path="/driver/history" element={<ProtectedRoute><DriverHistory /></ProtectedRoute>} />
  <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><DriverTripDetail /></ProtectedRoute>} />
  <Route path="/trip/:shipmentId"element={<ProtectedRoute><TripTracking /></ProtectedRoute>}/>
  {/* Ruta para conductor (después de aceptar) */}
<Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />

  {/* CALIFICACIÓN */}
  <Route path="/rate-driver/:tripId" element={<ProtectedRoute><RateDriver /></ProtectedRoute>} />

  <Route path="/track/:shipmentId" element={<ProtectedRoute><DriverTripDetail /> </ProtectedRoute> }/>

    {/* Ruta para que el cliente siga su envío en tiempo real */}  
  <Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>}/>
</Routes>
    </Router>
  );
}

// ==================== APP PRINCIPAL ====================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;