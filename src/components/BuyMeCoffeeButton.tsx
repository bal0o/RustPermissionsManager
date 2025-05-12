import { useState } from 'react';

const BuyMeCoffeeButton = () => {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <a 
      href="https://www.buymeacoffee.com/bal0o" 
      target="_blank" 
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: isHovering ? '#FFDD00' : 'rgba(255, 221, 0, 0.85)',
        color: '#000000',
        padding: '3px 10px',
        borderRadius: '4px',
        fontFamily: 'Cookie, cursive',
        fontSize: '18px',
        textDecoration: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        marginRight: '10px',
        fontWeight: 'normal',
        lineHeight: '24px',
        height: '30px',
        boxSizing: 'border-box',
        opacity: isHovering ? 1 : 0.9
      }}
    >
      <span role="img" aria-label="beer" style={{ marginRight: '5px', fontSize: '16px' }}>🍺</span>
      Buy me a beer
    </a>
  );
};

export default BuyMeCoffeeButton; 