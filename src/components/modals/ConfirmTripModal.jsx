// src/components/modals/ConfirmTripModal.jsx
// Modal de confirmación para solicitar un viaje

import { X } from 'lucide-react';

export const ConfirmTripModal = ({ isOpen, onClose, onConfirm, tripDetails, isConfirming }) => {
  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      {/* Fondo oscuro */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
          cursor: 'pointer'
        }}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderRadius: '20px 20px 0 0',
          zIndex: 3001,
          padding: '24px 20px',
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Confirmar viaje
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>
        
        {/* Información del Piaggio */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>🛵</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {tripDetails?.piaggioName}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {tripDetails?.piaggioPlaca}
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888' }}>Distancia</div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>
                {tripDetails?.distanceFormatted}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888' }}>Tiempo estimado</div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>
                {tripDetails?.durationFormatted}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888' }}>Precio</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#4CAF50' }}>
                {formatPrice(tripDetails?.estimatedPrice)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isConfirming ? 'wait' : 'pointer',
              color: 'white'
            }}
          >
            {isConfirming ? 'Solicitando...' : 'Confirmar viaje'}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};