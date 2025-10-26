import type { MetadataRoute } from "next";

const { appName, description } = {
  appName: "AnchorLabs",
  description:
    "AnchorLabs is a visual developer tool for Solana Anchor programs. Upload your IDL, connect your wallet, and instantly explore accounts, test instructions, and debug transactions with an intuitive interface designed for rapid development and testing.",
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: description,
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}