"use client";

import { neueMontreal } from "@/fonts/fonts";
import { motion } from "framer-motion";

export default function WelcomeAnimation() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <h1
            className={`${neueMontreal} text-6xl md:text-7xl font-bold text-center text-primary`}
          >
            AnchorLabs
          </h1>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-xl md:text-2xl font-medium text-center text-muted-foreground"
        >
          Test Solana programs in your browser
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.4,
            ease: "easeOut",
          }}
          className="mt-4"
        >
          <div className="flex gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="size-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="size-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="size-2 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}