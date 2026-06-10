// src/components/ui/StarRating.jsx
// Componente de estrellas para calificar

import { useState } from 'react';

export const StarRating = ({ initialRating = 0, onRatingChange, readonly = false, size = 32 }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleClick = (value) => {
    if (readonly) return;
    setRating(value);
    onRatingChange?.(value);
  };

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: `${size}px`,
            color: (hover || rating) >= star ? '#FFD700' : '#e0e0e0',
            transition: 'transform 0.1s ease',
            transform: (hover || rating) >= star ? 'scale(1.1)' : 'scale(1)',
            display: 'inline-block'
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};