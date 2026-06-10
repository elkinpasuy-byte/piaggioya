import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { uploadDocument, createVerificationRequest } from '../services/verificationService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [role, setRole] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // ========== DOCUMENTOS PARA VERIFICACIÓN ==========
const [cedulaNumero, setCedulaNumero] = useState('');
const [placa, setPlaca] = useState('');
  
const [cedulaFrontFile, setCedulaFrontFile] = useState(null);
const [cedulaBackFile, setCedulaBackFile] = useState(null);
const [licenciaFile, setLicenciaFile] = useState(null);
const [soatFile, setSoatFile] = useState(null);
const [vehiculoFile, setVehiculoFile] = useState(null);
const [uploadingDocs, setUploadingDocs] = useState(false);

const [direccion, setDireccion] = useState('');
const [barrio, setBarrio] = useState('');
const [contactoEmergencia, setContactoEmergencia] = useState('');
const [telefonoEmergencia, setTelefonoEmergencia] = useState('');

  const validatePassword = (pass) => {
    if (pass.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'La contraseña debe tener al menos una mayúscula';
    }
    if (!/[0-9]/.test(pass)) {
      return 'La contraseña debe tener al menos un número';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (isRegistering) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }
    }
    
    let result;
   if (isRegistering) {
  result = await register(email, password, nombre, telefono, role);

  // SOLO PARA CONDUCTORES
  if (result.success && role === 'conductor') {
    const userId = result.uid;

    console.log('UID conductor:', userId);
if (isRegistering && role === 'conductor') {
  // Validar documentos requeridos
  if (!cedulaNumero) {
    setError('La cédula es requerida');
    setLoading(false);
    return;
  }
  if (!placa) {
    setError('La placa es requerida');
    setLoading(false);
    return;
  }
  if (!cedulaFrontFile || !cedulaBackFile || !licenciaFile || !soatFile || !vehiculoFile) {
    setError('Todos los documentos son requeridos');
    setLoading(false);
    return;
  }
  
  setUploadingDocs(true);
  
  // Subir documentos a Storage
  const cedulaFrontResult = await uploadDocument(credential.user.uid, 'cedula_front', cedulaFrontFile);
  const cedulaBackResult = await uploadDocument(credential.user.uid, 'cedula_back', cedulaBackFile);
  const licenciaResult = await uploadDocument(credential.user.uid, 'licencia', licenciaFile);
  const soatResult = await uploadDocument(credential.user.uid, 'soat', soatFile);
  const vehiculoResult = await uploadDocument(credential.user.uid, 'vehiculo', vehiculoFile);
  
  if (!cedulaFrontResult.success || !cedulaBackResult.success || !licenciaResult.success || 
      !soatResult.success || !vehiculoResult.success) {
    setError('Error subiendo documentos. Intenta de nuevo.');
    setUploadingDocs(false);
    return;
  }
  
  // Crear solicitud de verificación
  const verificationResult = await createVerificationRequest(credential.user.uid, {
    nombre: nombre,
    email: email,
    telefono: telefono,
    placa: placa,
    cedula: cedulaNumero,
    cedulaFrontUrl: cedulaFrontResult.url,
    cedulaBackUrl: cedulaBackResult.url,
    licenciaUrl: licenciaResult.url,
    soatUrl: soatResult.url,
    vehiculoUrl: vehiculoResult.url
  });
  
  setUploadingDocs(false);
  
  if (!verificationResult.success) {
    setError('Error enviando solicitud: ' + verificationResult.error);
    return;
  }
  
  setSuccessMessage('✅ Registro exitoso. Tu cuenta está pendiente de verificación.');
  setTimeout(() => navigate('/login'), 3000);
  return;
}
    // Aquí después agregaremos:
    // uploadDocument(...)
    // createVerificationRequest(...)
  }

} else {
  result = await login(email, password);
}
    
    setLoading(false);
    
    if (!result.success) {
      if (result.error.includes('email-already-in-use')) {
        setError('Este correo ya está registrado. Por favor inicia sesión.');
      } else if (result.error.includes('invalid-credential')) {
        setError('Correo o contraseña incorrectos.');
      } else if (result.error.includes('weak-password')) {
        setError('La contraseña es muy débil. Usa al menos 6 caracteres.');
      } else {
        setError(result.error);
      }
    } else {
      // ✅ REDIRECCIÓN CORRECTA
     console.log('✅ Redirigiendo al mapa...');
console.log('Usuario:', email);
     
      navigate('/', { replace: true });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}> PiaggioYa</h1>
        <img src="/logo3.png" style={{ width: "200px" }} />
        <h2 style={styles.subtitle}>{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegistering && (
            <>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.select}
              >
                <option value="cliente">Cliente</option>
                <option value="conductor">Conductor</option>
              </select>

              {role === 'conductor' && (
  <>
  
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Número de cédula"
                value={cedulaNumero}
                onChange={(e) => setCedulaNumero(e.target.value)}
                style={styles.input}
                />

              <input
                type="tel"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                style={styles.input}
                required
              />
              
                  <input
                type="text"
                placeholder="Dirección de residencia"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={styles.input}
              />

              <input
                type="text"
                placeholder="Barrio"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                style={styles.input}
              />
              
              <input
                type="text"
                placeholder="Placa del vehículo"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                style={styles.input}
              />

              <input
                type="text"
                placeholder="Nombre contacto de emergencia"
                value={contactoEmergencia}
                onChange={(e) => setContactoEmergencia(e.target.value)}
                style={styles.input}
              />

              <input
                type="tel"
                placeholder="Teléfono contacto de emergencia"
                value={telefonoEmergencia}
                onChange={(e) => setTelefonoEmergencia(e.target.value)}
                style={styles.input}
              />

                

    <label>Cédula frente</label>
    <input
      type="file"
      onChange={(e) => setCedulaFrontFile(e.target.files[0])}
    />

    <label>Cédula reverso</label>
    <input
      type="file"
      onChange={(e) => setCedulaBackFile(e.target.files[0])}
    />

    <label>Licencia de conducción</label>
    <input
      type="file"
      onChange={(e) => setLicenciaFile(e.target.files[0])}
    />

    <label>SOAT</label>
    <input
      type="file"
      onChange={(e) => setSoatFile(e.target.files[0])}
    />

    <label>Tarjeta de propiedad</label>
    <input
      type="file"
      onChange={(e) => setVehiculoFile(e.target.files[0])}
    />
  </>
)}
            </>
          )}
          <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
          
          <div style={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.passwordInput}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {isRegistering && (
            <div style={styles.passwordHint}>
              🔒 Mínimo 6 caracteres, 1 mayúscula y 1 número
            </div>
          )}
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>
        
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setPassword('');
          }}
          style={styles.linkButton}
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '8px',
    fontSize: '28px'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#666',
    fontSize: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative',
    width: '100%'
  },
  passwordInput: {
    padding: '12px',
    paddingRight: '45px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
  },
  passwordHint: {
    fontSize: '11px',
    color: '#888',
    textAlign: 'center',
    marginTop: '-4px'
  },
  button: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    marginTop: '16px',
    fontSize: '14px',
    width: '100%'
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center'
  }
};