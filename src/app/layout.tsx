import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DP Solaire : déclaration préalable photovoltaïque automatisée",
  description: "Dossier de déclaration préalable de travaux pour installations photovoltaïques en toiture, généré automatiquement à partir des données publiques.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f3d2e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
