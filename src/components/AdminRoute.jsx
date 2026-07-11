// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (userData?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};