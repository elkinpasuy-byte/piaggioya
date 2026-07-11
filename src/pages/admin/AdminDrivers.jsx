// src/pages/admin/AdminDrivers.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Filter, UserCheck, UserX, Clock } from 'lucide-react';

export const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', 'in', ['conductor', 'conductor_pendiente', 'conductor_rechazado']));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setDrivers(list);
      setFilteredDrivers(list);
    } catch (error) {
      console.error('Error cargando conductores:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = drivers;

    if (filter !== 'todos') {
      result = result.filter(d => {
        if (filter === 'pendientes') return d.role === 'conductor_pendiente';
        if (filter === 'activos') return d.role === 'conductor';
        if (filter === 'rechazados') return d.role === 'conductor_rechazado';
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.nombre?.toLowerCase().includes(term) ||
        d.email?.toLowerCase().includes(term) ||
        d.placa?.toLowerCase().includes(term)
      );
    }

    setFilteredDrivers(result);
  }, [filter, searchTerm, drivers]);

  const handleApprove = async (userId) => {
    if (!window.confirm('¿Aprobar este conductor?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'conductor' });
      await loadDrivers();
      alert('✅ Conductor aprobado');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Debes ingresar un motivo de rechazo');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', selectedDriver.id), {
        role: 'conductor_rechazado',
        rejectionReason: rejectReason
      });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedDriver(null);
      await loadDrivers();
      alert('❌ Conductor rechazado');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleSuspend = async (userId) => {
    if (!window.confirm('¿Suspender este conductor?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: true,
        suspendedAt: new Date().toISOString()
      });
      await loadDrivers();
      alert('⛔ Conductor suspendido');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('¿Activar este conductor?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: false,
        suspendedAt: null
      });
      await loadDrivers();
      alert('✅ Conductor activado');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'conductor_pendiente') return { label: '⏳ Pendiente', color: '#ffc107' };
    if (role === 'conductor') return { label: '✅ Activo', color: '#28a745' };
    if (role === 'conductor_rechazado') return { label: '❌ Rechazado', color: '#dc3545' };
    return { label: role, color: '#6c757d' };
  };

  const pendingCount = drivers.filter(d => d.role === 'conductor_pendiente').length;
  const activeCount = drivers.filter(d => d.role === 'conductor').length;
  const rejectedCount = drivers.filter(d => d.role === 'conductor_rechazado').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/admin')} style={styles.backButton}>
          ← Volver al Dashboard
        </button>
        <h1 style={styles.title}>🚚 Gestión de conductores</h1>
        <button onClick={loadDrivers} style={styles.refreshButton}>🔄</button>
      </div>

      {/* Estadísticas rápidas */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <Clock size={20} color="#ffc107" />
          <span>{pendingCount}</span>
          <span>Pendientes</span>
        </div>
        <div style={styles.statCard}>
          <UserCheck size={20} color="#28a745" />
          <span>{activeCount}</span>
          <span>Activos</span>
        </div>
        <div style={styles.statCard}>
          <UserX size={20} color="#dc3545" />
          <span>{rejectedCount}</span>
          <span>Rechazados</span>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div style={styles.filtersBar}>
        <div style={styles.filterGroup}>
          <Filter size={18} color="#888" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="activos">Activos</option>
            <option value="rechazados">Rechazados</option>
          </select>
        </div>
        <div style={styles.searchGroup}>
          <Search size={18} color="#888" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <span style={styles.count}>{filteredDrivers.length} conductores</span>
      </div>

      {loading ? (
        <div style={styles.loading}>Cargando conductores...</div>
      ) : filteredDrivers.length === 0 ? (
        <div style={styles.empty}>No hay conductores que coincidan con los filtros</div>
      ) : (
        <div style={styles.list}>
          {filteredDrivers.map(driver => {
            const roleInfo = getRoleLabel(driver.role);
            return (
              <div key={driver.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.driverName}>{driver.nombre || 'Sin nombre'}</span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: roleInfo.color + '20',
                      color: roleInfo.color
                    }}>
                      {roleInfo.label}
                    </span>
                    {driver.suspended && (
                      <span style={styles.badgeSuspended}>⛔ Suspendido</span>
                    )}
                  </div>
                  <span style={styles.driverEmail}>{driver.email}</span>
                </div>
                <div style={styles.driverInfo}>
                  <p>📞 {driver.telefono || 'N/A'}</p>
                  <p>🚗 Placa: {driver.placa || 'N/A'}</p>
                  {driver.rejectionReason && (
                    <p style={styles.rejectionReason}>Motivo: {driver.rejectionReason}</p>
                  )}
                </div>
                <div style={styles.actions}>
                  {driver.role === 'conductor_pendiente' && (
                    <>
                      <button onClick={() => handleApprove(driver.id)} style={styles.approveButton}>
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowRejectModal(true);
                        }}
                        style={styles.rejectButton}
                      >
                        ❌ Rechazar
                      </button>
                    </>
                  )}
                  {driver.role === 'conductor' && (
                    <>
                      {driver.suspended ? (
                        <button onClick={() => handleActivate(driver.id)} style={styles.activateButton}>
                          ✅ Activar
                        </button>
                      ) : (
                        <button onClick={() => handleSuspend(driver.id)} style={styles.suspendButton}>
                          ⛔ Suspender
                        </button>
                      )}
                    </>
                  )}
                  {driver.role === 'conductor_rechazado' && (
                    <button onClick={() => handleApprove(driver.id)} style={styles.approveButton}>
                      ✅ Reconsiderar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de rechazo */}
      {showRejectModal && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowRejectModal(false)} />
          <div style={styles.modal}>
            <h3>Rechazar conductor</h3>
            <p>Conductor: <strong>{selectedDriver?.nombre}</strong></p>
            <textarea
              placeholder="Motivo del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={styles.textarea}
              rows={4}
            />
            <div style={styles.modalActions}>
              <button onClick={() => setShowRejectModal(false)} style={styles.cancelButton}>
                Cancelar
              </button>
              <button onClick={handleReject} style={styles.confirmRejectButton}>
                Rechazar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: '#f5f7fb',
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
  refreshButton: {
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '18px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fff',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  filtersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterSelect: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    flex: 1,
    outline: 'none',
  },
  count: {
    fontSize: '13px',
    color: '#888',
    marginLeft: 'auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
    background: '#fff',
    borderRadius: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  driverName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: '8px',
  },
  driverEmail: {
    fontSize: '13px',
    color: '#888',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeSuspended: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
    marginLeft: '8px',
  },
  driverInfo: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '12px',
  },
  rejectionReason: {
    color: '#dc3545',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  approveButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  rejectButton: {
    padding: '8px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  suspendButton: {
    padding: '8px 16px',
    background: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  activateButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    zIndex: 1001,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  confirmRejectButton: {
    flex: 1,
    padding: '10px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};