// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { LayoutDashboard, Package, Truck, Users, Star, LogOut, Menu, X } from 'lucide-react';
import { AdminNotifications } from '../../components/admin/AdminNotifications';

export const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalShipments: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    totalDrivers: 0,
    totalClients: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (userData?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadStats();
  }, [userData]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const shipmentsSnap = await getDocs(collection(db, 'shipments'));
      const shipments = shipmentsSnap.docs.map(doc => doc.data());
      
      const completed = shipments.filter(s => s.status === 'delivered');
      const pending = shipments.filter(s => s.status === 'pending');
      const inProgress = shipments.filter(s => s.status === 'in_progress');

      let totalStars = 0;
      let ratingsCount = 0;
      shipments.forEach(s => {
        if (s.rating?.stars) {
          totalStars += s.rating.stars;
          ratingsCount++;
        }
      });

      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());
      const drivers = users.filter(u => u.role === 'conductor');
      const clients = users.filter(u => u.role === 'cliente');

      setStats({
        totalShipments: shipments.length,
        completed: completed.length,
        pending: pending.length,
        inProgress: inProgress.length,
        totalDrivers: drivers.length,
        totalClients: clients.length,
        averageRating: ratingsCount > 0 ? totalStars / ratingsCount : 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Envíos', path: '/admin/shipments' },
    { icon: Truck, label: 'Conductores', path: '/admin/drivers' },
    { icon: Users, label: 'Clientes', path: '/admin/clients' },
  ];

  // Sidebar (para escritorio)
  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.logo}>🚚 Piaggio<span style={{ color: '#667eea' }}>Ya</span></div>
        <span style={styles.logoSub}>Admin</span>
      </div>
      <nav style={styles.sidebarNav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
            style={{
              ...styles.sidebarItem,
              ...(window.location.pathname === item.path ? styles.sidebarItemActive : {})
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <button onClick={handleLogout} style={styles.sidebarLogout}>
        <LogOut size={20} /> Cerrar sesión
      </button>
    </div>
  );

  if (loading) return <div style={styles.loading}>Cargando estadísticas...</div>;

  return (
    <div style={styles.container}>
      {/* Sidebar fijo (escritorio) */}
      <Sidebar />

      {/* Contenido principal */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Volver al mapa
          </button>
          <h1 style={styles.title}>📊 Panel de Administración</h1>
          <div style={styles.headerRight}>
            <AdminNotifications />
            <span style={styles.adminEmail}>{userData?.email}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>🚪</button>
          </div>
        </div>

        {/* Header móvil */}
        <div style={styles.mobileHeader}>
          <button onClick={toggleSidebar} style={styles.menuBtn}>
            <Menu size={24} color="#333" />
          </button>
          <span style={styles.mobileLogo}>🚚 Admin</span>
          <div style={styles.mobileHeaderRight}>
            <span style={styles.adminEmail}>{userData?.email}</span>
          </div>
        </div>

        {/* Overlay móvil */}
        {isSidebarOpen && (
          <>
            <div style={styles.overlay} onClick={toggleSidebar} />
            <div style={styles.mobileSidebar}>
              <div style={styles.sidebarHeader}>
                <div style={styles.logo}>🚚 Piaggio<span style={{ color: '#667eea' }}>Ya</span></div>
                <button onClick={toggleSidebar} style={styles.closeBtn}>
                  <X size={24} color="#fff" />
                </button>
              </div>
              <nav style={styles.sidebarNav}>
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                    style={{
                      ...styles.sidebarItem,
                      ...(window.location.pathname === item.path ? styles.sidebarItemActive : {})
                    }}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
              </nav>
              <button onClick={handleLogout} style={styles.sidebarLogout}>
                <LogOut size={20} /> Cerrar sesión
              </button>
            </div>
          </>
        )}

        {/* Tarjetas de estadísticas */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📦</div>
            <div style={styles.statNumber}>{stats.totalShipments}</div>
            <div style={styles.statLabel}>Total envíos</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #28a745' }}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statNumber}>{stats.completed}</div>
            <div style={styles.statLabel}>Completados</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #ffc107' }}>
            <div style={styles.statIcon}>🕐</div>
            <div style={styles.statNumber}>{stats.pending}</div>
            <div style={styles.statLabel}>Pendientes</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #007bff' }}>
            <div style={styles.statIcon}>🚀</div>
            <div style={styles.statNumber}>{stats.inProgress}</div>
            <div style={styles.statLabel}>En curso</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #667eea' }}>
            <div style={styles.statIcon}>🚚</div>
            <div style={styles.statNumber}>{stats.totalDrivers}</div>
            <div style={styles.statLabel}>Conductores</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #17a2b8' }}>
            <div style={styles.statIcon}>👤</div>
            <div style={styles.statNumber}>{stats.totalClients}</div>
            <div style={styles.statLabel}>Clientes</div>
          </div>
          <div style={{ ...styles.statCard, borderBottom: '3px solid #ffd700' }}>
            <div style={styles.statIcon}>⭐</div>
            <div style={styles.statNumber}>{stats.averageRating.toFixed(1)}</div>
            <div style={styles.statLabel}>Calificación promedio</div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={styles.quickActions}>
          <button onClick={() => navigate('/admin/shipments')} style={styles.actionBtnPrimary}>
            📦 Ver todos los envíos
          </button>
          <button onClick={() => navigate('/admin/drivers')} style={styles.actionBtnSecondary}>
            🚚 Gestionar conductores
          </button>
          <button onClick={() => navigate('/admin/clients')} style={styles.actionBtnSecondary}>
            👤 Gestionar clientes
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f7fb',
  },
  sidebar: {
    width: '240px',
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    padding: '0 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
  logoSub: {
    fontSize: '12px',
    color: '#888',
    display: 'block',
    marginTop: '4px',
  },
  sidebarNav: {
    flex: 1,
    padding: '20px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: '#aaa',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
    transition: 'all 0.2s',
  },
  sidebarItemActive: {
    background: 'rgba(102,126,234,0.2)',
    color: '#667eea',
  },
  sidebarLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0 10px',
    borderRadius: '12px',
    width: 'calc(100% - 20px)',
  },
  mainContent: {
    flex: 1,
    marginLeft: '240px',
    padding: '20px',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  backButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminEmail: {
    fontSize: '12px',
    color: '#888',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  mobileLogo: {
    fontSize: '18px',
    fontWeight: '600',
  },
  mobileHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    background: '#1a1a2e',
    zIndex: 100,
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.3s ease',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    padding: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  actionBtnPrimary: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '14px',
    background: '#fff',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#888',
  },
};

// Animación para sidebar móvil
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .mainContent { margin-left: 0; }
    .mobileHeader { display: flex; }
  }
`;
document.head.appendChild(styleSheet);