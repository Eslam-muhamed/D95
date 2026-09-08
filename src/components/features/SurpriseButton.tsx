import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export default function SurpriseButton({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      title="ابهرني"
      aria-label="ابهرني"
      className="cursor-pointer"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 20,
        zIndex: 35,
        background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
        boxShadow: '0 4px 20px rgba(139,26,42,0.42)',
        animation: 'surprisePulse 3s ease-in-out infinite',
        borderRadius: 50,
        height: 48,
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: 'none',
        color: 'white',
      }}
    >
      <Star size={16} fill="currentColor" />
      <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
        ابهرني
      </span>
    </motion.button>
  );
}
