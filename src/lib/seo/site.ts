// Constantes SEO partagées (URL canonique, nom, offres) et données structurées schema.org.
import { PRICES } from "@/lib/cloud/prices";

export const SITE_URL = "https://permizy.com";
export const SITE_NAME = "Permizy";
export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const OFFERS = [
  { name: "Dossier de déclaration préalable", price: PRICES.DP },
  { name: "Dossier de permis de construire", price: PRICES.PC },
  { name: "Dossier solaire agricole", price: PRICES.AGRI },
];

/** pages officielles de Permizy sur les réseaux sociaux : ne renseigner que des URL réelles fournies par l'éditeur */
export const SOCIAL: { label: string; url: string }[] = [
  // { label: "Facebook", url: "https://www.facebook.com/…" },
];

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs("/icon-512.png"),
  vatID: "FR48109443754",
  foundingDate: "2026-09-02",
  address: { "@type": "PostalAddress", streetAddress: "47 rue Vivienne", postalCode: "75002", addressLocality: "Paris", addressCountry: "FR" },
  ...(SOCIAL.length ? { sameAs: SOCIAL.map((x) => x.url) } : {}),
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "fr-FR",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Préparation de dossiers de déclaration préalable et de permis de construire",
  serviceType: "Dossier d'autorisation d'urbanisme",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: { "@type": "Country", name: "France" },
  offers: OFFERS.map((o) => ({ "@type": "Offer", name: o.name, price: String(o.price), priceCurrency: "EUR", url: abs("/tarifs/") })),
};

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

export const faqLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
