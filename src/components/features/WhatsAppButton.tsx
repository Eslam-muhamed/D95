import { motion } from 'framer-motion';

const WHATSAPP = '201000000000';

export default function WhatsAppButton() {
  const handleClick = () => {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('مرحباً! أريد الاستفسار عن D95 Gaming & Café 🎮☕')}`, '_blank');
  };

  return (
    <motion.button
      onClick={handleClick}
      className="brand-float-btn cursor-pointer"
      style={{ bottom: 24, left: 20, background: 'linear-gradient(135deg, #128C7E, #25D366)', zIndex: 35 }}
      whileTap={{ scale: 0.92 }}
      title="تواصل معنا على واتساب"
    >
      💬
    </motion.button>
  );
}
