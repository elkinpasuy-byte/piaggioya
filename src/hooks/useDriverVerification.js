// src/hooks/useDriverVerification.js
// Hook para verificar estado del conductor

import { useState, useEffect } from 'react';
import { getDriverVerificationStatus } from '../services/verificationService';

export const useDriverVerification = (userId) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkVerification = async () => {
      const result = await getDriverVerificationStatus(userId);
      if (result.success && result.data) {
        setVerificationStatus(result.data);
        setIsVerified(result.data.verified === true);
      }
      setLoading(false);
    };

    checkVerification();
  }, [userId]);

  return { verificationStatus, isVerified, loading };
};