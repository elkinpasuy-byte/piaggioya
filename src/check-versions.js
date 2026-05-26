// Ejecuta: node check-versions.js
const packageJson = require('./package.json');

console.log('📊 Versiones actuales:');
console.log(`React: ${packageJson.dependencies.react}`);
console.log(`React DOM: ${packageJson.dependencies['react-dom']}`);
console.log(`React Leaflet: ${packageJson.dependencies['react-leaflet']}`);
console.log(`Leaflet: ${packageJson.dependencies.leaflet}`);

const isValid = 
  packageJson.dependencies.react === '18.2.0' &&
  packageJson.dependencies['react-leaflet'] === '4.2.1';

if (isValid) {
  console.log('✅ Versiones compatibles correctas');
} else {
  console.log('❌ Versiones incorrectas. Ejecuta el script de limpieza');
}