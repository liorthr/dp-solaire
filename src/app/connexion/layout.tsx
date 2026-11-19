import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: true }, alternates: { canonical: "/connexion/" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
