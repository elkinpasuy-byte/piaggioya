// src/pages/admin/AdminClients.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Filter, UserCheck, UserX, History } from 'lucide-react';

export const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientShipments, setClientShipments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'cliente'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClients(list);
      setFilteredClients(list);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = clients;

    if (filter === 'activos') {
      result = result.filter(c => !c.suspended);
    } else if (filter === 'suspendidos') {
      result = result.filter(c => c.suspended);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nombre?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term)
      );
    }

    setFilteredClients(result);
  }, [filter, searchTerm, clients]);

  const loadClientHistory = async (clientId) => {
    try {
      const q = query(collection(db, 'shipments'), where('clientId', '==', clientId));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClientShipments(list);
      setShowHistory(true);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const handleSuspend = async (userId) => {
    if (!window.confirm('¿Suspender este cliente?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: true,
        suspendedAt: new Date().toISOString()
      });
      await loadClients();
      alert('⛔ Cliente suspendido');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('¿Activar este cliente?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: false,
        suspendedAt: null
      });
      await loadClients();
      alert('✅ Cliente activado');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const getStatusBadge = (suspended) => ({
    backgroundColor: suspended ? '#f8d7da' : '#d4edda',
    color: suspended ? '#721c24' : '#155724',
    label: suspended ? '⛔ Suspendido' : '✅ Activo'
  });

  const activeCount = clients.filter(c => !c.suspended).length;
  const suspendedCount = clients.filter(c => c.suspended).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/admin')} style={styles.backButton}>
          ← Volver al Dashboard
        </button>
        <h1 style={styles.title}>👤 Gestión de clientes</h1>
        <button onClick={loadClients} style={styles.refreshButton}>🔄</button>
      </div>

      {/* Estadísticas rápidas */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <UserCheck size={20} color="#28a745" />
          <span>{activeCount}</span>
          <span>Activos</span>
        </div>
        <div style={styles.statCard}>
          <UserX size={20} color="#dc3545" />
          <span>{suspendedCount}</span>
          <span>Suspendidos</span>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div style={styles.filtersBar}>
        <div style={styles.filterGroup}>
          <Filter size={18} color="#888" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="suspendidos">Suspendidos</option>
          </select>
        </div>
        <div style={styles.searchGroup}>
          <Search size={18} color="#888" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <span style={styles.count}>{filteredClients.length} clientes</span>
      </div>

      {loading ? (
        <div style={styles.loading}>Cargando clientes...</div>
      ) : filteredClients.length === 0 ? (
        <div style={styles.empty}>No hay clientes que coincidan con los filtros</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const status = getStatusBadge(client.suspended);
                return (
                  <tr key={client.id} style={styles.row}>
                    <td style={styles.nameCell}>{client.nombre || 'Sin nombre'}</td>
                    <td>{client.email}</td>
                    <td>{client.telefono || 'N/A'}</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: status.backgroundColor,
                        color: status.color
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            loadClientHistory(client.email);
                          }}
                          style={styles.historyButton}
                          title="Ver historial"
                        >
                          <History size={16} />
                        </button>
                        {client.suspended ? (
                          <button onClick={() => handleActivate(client.id)} style={styles.activateButton}>
                            ✅ Activar
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(client.id)} style={styles.suspendButton}>
                            ⛔ Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de historial */}
      {showHistory && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowHistory(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>📋 Historial de {selectedClient?.nombre || 'cliente'}</h3>
              <button onClick={() => setShowHistory(false)} style={styles.closeModalBtn}>✕</button>
            </div>
            {clientShipments.length === 0 ? (
              <p style={styles.empty}>No tiene envíos</p>
            ) : (
              <ul style={styles.historyList}>
                {clientShipments.map((s, index) => (
                  <li key={index} style={styles.historyItem}>
                    <span style={styles.historyId}>#{s.id.slice(-6)}</span>
                    <span>{s.cargoType || 'Carga'}</span>
                    <span>{s.cargoWeight || 0} kg</span>
                    <span style={{
                      ...styles.historyStatus,
                      backgroundColor: s.status === 'delivered' ? '#d4edda' :
                                      s.status === 'pending' ? '#fff3cd' :
                                      s.status === 'in_progress' ? '#cce5ff' :
                                      '#e2e3e5',
                      color: s.status === 'delivered' ? '#155724' :
                             s.status === 'pending' ? '#856404' :
                             s.status === 'in_progress' ? '#004085' :
                             '#383d41'
                    }}>
                      {s.status || 'desconocido'}
                    </span>
                    <span style={styles.historyPrice}>${s.estimatedPrice?.toLocaleString() || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            )}
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
  tableWrapper: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  row: {
    borderBottom: '1px solid #f0f0f0',
  },
  nameCell: {
    fontWeight: '500',
    color: '#1a1a2e',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  historyButton: {
    padding: '6px 10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendButton: {
    padding: '6px 12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  activateButton: {
    padding: '6px 12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
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
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1001,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#888',
  },
  historyList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
  },
  historyId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888',
  },
  historyStatus: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  historyPrice: {
    fontWeight: '500',
    color: '#28a745',
  },
};