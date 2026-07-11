// src/pages/driver/DriverEarnings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Truck, Filter } from 'lucide-react';

export const DriverEarnings = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // all, week, month
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalDeliveries: 0,
    averagePerTrip: 0,
    bestDay: null,
    bestDayAmount: 0
  });

  useEffect(() => {
    if (userData?.email) {
      loadShipments();
    }
  }, [userData]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'shipments'),
        where('driverId', '==', userData.email),
        where('status', '==', 'delivered')
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setShipments(list);
      applyFilter(list, period);
      calculateStats(list);
    } catch (error) {
      console.error('Error cargando ganancias:', error);
    }
    setLoading(false);
  };

  const applyFilter = (data, p) => {
    let filtered = [...data];
    const now = new Date();

    if (p === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(s => {
        const date = s.createdAt?.toDate?.() || new Date(s.createdAt);
        return date >= weekAgo;
      });
    } else if (p === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter(s => {
        const date = s.createdAt?.toDate?.() || new Date(s.createdAt);
        return date >= monthAgo;
      });
    }

    setFilteredShipments(filtered);
  };

  const calculateStats = (data) => {
    let total = 0;
    let count = 0;
    let bestDayAmount = 0;
    let bestDay = null;
    const dayTotals = {};

    data.forEach(s => {
      const price = s.estimatedPrice || 0;
      total += price;
      count++;

      const date = s.createdAt?.toDate?.() || new Date(s.createdAt);
      const dateKey = date.toLocaleDateString();
      dayTotals[dateKey] = (dayTotals[dateKey] || 0) + price;
    });

    Object.entries(dayTotals).forEach(([date, amount]) => {
      if (amount > bestDayAmount) {
        bestDayAmount = amount;
        bestDay = date;
      }
    });

    setStats({
      totalEarned: total,
      totalDeliveries: count,
      averagePerTrip: count > 0 ? total / count : 0,
      bestDay: bestDay,
      bestDayAmount: bestDayAmount
    });
  };

  const handlePeriodChange = (p) => {
    setPeriod(p);
    applyFilter(shipments, p);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) return <div style={styles.loading}>Cargando ganancias...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/driver/home')} style={styles.backButton}>
          <ArrowLeft size={20} /> Volver
        </button>
        <h1 style={styles.title}>💰 Mis Ganancias</h1>
        <button onClick={loadShipments} style={styles.refreshButton}>🔄</button>
      </div>

      {/* Resumen */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <DollarSign size={20} color="#28a745" />
          <div>
            <div style={styles.summaryLabel}>Total ganado</div>
            <div style={styles.summaryValue}>{formatPrice(stats.totalEarned)}</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <Truck size={20} color="#667eea" />
          <div>
            <div style={styles.summaryLabel}>Viajes completados</div>
            <div style={styles.summaryValue}>{stats.totalDeliveries}</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <TrendingUp size={20} color="#ffc107" />
          <div>
            <div style={styles.summaryLabel}>Promedio por viaje</div>
            <div style={styles.summaryValue}>{formatPrice(stats.averagePerTrip)}</div>
          </div>
        </div>
        {stats.bestDay && (
          <div style={styles.summaryCard}>
            <Calendar size={20} color="#dc3545" />
            <div>
              <div style={styles.summaryLabel}>Mejor día</div>
              <div style={styles.summaryValue}>{formatPrice(stats.bestDayAmount)}</div>
              <div style={styles.summarySub}>{stats.bestDay}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={styles.filtersBar}>
        <Filter size={18} color="#888" />
        <button
          onClick={() => handlePeriodChange('all')}
          style={{ ...styles.filterBtn, ...(period === 'all' ? styles.filterActive : {}) }}
        >
          Todos
        </button>
        <button
          onClick={() => handlePeriodChange('week')}
          style={{ ...styles.filterBtn, ...(period === 'week' ? styles.filterActive : {}) }}
        >
          Última semana
        </button>
        <button
          onClick={() => handlePeriodChange('month')}
          style={{ ...styles.filterBtn, ...(period === 'month' ? styles.filterActive : {}) }}
        >
          Último mes
        </button>
        <span style={styles.count}>{filteredShipments.length} viajes</span>
      </div>

      {/* Lista de viajes */}
      {filteredShipments.length === 0 ? (
        <div style={styles.empty}>
          <p>No hay viajes completados en este período</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredShipments.map((s, index) => (
            <div key={index} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardId}>#{s.id?.slice(-6) || 'N/A'}</span>
                <span style={styles.cardDate}>{formatDate(s.createdAt)}</span>
              </div>
              <div style={styles.cardDetails}>
                <div>
                  <div style={styles.cardLabel}>Recogida</div>
                  <div style={styles.cardValue}>{s.pickupAddress || 'N/A'}</div>
                </div>
                <div>
                  <div style={styles.cardLabel}>Entrega</div>
                  <div style={styles.cardValue}>{s.deliveryAddress || 'N/A'}</div>
                </div>
                <div>
                  <div style={styles.cardLabel}>Monto</div>
                  <div style={styles.cardPrice}>{formatPrice(s.estimatedPrice)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '20px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  summarySub: {
    fontSize: '11px',
    color: '#888',
  },
  filtersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  filterActive: {
    background: '#667eea',
    color: '#fff',
    borderColor: '#667eea',
  },
  count: {
    fontSize: '13px',
    color: '#888',
    marginLeft: 'auto',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
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
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  },
  cardId: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#888',
  },
  cardDate: {
    fontSize: '12px',
    color: '#888',
  },
  cardDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '12px',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#888',
  },
  cardValue: {
    fontSize: '13px',
    color: '#333',
    wordBreak: 'break-word',
  },
  cardPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#28a745',
  },
};

export default DriverEarnings;