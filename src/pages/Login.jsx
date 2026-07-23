import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, register, resetPassword, verifyEmail, user } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [role, setRole] = useState('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para recuperación de contraseña
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // Estados para verificación de email
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegister) {
      // Registro
      const result = await register(email, password, nombre, telefono, role);
      if (result.success) {
        setSuccess(result.message || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.');
        setIsRegister(false);
        setEmail('');
        setPassword('');
        setNombre('');
        setTelefono('');
      } else {
        setError(result.error);
      }
    } else {
      // Login
      const result = await login(email, password);
      if (result.success) {
        // Verificar si el email está verificado
        if (user && !user.emailVerified) {
          setShowVerifyMessage(true);
          setSuccess('Inicio de sesión exitoso, pero tu correo aún no está verificado.');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  // ===== RECUPERAR CONTRASEÑA =====
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await resetPassword(resetEmail);
    if (result.success) {
      setSuccess(result.message);
      setShowResetPassword(false);
      setResetEmail('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // ===== REENVIAR VERIFICACIÓN =====
  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await verifyEmail();
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // ===== ESTILOS =====
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '8px',
      color: '#333'
    },
    subtitle: {
      textAlign: 'center',
      color: '#888',
      marginBottom: '24px',
      fontSize: '14px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#555',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      fontSize: '15px',
      background: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.2s',
      boxSizing: 'border-box'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      padding: '0',
      marginTop: '12px'
    },
    error: {
      background: '#fee',
      color: '#c00',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      textAlign: 'center'
    },
    success: {
      background: '#e8f5e9',
      color: '#2e7d32',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      textAlign: 'center'
    },
    toggleText: {
      textAlign: 'center',
      marginTop: '16px',
      color: '#888',
      fontSize: '14px'
    },
    verifyMessage: {
      background: '#fff3cd',
      color: '#856404',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      textAlign: 'center'
    },
    verifyButton: {
      background: '#ffc107',
      color: '#333',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 14px',
      marginTop: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '13px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    },
    modalCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    modalTitle: {
      fontSize: '22px',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#333',
      textAlign: 'center'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#888',
      float: 'right'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚚 PiaggioYa</h1>
        <p style={styles.subtitle}>
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión en tu cuenta'}
        </p>

        {error && <div style={styles.error}>❌ {error}</div>}
        {success && <div style={styles.success}>✅ {success}</div>}

        {showVerifyMessage && (
          <div style={styles.verifyMessage}>
            ⚠️ Tu correo aún no está verificado.
            <br />
            <button onClick={handleResendVerification} style={styles.verifyButton} disabled={loading}>
              Reenviar verificación
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={styles.select}
                >
                  <option value="cliente">Cliente</option>
                  <option value="conductor">Conductor</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              minLength={6}
            />
          </div>

          {!isRegister && (
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              style={{ ...styles.linkButton, marginTop: '0', marginBottom: '16px' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={styles.toggleText}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
              setShowVerifyMessage(false);
            }}
            style={styles.linkButton}
          >
            {isRegister ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </div>
      </div>

      {/* ===== MODAL DE RECUPERACIÓN DE CONTRASEÑA ===== */}
      {showResetPassword && (
        <div style={styles.modalOverlay} onClick={() => setShowResetPassword(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowResetPassword(false)}>✕</button>
            <h2 style={styles.modalTitle}>🔑 Recuperar contraseña</h2>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {error && <div style={styles.error}>❌ {error}</div>}
            {success && <div style={styles.success}>✅ {success}</div>}

            <form onSubmit={handleResetPassword}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo electrónico</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {})
                }}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};