import { useState, useEffect } from "react";

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada por el navegador");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);

        // ubicación por defecto (Pasto)
        setLocation({
          lat: 1.2136,
          lng: -77.2811,
        });
      }
    );
  }, []);

  return { location, loading, error };
};