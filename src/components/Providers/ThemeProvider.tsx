"use client";

import '@solana/wallet-adapter-react-ui/styles.css';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ComponentProps, useEffect, useState } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="anchor-studio-theme"
      disableTransitionOnChange
      themes={["light", "dark", "solana"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
