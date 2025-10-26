"use client";

import { neueMontreal } from "@/fonts/fonts";
import { useEffect, useState } from "react";

export default function WelcomeAnimation() {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
    }, 100); // Small delay to trigger animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div
        className={`transition-all duration-1000 ease-in-out ${
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1
          className={`${neueMontreal} text-6xl font-medium text-center text-primary`}
        >
          AnchorLabs
        </h1>
        <h2 className="text-2xl font-medium text-center mt-4">
          Test solana programs in your browser
        </h2>
      </div>
    </div>
  );
}
