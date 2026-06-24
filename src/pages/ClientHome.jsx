// src/pages/ClientHome.jsx
// Panel cliente con diseño moderno (sidebar + mapa + bottom sheet)


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { PiaggioMap } from '../components/map/PiaggioMap';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Menu, X, Home, Package, History, Star, User, HelpCircle, Truck, MapPin, Clock } from 'lucide-react';

export const ClientHome = () => {
  const { user, userData, logout } = useAuth();
  const { location, loading, error } = useGeolocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeShipment, setActiveShipment] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  

  // ===== CARGAR ENVÍOS DEL CLIENTE =====
  useEffect(() => {
    const loadShipments = async () => {
      if (!userData?.email) return;
      try {
        const q = query(
          collection(db, 'shipments'),
          where('clientId', '==', userData.email),
          where('status', 'in', ['accepted', 'in_progress', 'pending'])
        );
        const snapshot = await getDocs(q);
        const envios = [];
        snapshot.forEach(doc => envios.push({ id: doc.id, ...doc.data() }));
        
        // Buscar envío activo (el primero que no esté entregado)
        const activo = envios.find(v => v.status !== 'delivered');
        setActiveShipment(activo || null);

        // Cargar últimos 3 viajes completados
        const qHistorial = query(
          collection(db, 'shipments'),
          where('clientId', '==', userData.email),
          where('status', '==', 'delivered')
        );
        const histSnapshot = await getDocs(qHistorial);
        const historial = [];
        histSnapshot.forEach(doc => historial.push({ id: doc.id, ...doc.data() }));
        setRecentTrips(historial.slice(0, 3));
      } catch (error) { 
        console.error('Error cargando envíos:', error); 
      }
    };
    loadShipments();
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
        <button onClick={() => { navigate('/client/request'); toggleSidebar(); }} style={styles.sidebarItem}>
          <Package size={20} /> Solicitar envío
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <MapPin size={20} /> Mi envío
        </button>
        <button onClick={() => { navigate('/client/trips'); toggleSidebar(); }} style={styles.sidebarItem}>
          <History size={20} /> Historial
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <Star size={20} /> Calificaciones
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <User size={20} /> Perfil
        </button>
        <button onClick={() => { toggleSidebar(); }} style={styles.sidebarItem}>
          <HelpCircle size={20} /> Ayuda
        </button>
      </nav>
      <button onClick={handleLogout} style={styles.sidebarLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  );

  // ========== RENDER PRINCIPAL ==========
  return (
    <div style={styles.page}>
      
     {/* console.log('🔥 CLIENTHOME CARGADO');*/}

      {/* HEADER */}
      
      <header style={styles.newHeader}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          <Menu size={24} />
        </button>

       <div style={styles.headerLeft}>
  <div style={styles.avatar}>
    {(userData?.nombre || 'U').charAt(0).toUpperCase()}
  </div>

  <div>
    <div style={styles.headerLogo}>
      🚚 PiaggioYa
    </div>

    <div style={styles.headerUser}>
      {userData?.nombre || 'Cliente'}
    </div>
  </div>
</div>
        <div style={styles.onlineSection}>
          🟢 Cliente
        </div>
      </header>

      {/* MAPA */}
        <div style={styles.mapCard}>
          <PiaggioMap userLocation={location} />
        </div>

      {/* CONTENIDO */}
      <main style={styles.mainContent}>

        {/* BOTÓN PRINCIPAL: SOLICITAR ENVÍO */}
        <button
          onClick={() => navigate('/client/request')}
          style={styles.primaryBtn}
        >
          <Truck size={24} style={{ marginRight: '8px' }} />
          Solicitar envío
        </button>

        {/* ENVÍO ACTIVO (si existe) */}
        {activeShipment && (
          <div style={styles.activeCard}>
            <div style={styles.activeHeader}>
              <span style={styles.activeTitle}>📦 Envío activo</span>
              <span style={styles.activeStatus}>
                {activeShipment.status === 'pending' && '⏳ Pendiente'}
                {activeShipment.status === 'accepted' && '✅ En camino'}
                {activeShipment.status === 'in_progress' && '🚚 En ruta'}
              </span>
            </div>
           <div style={styles.activeDetails}>
  <div>
    <strong>📍 Recogida</strong>
    <p>{activeShipment.pickupAddress}</p>
  </div>

  <div>
    <strong>🚚 Estado</strong>
    <p>{activeShipment.status}</p>
  </div>

  <div>
    <strong>📦 Entrega</strong>
    <p>{activeShipment.deliveryAddress}</p>
  </div>

  <div>
    <strong>🚚 Servicio</strong>
    <p>PiaggioYa</p>
  </div>

</div>
            <button
              onClick={() => navigate(`/track/${activeShipment.id}`)}
              style={styles.trackBtn}
            >
              📍 Ver en mapa
            </button>
          </div>
        )}

        

        {/* HISTORIAL RECIENTE */}
        {recentTrips.length > 0 && (
          <div style={styles.historyCard}>
            <h3 style={styles.historyTitle}>📋 Viajes recientes</h3>
            {recentTrips.map((trip, index) => (
              <div key={index} style={styles.historyItem}>

                 <div>
      <strong>
        📦 {trip.cargoType || 'Carga'}
      </strong>
      <div style={{fontSize:'12px',color:'#888'}}>
        {trip.cargoWeight || 0} kg
      </div>
    </div>
                <div style={styles.historyStatus}>
      ✅ Completado
    </div>

  </div>
            ))}
            <button
              onClick={() => navigate('/client/trips')}
              style={styles.historyBtn}
            >
              Ver historial completo →
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
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
    width: '100%',
    boxSizing: 'border-box',
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
  headerContent:{
  width:'100%',
  maxWidth:'1200px',
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center'
},

headerLeft:{
  display:'flex',
  alignItems:'center',
  gap:'12px'
},

avatar:{
  width:'48px',
  height:'48px',
  borderRadius:'50%',
  background:'#667eea',
  color:'#fff',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  fontWeight:'700',
  fontSize:'18px'
},

headerUser:{
  fontSize:'13px',
  color:'#666'
},

  // CONTENIDO
 mainContent: {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  boxSizing: 'border-box',
},
  // BOTÓN PRINCIPAL
  primaryBtn: {
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
    transition: 'transform 0.2s',
  },

  // ENVÍO ACTIVO
activeCard: {
  background: '#fff',
  borderRadius: '20px',
  padding: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  borderLeft: '5px solid #667eea',
},
  activeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  activeTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  activeStatus: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 12px',
    borderRadius: '20px',
    background: '#e8f5e9',
    color: '#2e7d32',
  },
activeDetails: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  fontSize: '14px',
  color: '#333',
  marginBottom: '12px',
},
  trackBtn: {
    width: '100%',
    padding: '10px',
    background: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },

  // MAPA
  mapCard:{
  position:'relative',
  zIndex:1,
  height:'400px',
  borderRadius:'1px solid',
  overflow:'hidden',
  background:'#fff'
},

  // HISTORIAL
  historyCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    border:'1px solid #eef1ff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  historyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1a1a2e',
  },
historyItem: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px',
  borderRadius: '12px',
  background: '#f8f9ff',
  marginBottom: '10px',
},
  historyStatus: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyBtn: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px 0 0 0',
    width: '100%',
    textAlign: 'center',
  },

  // FOOTER
  footer: {
    width: '100%',
    padding: '16px',
    background: '#667eea',
    color: '#fff', 
    borderRadius: '1px solid #667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    boxSizing: 'border-box',
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