// src/components/Logo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return <img src="src/assets/logo.png" alt="App Logo" className={className} />;
};

export default Logo;
