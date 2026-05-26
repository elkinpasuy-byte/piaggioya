// Genera coordenadas aleatorias dentro de un radio (en km)
const generateNearbyCoordinates = (centerLat, centerLng, radiusKm = 3) => {
  const radiusInDegrees = radiusKm / 111.32; // 1 grado ≈ 111.32 km
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Ajuste para latitud (el factor de corrección para longitud)
  const newLat = centerLat + y;
  const newLng = centerLng + (x / Math.cos(centerLat * Math.PI / 180));
  
  return { lat: newLat, lng: newLng };
};

// Lista de nombres de conductores
const nombres = [
  'Carlos Pérez', 'María González', 'Juan Rodríguez', 
  'Ana Martínez', 'Luis Fernández', 'Sofía López',
  'David Sánchez', 'Laura Ramírez', 'Javier Torres',
  'Valentina Castro'
];

// Placas de Pasto
const generarPlaca = () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  const letra1 = letras[Math.floor(Math.random() * letras.length)];
  const letra2 = letras[Math.floor(Math.random() * letras.length)];
  const letra3 = letras[Math.floor(Math.random() * letras.length)];
  const num1 = numeros[Math.floor(Math.random() * numeros.length)];
  const num2 = numeros[Math.floor(Math.random() * numeros.length)];
  const num3 = numeros[Math.floor(Math.random() * numeros.length)];
  return `${letra1}${letra2}${letra3}-${num1}${num2}${num3}`;
};

// Capacidades de carga (kg)
const capacidades = [80, 100, 120, 150, 180, 200];

export const generarPiaggiosCercanos = (centerLat, centerLng, cantidad = 5) => {
  const piaggios = [];
  
  for (let i = 0; i < cantidad; i++) {
    const coordenadas = generateNearbyCoordinates(centerLat, centerLng, 2.5); // Radio de 2.5km
    
    piaggios.push({
      id: `piaggio-${i + 1}-${Date.now()}-${Math.random()}`,
      nombre: nombres[Math.floor(Math.random() * nombres.length)],
      placa: generarPlaca(),
      capacidad: capacidades[Math.floor(Math.random() * capacidades.length)],
      coordenadas: [coordenadas.lat, coordenadas.lng],
      estado: 'disponible', // disponible, ocupado, mantenimiento
      calificacion: (Math.random() * 2 + 3).toFixed(1), // 3.0 a 5.0
      entregasHoy: Math.floor(Math.random() * 15) + 1,
      telefono: `310${Math.floor(Math.random() * 9000000 + 1000000)}`
    });
  }
  
  return piaggios;
};