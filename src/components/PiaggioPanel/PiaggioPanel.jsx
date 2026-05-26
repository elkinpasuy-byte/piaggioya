import { useState, useMemo } from 'react';
import './PiaggioPanel.css';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};
// ========== Formatear tiempo desde última actualización ==========
const getLastUpdateText = () => {
  if (!lastUpdate) return '🟢 Actualizando...';
  
  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
  
  if (secondsAgo < 5) return '🟢 Actualizado ahora';
  if (secondsAgo < 10) return '🟡 Hace 5s';
  if (secondsAgo < 30) return `🟡 Hace ${secondsAgo}s`;
  if (secondsAgo < 60) return '🟠 Hace < 1 min';
  return '🔴 Hace > 1 min';
};
// ========== FIN ==========

const CAPACIDAD_OPCIONES = [
  { value: 0, label: 'Todos' },
  { value: 80, label: '80kg+' },
  { value: 100, label: '100kg+' },
  { value: 120, label: '120kg+' }
];

const CALIFICACION_OPCIONES = [
  { value: 0, label: 'Todas' },
  { value: 3, label: '3★+' },
  { value: 4, label: '4★+' },
  { value: 4.5, label: '4.5★+' }
];


 export const PiaggioPanel = ({ piaggios, userLocation, onSelectPiaggio, lastUpdate }) => {
  const formatEstimatedTime = (distance) => {
  if (!distance) return 'N/A';

  const minutes = Math.round((distance / 30) * 60);

  if (minutes < 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}min`;
};
  const [isOpen, setIsOpen] = useState(true);

  const [capacidadMinima, setCapacidadMinima] = useState(0);
  const [calificacionMinima, setCalificacionMinima] = useState(0);
  const [favoritePiaggioId, setFavoritePiaggioId, removeFavorite] = useLocalStorage('piaggiaya_favorite', null);

  // ========== Formatear tiempo desde última actualización ==========
  const getLastUpdateText = () => {
    if (!lastUpdate) return '🟢 Actualizando...';
    
    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    
    if (secondsAgo < 5) return '🟢 Actualizado ahora';
    if (secondsAgo < 10) return '🟡 Hace 5s';
    if (secondsAgo < 30) return `🟡 Hace ${secondsAgo}s`;
    if (secondsAgo < 60) return '🟠 Hace < 1 min';
    return '🔴 Hace > 1 min';
  };
  // ========== FIN ==========

  // Calcular distancias
  const piaggiosWithDistance = useMemo(() => {
    if (!userLocation) return piaggios;
    
    return piaggios
      .map(piaggio => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          piaggio.coordenadas[0],
          piaggio.coordenadas[1]
        );
        return {
          ...piaggio,
          distance,
          distanceFormatted: formatDistance(distance)
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [piaggios, userLocation]);

  // Aplicar filtros
  const piaggiosFiltrados = useMemo(() => {
    return piaggiosWithDistance.filter(piaggio => {
      if (piaggio.capacidad < capacidadMinima) return false;
      if (piaggio.calificacion < calificacionMinima) return false;
      return true;
    });
  }, [piaggiosWithDistance, capacidadMinima, calificacionMinima]);

  // ========== NUEVO: Cálculo de estadísticas en tiempo real ==========
  const estadisticas = useMemo(() => {
    if (!piaggiosWithDistance.length) return null;
    
    // Piaggio más cercano
    const masCercano = piaggiosWithDistance[0];
    
    // Piaggio mejor calificado (solo disponibles)
    const disponibles = piaggiosWithDistance.filter(p => p.estado === 'disponible');
    const mejorCalificado = disponibles.length > 0 
      ? disponibles.reduce((best, current) => current.calificacion > best.calificacion ? current : best, disponibles[0])
      : null;
    
    // Capacidad promedio
    const capacidadPromedio = piaggiosWithDistance.reduce((sum, p) => sum + p.capacidad, 0) / piaggiosWithDistance.length;
    
    // Tiempo estimado promedio
    const tiempos = piaggiosWithDistance.map(p => p.distance).filter(d => d);
    const tiempoPromedio = tiempos.length > 0 
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length 
      : 0;
    
    // Disponibilidad (cuántos están libres)
    const disponibilidad = piaggiosWithDistance.filter(p => p.estado === 'disponible').length;
    const disponibilidadPorcentaje = (disponibilidad / piaggiosWithDistance.length) * 100;
    
    // Piaggio más rápido (menor tiempo estimado)
    const masRapido = piaggiosWithDistance.length > 0
      ? piaggiosWithDistance.reduce((fastest, current) => 
          (current.distance < fastest.distance) ? current : fastest, piaggiosWithDistance[0])
      : null;
    
      const formatEstimatedTime = (distance) => {
  if (!distance) return 'N/A';

  const minutes = Math.round((distance / 30) * 60);

  if (minutes < 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}min`;
};
    

    return {
      masCercano,
      mejorCalificado,
      capacidadPromedio: Math.round(capacidadPromedio),
      tiempoPromedio: formatEstimatedTime(tiempoPromedio),
      disponibilidad,
      disponibilidadPorcentaje: Math.round(disponibilidadPorcentaje),
      masRapido,
      totalPiaggios: piaggiosWithDistance.length
    };
  }, [piaggiosWithDistance]);
  // ========== FIN NUEVO ==========

  const favoritePiaggio = useMemo(() => {
    if (!favoritePiaggioId) return null;
    return piaggiosWithDistance.find(p => p.id === favoritePiaggioId);
  }, [piaggiosWithDistance, favoritePiaggioId]);

  const toggleFavorite = (piaggioId, event) => {
    event.stopPropagation();
    if (favoritePiaggioId === piaggioId) {
      removeFavorite();
    } else {
      setFavoritePiaggioId(piaggioId);
    }
  };

  const disponibilidad = piaggiosFiltrados.filter(p => p.estado === 'disponible').length;
  const masCercano = piaggiosFiltrados[0];
  const totalOcultos = piaggiosWithDistance.length - piaggiosFiltrados.length;

  return (
    <div className={`piaggio-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="panel-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>🛵 Piaggios Cercanos</h3>
        <button className="toggle-btn">{isOpen ? '▼' : '▲'}</button>
      </div>
      
      {isOpen && (
        <div className="panel-content">
          
          {/* ========== NUEVO: Sección de Estadísticas en vivo ========== */}
          {estadisticas && (
            <div className="stats-section">
              <div className="stats-header">
                <span>📊</span>
                <span className="stats-title">ESTADÍSTICAS EN VIVO</span>
              <span className="stats-badge" title="Última actualización de posiciones">
  {getLastUpdateText()}
</span>
              </div>
              
              <div className="stats-grid">
                {/* Tarjeta: Piaggio más cercano */}
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <div className="stat-label">Más cercano</div>
                    <div className="stat-value">{estadisticas.masCercano?.nombre || 'N/A'}</div>
                    <div className="stat-sub">{estadisticas.masCercano?.distanceFormatted || '—'}</div>
                  </div>
                </div>
                
                {/* Tarjeta: Mejor calificado */}
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <div className="stat-label">Mejor calificado</div>
                    <div className="stat-value">{estadisticas.mejorCalificado?.nombre || 'N/A'}</div>
                    <div className="stat-sub">{estadisticas.mejorCalificado?.calificacion || '—'} ★</div>
                  </div>
                </div>
                
                {/* Tarjeta: Capacidad promedio */}
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <div className="stat-label">Capacidad promedio</div>
                    <div className="stat-value">{estadisticas.capacidadPromedio} kg</div>
                    <div className="stat-sub">de {estadisticas.totalPiaggios} Piaggios</div>
                  </div>
                </div>
                
                {/* Tarjeta: Tiempo promedio */}
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <div className="stat-label">Tiempo promedio</div>
                    <div className="stat-value">{estadisticas.tiempoPromedio}</div>
                    <div className="stat-sub">de espera estimado</div>
                  </div>
                </div>
                
                {/* Tarjeta: Disponibilidad */}
                <div className="stat-card disponibilidad">
                  <div className="stat-icon">🟢</div>
                  <div className="stat-info">
                    <div className="stat-label">Disponibilidad</div>
                    <div className="stat-value">{estadisticas.disponibilidad} / {estadisticas.totalPiaggios}</div>
                    <div className="stat-sub">
                      <div className="progress-bar-small">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${estadisticas.disponibilidadPorcentaje}%` }}
                        />
                      </div>
                      {estadisticas.disponibilidadPorcentaje}% disponible
                    </div>
                  </div>
                </div>
                
                {/* Tarjeta: Piaggio más rápido */}
                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-info">
                    <div className="stat-label">Más rápido</div>
                    <div className="stat-value">{estadisticas.masRapido?.nombre || 'N/A'}</div>
                    <div className="stat-sub">
                      {estadisticas.masRapido?.distance ? 
                        formatEstimatedTime(estadisticas.masRapido.distance) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ========== FIN NUEVO ========== */}
          
          {/* Sección de Piaggio Favorito (código existente) */}
          {favoritePiaggio && (
            <div className="favorite-section">
              <div className="favorite-header">
                <span>⭐</span>
                <span className="favorite-title">TU FAVORITO</span>
                <button 
                  className="remove-favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite();
                  }}
                  title="Quitar favorito"
                >
                  ✖
                </button>
              </div>
              <div 
                className="favorite-item"
                onClick={() => onSelectPiaggio(favoritePiaggio)}
              >
                <div className="favorite-name">{favoritePiaggio.nombre}</div>
                <div className="favorite-details">
                  <span>📦 {favoritePiaggio.capacidad}kg</span>
                  <span>⭐ {favoritePiaggio.calificacion}</span>
                  <span>📏 {favoritePiaggio.distanceFormatted}</span>
                </div>
                <button className="favorite-select-btn">Seleccionar</button>
              </div>
            </div>
          )}
          
          {/* Sección de filtros (código existente) */}
          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">📦 Capacidad mínima</label>
              <div className="filter-buttons">
                {CAPACIDAD_OPCIONES.map(op => (
                  <button
                    key={op.value}
                    className={`filter-btn ${capacidadMinima === op.value ? 'active' : ''}`}
                    onClick={() => setCapacidadMinima(op.value)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">⭐ Calificación mínima</label>
              <div className="filter-buttons">
                {CALIFICACION_OPCIONES.map(op => (
                  <button
                    key={op.value}
                    className={`filter-btn ${calificacionMinima === op.value ? 'active' : ''}`}
                    onClick={() => setCalificacionMinima(op.value)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            
            
            {(capacidadMinima > 0 || calificacionMinima > 0) && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setCapacidadMinima(0);
                  setCalificacionMinima(0);
                }}
              >
                🧹 Limpiar filtros
              </button>
            )}
            
            {totalOcultos > 0 && (
              <div className="filtered-results">
                Mostrando {piaggiosFiltrados.length} de {piaggiosWithDistance.length} Piaggios
                {totalOcultos === piaggiosWithDistance.length && (
                  <span className="no-results-warning"> ⚠️ No hay resultados</span>
                )}
              </div>
            )}
          </div>
          
          {/* Estadísticas rápidas (código existente) */}
          <div className="panel-stats">
            <span>📊 {disponibilidad} disponibles</span>
            <span>📍 {piaggiosFiltrados.length} mostrados</span>
            {masCercano && (
              <span className="closest-badge">
                🏆 Más cercano: {formatDistance(masCercano.distance)}
              </span>
            )}
          </div>
          
          <div className="piaggios-list">
            {piaggiosFiltrados.map(piaggio => (
              <div 
                key={piaggio.id} 
                className={`piaggio-item ${piaggio.estado} ${favoritePiaggioId === piaggio.id ? 'favorite' : ''}`}
                onClick={() => piaggio.estado === 'disponible' && onSelectPiaggio(piaggio)}
              >
                <div className="piaggio-header">
                  <span className="status-icon">
                    {piaggio.estado === 'disponible' ? '🟢' : '🟠'}
                  </span>
                  <span className="piaggio-name">{piaggio.nombre}</span>
                  <span className="piaggio-placa">{piaggio.placa}</span>
                  <button 
                    className={`favorite-star-btn ${favoritePiaggioId === piaggio.id ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(piaggio.id, e)}
                    title={favoritePiaggioId === piaggio.id ? 'Quitar favorito' : 'Marcar como favorito'}
                  >
                    {favoritePiaggioId === piaggio.id ? '⭐' : '☆'}
                  </button>
                </div>
                
                <div className="piaggio-details">
                  <span>📦 {piaggio.capacidad}kg</span>
                  <span>⭐ {piaggio.calificacion}</span>
                  <span className="distance-badge">
                    📏 {piaggio.distanceFormatted}
                  </span>
                </div>
                
                <div className="distance-bar-container">
                  <div 
                    className="distance-bar"
                    style={{ 
                      width: `${Math.min(100, (piaggio.distance / 5) * 100)}%`,
                      backgroundColor: piaggio.distance < 1 ? '#4CAF50' : 
                                     piaggio.distance < 2 ? '#FF9800' : '#F44336'
                    }}
                  />
                </div>
                
                <button 
                  className="quick-select-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiaggio(piaggio);
                  }}
                  disabled={piaggio.estado !== 'disponible'}
                >
                  {piaggio.estado === 'disponible' ? 'Seleccionar' : 'No disponible'}
                </button>
              </div>
            ))}
            
            {piaggiosFiltrados.length === 0 && (
              <div className="no-results-message">
                🚫 No hay Piaggios que cumplan los filtros seleccionados
                <button 
                  className="clear-filters-message-btn"
                  onClick={() => {
                    setCapacidadMinima(0);
                    setCalificacionMinima(0);
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};