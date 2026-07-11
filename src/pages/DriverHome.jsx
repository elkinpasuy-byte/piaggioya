// src/pages/DriverHome.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { PiaggioMap } from '../components/map/PiaggioMap';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Menu, X, Home, Package, MapPin, History, Star, DollarSign, User, HelpCircle, Wifi, WifiOff } from 'lucide-react';

export const DriverHome = () => {
  const { user, userData, logout } = useAuth();
  const { location, loading, error } = useGeolocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({ total: 0, completados: 0, pendientes: 0, calificacion: 0 });
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isOnline !== undefined) setIsOnline(data.isOnline);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      updateDoc(doc(db, 'users', user.uid), { isOnline });
    }
  }, [isOnline, user]);

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

  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.logo}>🚚 <span>Piaggio<span style={{ color: '#667eea' }}>Ya</span></span></div>
        <button onClick={toggleSidebar} style={styles.sidebarClose}>
          <X size={24} color="#fff" />
        </button>
      </div>
      <nav style={styles.sidebarNav}>
        <button className="sidebar-btn" onClick={() => { navigate('/'); toggleSidebar(); }} style={styles.sidebarItem}>
          <Home size={20} /> Inicio
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/trips'); toggleSidebar(); }} style={styles.sidebarItem}>
          <Package size={20} /> Disponibles
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/history'); toggleSidebar(); }} style={styles.sidebarItem}>
          <MapPin size={20} /> Mis viajes
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/history'); toggleSidebar(); }} style={styles.sidebarItem}>
          <History size={20} /> Historial
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/ratings'); toggleSidebar(); }} style={styles.sidebarItem}>
          <Star size={20} /> Calificaciones
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/earnings'); toggleSidebar(); }} style={styles.sidebarItem}>
          <DollarSign size={20} /> Ganancias
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/profile'); toggleSidebar(); }} style={styles.sidebarItem}>
          <User size={20} /> Perfil
        </button>
        <button className="sidebar-btn" onClick={() => { navigate('/driver/help'); toggleSidebar(); }} style={styles.sidebarItem}>
          <HelpCircle size={20} /> Ayuda
        </button>
      </nav>
      <div style={styles.modeToggle}>
        <span>Modo conductor</span>
        <div
          style={{
            ...styles.toggleSwitch,
            ...(isOnline ? styles.toggleSwitchActive : {})
          }}
          onClick={() => setIsOnline(!isOnline)}
        >
          <div
            style={{
              ...styles.toggleThumb,
              ...(isOnline ? styles.toggleThumbActive : {})
            }}
          />
        </div>
      </div>
      <button className="sidebar-btn" onClick={handleLogout} style={styles.sidebarLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.newHeader}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          <Menu size={24} />
        </button>
        <div>
          <div style={styles.headerLogo}>🚚 PiaggioYa</div>
          <div style={styles.headerSubtitle}>Hola, {userData?.nombre || 'Conductor'} ✓</div>
        </div>
        <div style={styles.onlineSection}>
          {isOnline ? (
            <>
              <Wifi size={16} color="#4CAF50" />
              <span>En línea</span>
            </>
          ) : (
            <>
              <WifiOff size={16} color="#dc3545" />
              <span>Desconectado</span>
            </>
          )}
        </div>
      </header>

      {/* MAPA */}
      <div style={styles.mapCard}>
        <PiaggioMap userLocation={location} />
      </div>

      {/* CONTENIDO */}
      <main style={styles.mainContent}>
        {activeTrip ? (
          <div style={styles.tripCard}>
            <div style={styles.tripHeader}>
              <span style={styles.tripTitle}>🚚 Viaje actual</span>
              <span style={styles.tripStatus}>
                {activeTrip.status === 'accepted' ? 'En camino' : 'En ruta'}
              </span>
            </div>
            <div style={styles.tripDetails}>
              <p><strong>Recogida:</strong> {activeTrip.pickupAddress}</p>
              <p><strong>Entrega:</strong> {activeTrip.deliveryAddress}</p>
              <p><strong>Pago estimado:</strong> ${activeTrip.estimatedPrice?.toLocaleString() || 'N/A'}</p>
            </div>
            <button
              onClick={() => {
                if (!activeTrip?.id) {
                  alert("No hay un viaje activo.");
                  return;
                }
                console.log("activeTrip:", activeTrip);
                navigate(`/track/${activeTrip.id}`);
              }}
              style={styles.primaryButton}
            >
              📍 Ver en mapa
            </button>
          </div>
        ) : (
          <div style={styles.tripCard}>
            <h3>👋 Bienvenido a PiaggioYa</h3>
            <p>No hay viaje activo. Revisa los envíos disponibles para comenzar.</p>
          </div>
        )}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📦</span>
            <h2>{stats.total}</h2>
            <span>Total viajes</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>✅</span>
            <h2>{stats.completados}</h2>
            <span>Completados</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🕐</span>
            <h2>{stats.pendientes}</h2>
            <span>Pendientes</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>⭐</span>
            <h2>{stats.calificacion.toFixed(1)}</h2>
            <span>Calificación</span>
          </div>
        </div>

        <button onClick={() => navigate('/driver/trips')} style={styles.actionBtnPrimary}>
          📦 Ver envíos disponibles
        </button>
      </main>

      <footer style={styles.footer}>
        🚚 PiaggioYa • Tu aliado en cada entrega
      </footer>

      {isSidebarOpen && (
        <>
          <div style={styles.sidebarOverlay} onClick={toggleSidebar} />
          <Sidebar />
        </>
      )}
    </div>
  );
};

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
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f5f7fb',
    overflow: 'hidden',
  },
  newHeader: {
    height: '70px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #eee',
    flexShrink: 0,
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#22c55e',
  },
  mapCard: {
    height: '350px',
    borderRadius: '20px',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    flexShrink: 0,
    margin: '0 16px 16px 16px',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
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
  statIcon: {
    fontSize: '24px',
    display: 'block',
    marginBottom: '4px',
  },
  tripCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  tripHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  tripTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  tripStatus: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#667eea',
    background: 'rgba(102,126,234,0.1)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  tripDetails: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '12px',
  },
  primaryButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  actionBtnPrimary: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
    flexShrink: 0,
  },
  footer: {
    height: '60px',
    background: '#667eea',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0,
    width: '100%',
  },
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
    width: 'calc(100% - 16px)',
    margin: '0 8px',
    borderRadius: '8px',
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
    width: 'calc(100% - 16px)',
    margin: '0 8px',
    borderRadius: '8px',
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
  toggleSwitch: {
    position: 'relative',
    width: '48px',
    height: '28px',
    background: '#ccc',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'background 0.3s',
    flexShrink: 0,
  },
  toggleSwitchActive: {
    background: '#4CAF50',
  },
  toggleThumb: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '24px',
    height: '24px',
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  toggleThumbActive: {
    transform: 'translateX(20px)',
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

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  .sidebar-btn:hover {
    background: #f0f0f0;
  }
`;
document.head.appendChild(styleSheet);
export default DriverHome;