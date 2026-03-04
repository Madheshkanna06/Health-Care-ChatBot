
import { motion } from 'framer-motion';

export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* DNA Helix or Abstract Shapes */}
      <motion.div
        className="absolute top-20 right-20 w-96 h-96 opacity-10"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div className="w-full h-full bg-gradient-to-tr from-rose-300 to-pink-300 rounded-full blur-3xl" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-20 w-80 h-80 opacity-10"
        animate={{
          rotate: -360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div className="w-full h-full bg-gradient-to-tr from-sky-300 to-teal-300 rounded-full blur-3xl" />
      </motion.div>

      {/* Floating Particles - Adorable Pastel Dots */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-rose-400/40 w-4 h-4' :
            i % 3 === 1 ? 'bg-sky-400/40 w-6 h-6' :
              'bg-fuchsia-400/40 w-3 h-3'
            }`}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}