import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const useFingerprint = () => {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId); // Unique browser fingerprint
    };

    getFingerprint();
  }, []);

  return visitorId;
};

export default useFingerprint;
