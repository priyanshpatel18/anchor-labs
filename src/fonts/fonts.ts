import { Montserrat, Syne } from "next/font/google";
import localFont from "next/font/local";
const syneFont = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const montserratFont = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
})

export const montserrat = montserratFont.className;

export const syne = syneFont.className;

const neueMontrealFont = localFont({
  src: [
    {
      path: "../../public/NeueMontreal-Regular.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal",
});

export const neueMontreal = neueMontrealFont.className;