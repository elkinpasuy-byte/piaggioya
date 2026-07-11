// src/pages/admin/AdminShipments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'shipments'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setShipments(data);
    setFilteredShipments(data);
    setLoading(false);
  };

  useEffect(() => {
    let result = shipments;

    // Filtro por estado
    if (filter !== 'todos') {
      result = result.filter(s => s.status === filter);
    }

    // Búsqueda por ID o cliente
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.id.toLowerCase().includes(term) ||
        s.clientName?.toLowerCase().includes(term) ||
        s.clientId?.toLowerCase().includes(term)
      );
    }

    setFilteredShipments(result);
    setCurrentPage(1);
  }, [filter, searchTerm, shipments]);

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredShipments.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status) => ({
    backgroundColor: status === 'delivered' ? '#d4edda' :
                    status === 'pending' ? '#fff3cd' :
                    status === 'in_progress' ? '#cce5ff' :
                    '#e2e3e5',
    color: status === 'delivered' ? '#155724' :
           status === 'pending' ? '#856404' :
           status === 'in_progress' ? '#004085' :
           '#383d41'
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/admin')} style={styles.backButton}>
          ← Volver al Dashboard
        </button>
        <h1 style={styles.title}>📦 Todos los envíos</h1>
        <button onClick={loadShipments} style={styles.refreshButton}>🔄</button>
      </div>

      {/* Filtros y búsqueda */}
      <div style={styles.filtersBar}>
        <div style={styles.filterGroup}>
          <Filter size={18} color="#888" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="accepted">Aceptados</option>
            <option value="in_progress">En curso</option>
            <option value="delivered">Entregados</option>
          </select>
        </div>
        <div style={styles.searchGroup}>
          <Search size={18} color="#888" />
          <input
            type="text"
            placeholder="Buscar por ID o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <span style={styles.count}>{filteredShipments.length} envíos</span>
      </div>

      {loading ? (
        <div style={styles.loading}>Cargando...</div>
      ) : filteredShipments.length === 0 ? (
        <div style={styles.empty}>No hay envíos que coincidan con los filtros</div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Conductor</th>
                  <th>Tipo</th>
                  <th>Peso</th>
                  <th>Estado</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((s) => (
                  <tr key={s.id} style={styles.row}>
                    <td style={styles.idCell}>#{s.id.slice(-6)}</td>
                    <td>{s.clientName || s.clientId || 'N/A'}</td>
                    <td>{s.driverName || 'N/A'}</td>
                    <td>{s.cargoType || 'N/A'}</td>
                    <td>{s.cargoWeight || 0} kg</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusColor(s.status)
                      }}>
                        {s.status || 'desconocido'}
                      </span>
                    </td>
                    <td style={styles.priceCell}>${s.estimatedPrice?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={styles.pageButton}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={styles.pageInfo}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
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
  idCell: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#888',
  },
  priceCell: {
    fontWeight: '500',
    color: '#28a745',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#555',
  },
};