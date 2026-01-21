'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BeautiaLogo } from './BeautiaLogo';

export function LoadingIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800); // Total animation duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* The Drop (Tear) Animation */}
            <motion.div
              initial={{ y: -200, scale: 0, opacity: 0 }}
              animate={{ 
                y: [ -200, 0, 20 ], // Falls down -> stops -> slightly moves
                scale: [ 0, 1, 1.2, 0 ], // Appears -> grows -> disappears
                opacity: [ 0, 1, 1, 0 ],
                borderRadius: ["50% 50% 50% 0", "50% 50% 50% 50%"] // Drop shape -> Circle
              }}
              transition={{ 
                duration: 2,
                times: [0, 0.4, 0.8, 1],
                ease: "easeInOut"
              }}
              className="absolute w-6 h-6 bg-gradient-to-br from-brand-pink via-brand-lilac to-brand-mint blur-[2px] shadow-[0_0_20px_rgba(249,180,201,0.6)]"
              style={{ rotate: 45 }}
            />

            {/* Ripple Effect (When drop hits) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 3], opacity: [0.5, 0] }}
              transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
              className="absolute w-20 h-20 border border-brand-lilac/50 rounded-full"
            />

            {/* Logo Reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.8 }}
              className="flex flex-col items-center gap-4 mt-8"
            >
               <BeautiaLogo className="w-16 h-16 animate-pulse" />
               <motion.span 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 2.2, duration: 0.5 }}
                 className="text-[20px] font-bold text-primary tracking-widest"
               >
                 BEAUTIA
               </motion.span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
