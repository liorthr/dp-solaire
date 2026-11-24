import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://permizy.com"),
  title: {
    default: "Déclaration préalable et permis de construire dès 49 € | Permizy",
    template: "%s | Permizy",
  },
  description: "Déclaration préalable ou permis de construire en ligne, à partir de 49 € : solaire, pompe à chaleur, fenêtres, isolation, extension. Cerfa rempli.",
  applicationName: "Permizy",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Permizy",
    url: "/",
    title: "Déclaration préalable et permis de construire en ligne, dès 49 €",
    description: "Vérification gratuite, puis dossier complet à partir de 49 € : règles de votre commune, plans, cerfa rempli, prêt à déposer en mairie.",
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
