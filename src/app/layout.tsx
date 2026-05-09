import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { FreighterProvider } from "@/context/FreighterContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barangay Pass — On-Chain Event Registration",
  description:
    "Register for barangay events on Stellar. Powered by Soroban smart contracts.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,800;1,9..144,300&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-900 text-white antialiased">
        <FreighterProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a26",
                color: "#fff",
                border: "1px solid #32324a",
                borderRadius: "8px",
                fontFamily: "DM Sans, sans-serif",
              },
            }}
          />
          {children}
        </FreighterProvider>
      </body>
    </html>
  );
}
