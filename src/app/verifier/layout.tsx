import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ai-je besoin d'une déclaration préalable ? Vérification gratuite",
  description: "Votre adresse et vos travaux : en une minute, sachez s'il faut une déclaration préalable ou un permis de construire, avec les règles de votre commune.",
  alternates: { canonical: "/verifier/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
