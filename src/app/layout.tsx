import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permizy : vos travaux, le oui de la mairie, sans la paperasse",
  description: "Panneaux solaires, pompe à chaleur, fenêtres, isolation : Permizy vérifie les règles de votre commune, dessine les plans, remplit le cerfa et prépare l'envoi à la mairie.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f6b4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
