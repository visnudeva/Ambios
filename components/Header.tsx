import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <h1 
        className="text-5xl md:text-6xl font-bold tracking-widest uppercase transition-all duration-500"
        style={{ color: 'var(--color-primary)' }}
      >
        Ambios
      </h1>
      <p 
        className="text-md md:text-lg mt-2 tracking-wider transition-colors duration-500"
        style={{ color: 'var(--color-secondary)' }}
      >
        Tune in to the digital heartbeat
      </p>
    </header>
  );
};

export default Header;
