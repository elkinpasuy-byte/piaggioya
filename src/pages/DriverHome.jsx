// src/pages/DriverHome.jsx
// Panel conductor con diseño moderno (sidebar + mapa + bottom sheet)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { PiaggioMap } from '../components/map/PiaggioMap';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Menu, X, Home, Package, MapPin, History, Star, DollarSign, User, HelpCircle } from 'lucide-react';

export const DriverHome = () => {
  const { user, userData, logout } = useAuth();
  const { location, loading, error } = useGeolocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, completados: 0, pendientes: 0, calificacion: 0 });
  const [activeTrip, setActiveTrip] = useState(null);

  // ===== CARGAR ESTADÍSTICAS REALES =====
  useEffect(() => {
    const loadStats = async () => {
      if (!userData?.email) return;
      try {
        const q = query(collection(db, 'shipments'), where('driverId', '==', userData.email));
        const snapshot = await getDocs(q);
        const viajes = [];
        snapshot.forEach(doc => viajes.push(doc.data()));

        const completados = viajes.filter(v => v.status === 'delivered');
        const pendientes = viajes.filter(v => v.status === 'accepted' || v.status === 'in_progress');
        const activo = viajes.find(v => v.status === 'accepted' || v.status === 'in_progress');

        let totalStars = 0, totalRatings = 0;
        viajes.forEach(v => {
          if (v.rating?.stars) { totalStars += v.rating.stars; totalRatings++; }
        });
        const promedio = totalRatings > 0 ? totalStars / totalRatings : 0;

        setStats({
          total: viajes.length,
          completados: completados.length,
          pendientes: pendientes.length,
          calificacion: Math.round(promedio * 10) / 10
        });
        setActiveTrip(activo || null);
      } catch (error) { console.error('Error cargando stats:', error); }
    };
    loadStats();
  }, [userData]);

  if (loading) return <div style={styles.loading}>Cargando ubicación...</div>;
  if (error) return <div style={styles.loading}>Error: {error}</div>;

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ========== SIDEBAR ==========
  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.logo}>🚚 <span>Piaggio<span style={{ color: '#667eea' }}>Ya</span></span></div>
        <button onClick={toggleSidebar} style={styles.sidebarClose}>
          <X size={24} color="#fff" />
        </button>
      </div>
      <nav style={styles.sidebarNav}>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItemActive}>
          <Home size={20} /> Inicio
        </button>
        <button onClick={() => { navigate('/driver/trips'); toggleSidebar(); }} style={styles.sidebarItem}>
          <Package size={20} /> Disponibles <span style={styles.badge}>3</span>
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <MapPin size={20} /> Mis viajes
        </button>
        <button onClick={() => { navigate('/driver/history'); toggleSidebar(); }} style={styles.sidebarItem}>
          <History size={20} /> Historial
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <Star size={20} /> Calificaciones
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <DollarSign size={20} /> Ganancias
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <User size={20} /> Perfil
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <HelpCircle size={20} /> Ayuda
        </button>
      </nav>
      <div style={styles.modeToggle}>
        Modo conductor
        <input type="checkbox" defaultChecked style={styles.toggleInput} />
      </div>
      <button onClick={handleLogout} style={styles.sidebarLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  );

  // ========== RENDER PRINCIPAL ==========
  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <header style={styles.newHeader}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          <Menu size={24} />
        </button>

        <div>
          <div style={styles.headerLogo}>
            🚚 PiaggioYa
          </div>

          <div style={styles.headerSubtitle}>
            Hola, {userData?.nombre || 'Conductor'} ✓
          </div>
        </div>

        <div style={styles.onlineSection}>
          🟢 En línea
        </div>
      </header>

 {/* MAPA */}
        <div style={styles.mapCard}>
          <PiaggioMap userLocation={location} />
        </div>

      {/* CONTENIDO */}
      <main style={styles.mainContent}>

       

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h2>{stats.total}</h2>
            <span>Total viajes</span>
          </div>

          <div style={styles.statCard}>
            <h2>{stats.completados}</h2>
            <span>Completados</span>
          </div>

          <div style={styles.statCard}>
            <h2>{stats.pendientes}</h2>
            <span>Pendientes</span>
          </div>

          <div style={styles.statCard}>
            <h2>{stats.calificacion.toFixed(1)}</h2>
            <span>Calificación</span>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <button
            onClick={() => navigate('/driver/trips')}
            style={styles.actionBtnPrimary}
          >
            Ver envíos disponibles
          </button>
        </div>

        

        {/* VIAJE */}
        {activeTrip && (
          <div style={styles.tripCard}>
            <h3>🚚 Viaje actual</h3>

            <p>
              <strong>Recogida:</strong>
              {' '}
              {activeTrip.pickupAddress}
            </p>

            <p>
              <strong>Entrega:</strong>
              {' '}
              {activeTrip.deliveryAddress}
            </p>

            <p>
              <strong>Pago:</strong>
              {' '}
              ${activeTrip.estimatedPrice?.toLocaleString() || 'N/A'}
            </p>

            <button
              onClick={() => navigate(`/track/${activeTrip.id}`)}
              style={styles.tripBtnAccept}
            >
              Aceptar viaje
            </button>
          </div>
        )}
      </main>
      
      <footer style={styles.footer}>
          🚚 PiaggioYa • Tu aliado en cada entrega
        </footer>

      {isSidebarOpen && (
        <>
          <div
            style={styles.sidebarOverlay}
            onClick={toggleSidebar}
          />
          <Sidebar />
        </>
      )}

    </div>
  );
};

// ========== ESTILOS ==========
const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#888',
    background: '#f5f5f5',
  },
  
  // PÁGINA PRINCIPAL
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
  },

  // HEADER
  newHeader: {
    height: '70px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
  },
  headerLogo: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: '13px',
    color: '#667eea',
  },
  onlineSection: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: '14px',
  },

  // CONTENIDO
  mainContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },

  // ESTADÍSTICAS
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statCardText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },

  // BOTONES
  actionsRow: {
    display: 'flex',
    gap: '12px',
  },
  actionBtnPrimary: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
  },

  // MAPA
  mapCard: {
    height: '350px',
    borderRadius: '1px solid',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },

  // VIAJE ACTIVO
  tripCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  tripBtnAccept: {
    width: '100%',
    padding: '12px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },

  // FOOTER
  footer: {
    height: '60px',
    background: '#667eea',
    color: '#fff',
    borderRadius: '1px solid #667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
  },

  // SIDEBAR
  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '85%',
    maxWidth: '300px',
    background: '#fff',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.25s ease-out',
    padding: '20px 0',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px 16px',
    borderBottom: '1px solid #eee',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  sidebarClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    padding: '4px',
  },
  sidebarNav: {
    flex: 1,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    borderRadius: '8px',
    margin: '0 8px',
    transition: 'all 0.2s',
  },
  sidebarItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 20px',
    border: 'none',
    background: '#f0f4ff',
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    borderRadius: '8px',
    margin: '0 8px',
  },
  badge: {
    background: '#667eea',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    marginLeft: 'auto',
  },
  modeToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid #eee',
    marginTop: 'auto',
    fontSize: '14px',
    color: '#555',
  },
  toggleInput: {
    width: '40px',
    height: '20px',
    appearance: 'none',
    background: '#ccc',
    borderRadius: '20px',
    cursor: 'pointer',
    position: 'relative',
  },
  sidebarLogout: {
    margin: '12px 16px',
    padding: '10px',
    background: '#f5f5f5',
    color: '#dc3545',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

// ========== ANIMACIONES ==========
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
`;
document.head.appendChild(styleSheet);