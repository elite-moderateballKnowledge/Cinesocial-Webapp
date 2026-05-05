import { useState } from 'react';

/** Deterministic palette per first character so the same name always gets the same color. */
const PALETTES = [
  { bg: '#FFD300', fg: '#000000' }, // primary yellow
  { bg: '#FF3D00', fg: '#FFFFFF' }, // secondary red
  { bg: '#6C3CE1', fg: '#FFFFFF' }, // purple
  { bg: '#00A3E0', fg: '#FFFFFF' }, // blue
  { bg: '#00C853', fg: '#000000' }, // green
  { bg: '#FF6B35', fg: '#FFFFFF' }, // orange
  { bg: '#E91E8C', fg: '#FFFFFF' }, // pink
];

const getPalette = (text) => {
  if (!text) return PALETTES[0];
  return PALETTES[text.charCodeAt(0) % PALETTES.length];
};

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  fallbackText = 'NO IMAGE',
  isAvatar = false,
}) {
  const [failedSrc, setFailedSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const failed = src && failedSrc === src;

  if (!src || failed) {
    const { bg, fg } = getPalette(fallbackText);
    return (
      <div
        className={`w-full h-full flex items-center justify-center font-bold text-center select-none ${fallbackClassName}`}
        style={{ backgroundColor: bg, color: fg, fontFamily: 'var(--font-display)' }}
      >
        {isAvatar
          ? <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{fallbackText}</span>
          : <span className="px-2 text-sm leading-tight">{fallbackText}</span>
        }
      </div>
    );
  }

  return (
    <>
      {/* Placeholder shown while image loads */}
      {!loaded && (
        <div
          className={`w-full h-full flex items-center justify-center ${fallbackClassName}`}
          style={{ backgroundColor: getPalette(fallbackText).bg }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailedSrc(src)}
      />
    </>
  );
}
