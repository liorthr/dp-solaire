// Envoi d'email via Resend (mode serveur) : déclenché uniquement après confirmation explicite de l'utilisateur dans l'interface.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return NextResponse.json({ error: "Envoi non configuré (RESEND_API_KEY, MAIL_FROM)" }, { status: 501 });
  const form = await req.formData();
  const to = String(form.get("to") ?? "");
  const subject = String(form.get("subject") ?? "");
  const body = String(form.get("body") ?? "");
  const pdf = form.get("pdf");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
  const attachments = pdf instanceof Blob ? [{ filename: (pdf as File).name || "dossier.pdf", content: Buffer.from(await pdf.arrayBuffer()).toString("base64") }] : [];
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text: body, attachments }),
  });
  const j = await r.json();
  if (!r.ok) return NextResponse.json({ error: j.message ?? "Erreur d'envoi" }, { status: 502 });
  console.info(JSON.stringify({ event: "mail_sent", id: j.id }));
  return NextResponse.json({ id: j.id });
}
