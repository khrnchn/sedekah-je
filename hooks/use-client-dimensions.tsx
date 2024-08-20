"use client";

import { useState, useEffect } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

const useClientDimensions = (): Dimensions => {
  const getDimensions = (): Dimensions => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  };

  const [dimensions, setDimensions] = useState<Dimensions>(getDimensions);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setDimensions(getDimensions());
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return dimensions;
};

export default useClientDimensions;
