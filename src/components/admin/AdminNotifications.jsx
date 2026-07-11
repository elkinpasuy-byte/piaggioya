// src/components/admin/AdminNotifications.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Bell, X, UserPlus, Package, CheckCircle } from 'lucide-react';

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Escuchar cambios en conductores pendientes
    const unsubscribeDrivers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'conductor_pendiente')),
      (snapshot) => {
        const pending = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'driver_pending',
          message: `Nuevo conductor pendiente: ${doc.data().nombre || 'Sin nombre'}`,
          timestamp: doc.data().createdAt || new Date().toISOString(),
          read: false
        }));
        updateNotifications(pending, 'driver');
      }
    );

    // Escuchar nuevos envíos
    const unsubscribeShipments = onSnapshot(
      query(collection(db, 'shipments'), orderBy('createdAt', 'desc'), limit(10)),
      (snapshot) => {
        const newShipments = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'new_shipment',
          message: `Nuevo envío #${doc.id.slice(-6)} de ${doc.data().clientName || 'cliente'}`,
          timestamp: doc.data().createdAt || new Date().toISOString(),
          read: false
        }));
        updateNotifications(newShipments, 'shipment');
      }
    );

    return () => {
      unsubscribeDrivers();
      unsubscribeShipments();
    };
  }, []);

  const updateNotifications = (newItems, type) => {
    setNotifications(prev => {
      // Combinar y evitar duplicados
      const existingIds = prev.map(n => n.id);
      const filtered = newItems.filter(n => !existingIds.includes(n.id));
      const merged = [...filtered, ...prev];
      // Mantener solo los 50 más recientes
      const sorted = merged.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 50);
      
      const unread = sorted.filter(n => !n.read).length;
      setUnreadCount(unread);
      return sorted;
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'driver_pending': return <UserPlus size={16} color="#ffc107" />;
      case 'new_shipment': return <Package size={16} color="#007bff" />;
      case 'completed': return <CheckCircle size={16} color="#28a745" />;
      default: return <Bell size={16} />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.bellButton}
      >
        <Bell size={22} color="#333" />
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div style={styles.overlay} onClick={() => setIsOpen(false)} />
          <div style={styles.dropdown}>
            <div style={styles.header}>
              <span style={styles.title}>🔔 Notificaciones</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={styles.markAllButton}>
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={styles.empty}>No hay notificaciones</div>
            ) : (
              <div style={styles.list}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      ...styles.item,
                      ...(notif.read ? styles.itemRead : styles.itemUnread)
                    }}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div style={styles.itemIcon}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={styles.itemContent}>
                      <div style={styles.itemMessage}>{notif.message}</div>
                      <div style={styles.itemTime}>{formatTime(notif.timestamp)}</div>
                    </div>
                    {!notif.read && <div style={styles.unreadDot} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
    minWidth: '18px',
    textAlign: 'center',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '360px',
    maxHeight: '400px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  markAllButton: {
    fontSize: '11px',
    color: '#667eea',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '340px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
  },
  itemUnread: {
    background: '#f8f9ff',
  },
  itemRead: {
    opacity: 0.7,
  },
  itemIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemMessage: {
    fontSize: '13px',
    color: '#333',
    lineHeight: 1.3,
  },
  itemTime: {
    fontSize: '11px',
    color: '#888',
    marginTop: '2px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#667eea',
    flexShrink: 0,
  },
  empty: {
    padding: '30px 20px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
};