import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://permizy.com"),
  title: {
    default: "Déclaration préalable et permis de construire en ligne | Permizy",
    template: "%s | Permizy",
  },
  description: "Déclaration préalable de travaux en ligne : panneaux solaires, pompe à chaleur, fenêtres, isolation, extension. Règles de votre commune, plans, cerfa rempli. Dès 49 €.",
  applicationName: "Permizy",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Permizy",
    url: "/",
    title: "Déclaration préalable et permis de construire en ligne",
    description: "Règles de votre commune, plans, cerfa rempli et envoi à la mairie : votre dossier prêt à déposer.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Permizy : vos travaux, le oui de la mairie, sans la paperasse" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f6b4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
