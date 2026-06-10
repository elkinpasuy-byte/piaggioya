// src/components/DriverVerificationStatus.jsx
// Mensaje de estado para conductores no verificados

import { useAuth } from '../contexts/AuthContext';
import { useDriverVerification } from '../hooks/useDriverVerification';

export const DriverVerificationStatus = () => {
  const { user, userData } = useAuth();
  const { verificationStatus, isVerified, loading } = useDriverVerification(user?.uid);

  // Solo mostrar para conductores pendientes
  if (loading || !userData || userData.role !== 'conductor_pendiente') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '16px',
      right: '16px',
      background: '#fff3cd',
      borderLeft: '4px solid #ffc107',
      borderRadius: '8px',
      padding: '12px 16px',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Cuenta pendiente de verificación
          </div>
          <div style={{ fontSize: '13px', color: '#856404' }}>
            Tus documentos están siendo revisados. Recibirás un email cuando tu cuenta sea aprobada.
          </div>
          {verificationStatus?.rejectionReason && (
            <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '8px' }}>
              Motivo de rechazo: {verificationStatus.rejectionReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};