import { PiaggioMap } from "./components/map/PiaggioMap";
import { LoadingSpinner } from './components/Loading/LoadingSpinner';
import { useGeolocation } from './hooks/useGeolocation';
import { PiaggioPopup } from "./components/PiaggioCard/PiaggioPopup";
import './App.css';

function App() {
  const { location, loading, error } = useGeolocation();

  if (loading) {
    return <LoadingSpinner message="Obteniendo tu ubicación..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error de ubicación</h2>
        <p>{error}</p>
        <p>Usando ubicación por defecto: Pasto, Colombia</p>
        <PiaggioMap userLocation={location} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <PiaggioMap userLocation={location} />
    </div>
  );
}



export default App;


