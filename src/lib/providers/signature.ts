// Signature électronique : interface abstraite + implémentation simple (tracé + horodatage + empreinte SHA-256).
// Point d'extension : YousignProvider / DocusignProvider (signature avancée, open-questions Q14).
import type { SignatureRecord } from "@/lib/types";

export interface SignatureRequest {
  signerName: string;
  /** contenu signé (texte canonique du mandat ou de la déclaration) */
  document: string;
  imageDataUrl: string;
}

export interface SignatureProvider {
  id: SignatureRecord["provider"];
  label: string;
  available: boolean;
  sign(req: SignatureRequest): Promise<SignatureRecord>;
}

export async function sha256Hex(text: string | Uint8Array): Promise<string> {
  const bytes = typeof text === "string" ? new TextEncoder().encode(text) : text;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const simpleSignatureProvider: SignatureProvider = {
  id: "simple",
  label: "Signature simple (tracé manuscrit, horodatage, empreinte SHA-256)",
  available: true,
  async sign({ signerName, document, imageDataUrl }) {
    if (!signerName.trim()) throw new Error("Nom du signataire requis");
    if (!imageDataUrl.startsWith("data:image/")) throw new Error("Signature manuscrite requise");
    return {
      provider: "simple",
      signerName: signerName.trim(),
      signedAt: new Date().toISOString(),
      imageDataUrl,
      documentSha256: await sha256Hex(document),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  },
};

export const yousignProvider: SignatureProvider = {
  id: "yousign",
  label: "Yousign (signature avancée) : nécessite YOUSIGN_API_KEY côté serveur",
  available: false,
  async sign() {
    throw new Error("Yousign non configuré");
  },
};

export const signatureProviders = [simpleSignatureProvider, yousignProvider];
