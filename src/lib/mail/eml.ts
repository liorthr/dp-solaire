// Génération d'un message .eml (MIME) avec pièces jointes : ouvrable dans toute messagerie, envoi par l'utilisateur.
function b64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/.{76}/g, "$&\r\n");
}
const encWord = (s: string) => `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;

export function buildEml(opts: { from?: string; to: string; subject: string; body: string; attachments: { name: string; bytes: Uint8Array; type?: string }[] }) {
  const boundary = `dp-${Math.random().toString(36).slice(2)}`;
  const lines = [
    opts.from ? `From: ${opts.from}` : "",
    `To: ${opts.to}`,
    `Subject: ${encWord(opts.subject)}`,
    "MIME-Version: 1.0",
    "X-Unsent: 1",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(new TextEncoder().encode(opts.body)),
  ].filter((l, i) => l !== "" || i > 0);
  for (const a of opts.attachments) {
    lines.push(`--${boundary}`, `Content-Type: ${a.type ?? "application/pdf"}; name="${encWord(a.name)}"`, "Content-Transfer-Encoding: base64", `Content-Disposition: attachment; filename="${encWord(a.name)}"`, "", b64(a.bytes));
  }
  lines.push(`--${boundary}--`, "");
  return new Blob([lines.join("\r\n")], { type: "message/rfc822" });
}

export const mailtoLink = (to: string, subject: string, body: string) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1500))}`;
