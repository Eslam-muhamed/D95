import { useState } from 'react';
import { motion } from 'framer-motion';
import XOGame from './XOGame';

export default function XOButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <motion.button
                className="brand-float-btn"
                style={{ bottom: '144px', right: '16px', zIndex: 45 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(true)}
                aria-label="XO"
                title="لعبة XO"
            >
                <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold', fontFamily: 'sans-serif' }}>XO</span>
            </motion.button>
            {open && <XOGame onClose={() => setOpen(false)} />}
        </>
    );
}
