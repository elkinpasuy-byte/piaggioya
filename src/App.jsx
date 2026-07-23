import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoutes } from './routes/PublicRoutes';
import { ClientRoutes } from './routes/ClientRoutes';
import { DriverRoutes } from './routes/DriverRoutes';
import { AdminRoutes } from './routes/AdminRoutes';
import { TripTracking } from './pages/TripTracking';
import ClientChat from './pages/ClientChat';
import ClientRatings from './pages/client/ClientRatings'; // ← NUEVO

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />} />

          {/* Rutas por rol */}
          <Route path="/client/*" element={<ProtectedRoute><ClientRoutes /></ProtectedRoute>} />
          <Route path="/driver/*" element={<ProtectedRoute><DriverRoutes /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>} />

          {/* Rutas de seguimiento y chat */}
          <Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />
          <Route path="/driver/trip/:shipmentId" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />
          <Route path="/chat/:shipmentId" element={<ProtectedRoute><ClientChat /></ProtectedRoute>} />

          {/* Ruta de calificación (cliente califica al conductor) */}
          <Route path="/rate-driver/:shipmentId" element={<ProtectedRoute><ClientRatings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;