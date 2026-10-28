import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rental Agent",
  description: "Brokers help you sign. Rental Agent stays with you while you rent in NYC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
