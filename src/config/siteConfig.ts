import { Metadata } from "next";

const { title, description, ogImage, baseURL } = {
  title: "AnchorLabs",
  description:
    "AnchorLabs is a visual developer tool for Solana Anchor programs. Upload your IDL, connect your wallet, and instantly explore accounts, test instructions, and debug transactions with an intuitive interface designed for rapid development and testing.",
  baseURL: "https://anchorlabs.solixdb.xyz",
  ogImage: `https://anchorlabs.solixdb.xyz/open-graph.png`,
};

export const siteConfig: Metadata = {
  title,
  description,
  metadataBase: new URL(baseURL),
  openGraph: {
    title,
    description,
    images: [ogImage],
    url: baseURL,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "AnchorLabs",
  alternates: {
    canonical: baseURL,
  },
  keywords: [
    "Anchor Program",
    "Solana Development",
    "IDL Explorer",
    "Anchor Devtools",
    "Solana Debugging",
    "Program Accounts",
    "Anchor Instructions",
    "Solana Testing",
  ],
};