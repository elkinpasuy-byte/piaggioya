export const calculatePrice = (distance) => {
  const baseFare = 5000;
  const pricePerKm = 1200;

  return baseFare + (distance * pricePerKm);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price);
};