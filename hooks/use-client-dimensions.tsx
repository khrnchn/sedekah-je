import { useState, useEffect } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

const useClientDimensions = (): Dimensions => {
  const getDimensions = (): Dimensions => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [dimensions, setDimensions] = useState<Dimensions>(getDimensions);

  useEffect(() => {
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
