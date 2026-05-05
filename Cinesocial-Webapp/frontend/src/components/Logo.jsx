import { Link } from 'react-router-dom';

export default function Logo({ variant = 'dark', className = '' }) {
  const isLight = variant === 'light';

  // For light variant (used on dark backgrounds like Footer): 
  // Make "CINE" Yellow (#FFD300) and "SOCIAL" White or Yellow as well.
  // For dark variant (used on light backgrounds like NavBar):
  // Make "CINE" Orange (#FF3D00) and "SOCIAL" Black (#000).

  return (
    <Link 
      to="/" 
      className={`font-serif font-black uppercase tracking-tighter flex items-center ${className}`}
      style={{ fontSize: '2rem', lineHeight: '1' }}
    >
      <span 
        style={{ 
          color: '#FFD300',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill'
        }}
      >
        CINE
      </span>
      <span 
        style={{ 
          color: isLight ? '#fff' : '#000'
        }}
      >
        SOCIAL
      </span>
    </Link>
  );
}
