import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading, userData } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  // Si no se especifica children, redirige según rol
  if (!children) {
    if (userData?.role === 'admin') return <Navigate to="/admin" />;
    if (userData?.role === 'conductor') return <Navigate to="/driver/home" />;
    if (userData?.role === 'cliente') return <Navigate to="/client/home" />;
    return <Navigate to="/login" />;
  }

  return children;
};