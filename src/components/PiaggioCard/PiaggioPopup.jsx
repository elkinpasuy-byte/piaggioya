import './PiaggioPopup.css';
import { calculatePrice, formatPrice } from '../../utils/calculatePrice';

export const PiaggioPopup = ({ piaggio, onSelect, onToggleFavorite, isFavorite, routeInfo, isCalculating }) => {

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'disponible': return '#4CAF50';
      case 'ocupado': return '#FF9800';
      case 'mantenimiento': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatDistance = (distance) => {
    if (!distance) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)} metros`;
    }
    return `${distance.toFixed(1)} kilómetros`;
  };

  const getEstimatedTime = (distance) => {
    if (!distance) return null;
    const avgSpeed = 30;
    const timeHours = distance / avgSpeed;
    const minutes = Math.round(timeHours * 60);
    
    if (minutes < 1) return 'Menos de 1 minuto';
    if (minutes === 1) return '1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(piaggio.id);
    }
  };

  return (
    <div className="piaggio-popup-container">
      <div className="popup-header">
        <span className="popup-icon">🚚</span>
        <h3 className="popup-title">{piaggio.nombre}</h3>
        <button 
          className={`popup-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          title={isFavorite ? 'Quitar favorito' : 'Marcar como favorito'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
      
      <div className="popup-content">
        <div className="info-row">
          <span className="info-label">📋 Placa:</span>
          <span className="info-value">{piaggio.placa}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">📦 Capacidad:</span>
          <span className="info-value">{piaggio.capacidad} kg</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">⭐ Calificación:</span>
          <span className="info-value">
            {piaggio.calificacion}/5.0
            <span className="stars">
              {'★'.repeat(Math.floor(piaggio.calificacion))}
              {'☆'.repeat(5 - Math.floor(piaggio.calificacion))}
            </span>
          </span>
        </div>
        
        {/* Distancia en línea recta (existente) */}
        {piaggio.distance !== undefined && (
          <>
            <div className="info-row distance-highlight">
              <span className="info-label">📏 Distancia:</span>
              <span className="info-value distance-value">
                {formatDistance(piaggio.distance)}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">⏱️ Tiempo estimado:</span>
              <span className="info-value">
                {getEstimatedTime(piaggio.distance)}
              </span>
            </div>
          </>
        )}
        
        {/* Ruta real por calles (nuevo) */}
        {routeInfo && (
          <>
            <div className="info-row route-highlight">
              <span className="info-label">🛣️ Ruta real:</span>
              <span className="info-value route-value">{routeInfo.distanceFormatted}</span>
            </div>
            <div className="info-row">
              <span className="info-label">⏱️ Tiempo real:</span>
              <span className="info-value">{routeInfo.durationFormatted}</span>
            </div>
            <div className="info-row price-highlight">
              <span className="info-label">💰 Costo estimado:</span>
              <span className="info-value price-value">{formatPrice(calculatePrice(routeInfo.distance))}</span>
            </div>
          </>
        )}
        
        {/* Indicador de carga de ruta */}
        {isCalculating && (
          <div className="info-row">
            <span className="info-label">🔄 Calculando ruta...</span>
            <span className="info-value">⏳</span>
          </div>
        )}
        
        <div className="status-badge" style={{ backgroundColor: getEstadoColor(piaggio.estado) }}>
          <span className="status-icon">
            {piaggio.estado === 'disponible' ? '🟢' : '🟠'}
          </span>
          <span className="status-text">
            {piaggio.estado === 'disponible' ? 'DISPONIBLE' : 'EN SERVICIO'}
          </span>
        </div>
      </div>
      
      {piaggio.estado === 'disponible' && (
        <button className="select-button" onClick={() => onSelect?.(piaggio)}>
          ✅ Solicitar Piaggio
        </button>
      )}
      
      {piaggio.estado !== 'disponible' && (
        <button className="select-button disabled" disabled>
          ⏳ No disponible
        </button>
      )}
    </div>
  );
};