#!/usr/bin/env node
// Vidéo pédagogique programmatique : scènes HTML rendues par Playwright, voix off française (edge-tts),
// assemblage FFmpeg en 16:9 et 9:16, sous-titres WebVTT, miniature. Usage :
//   node scripts/video/make-video.mjs scripts/video/scripts/<sujet>.json
// Sorties : public/videos/<slug>/{video.mp4, vertical.mp4, poster.jpg, captions.vtt} et src/data/seo/videos/<slug>.json
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const VOICE = process.env.PERMIZY_VOICE ?? "fr-FR-RemyMultilingualNeural";
const PAD = 0.5; // silence après chaque scène (s)
const spec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const root = resolve(import.meta.dirname, "../..");
const out = join(root, "public", "videos", spec.slug);
const work = mkdtempSync(join(tmpdir(), "permizy-video-"));
mkdirSync(out, { recursive: true });
const font = join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function sceneHtml(sc, i, n, w, h) {
  const vertical = h > w;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url(file://${font})}
  *{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;background:#faf6ee;font-family:Inter,sans-serif;color:#13201a;display:flex;flex-direction:column;justify-content:center;padding:${vertical ? "120px 90px" : "90px 140px"};position:relative}
  .k{display:inline-block;background:#dff3e6;color:#1f6b4a;font-weight:800;font-size:${vertical ? 46 : 40}px;padding:14px 30px;border-radius:999px;align-self:flex-start}
  h1{font-size:${vertical ? 104 : 96}px;line-height:1.05;margin:${vertical ? 50 : 36}px 0 ${vertical ? 50 : 40}px;font-weight:800;letter-spacing:-2px}
  li{font-size:${vertical ? 54 : 48}px;margin:18px 0;list-style:none;padding-left:56px;position:relative;color:#2a3a32}
  li:before{content:"";position:absolute;left:0;top:.35em;width:30px;height:30px;border-radius:50%;background:#1f6b4a}
  ul{padding:0;margin:0}
  .logo{position:absolute;${vertical ? "top:70px" : "top:56px"};left:${vertical ? 90 : 140}px;font-size:40px;font-weight:800}.logo b{color:#1f6b4a}
  .bar{position:absolute;bottom:0;left:0;height:14px;background:#1f6b4a;width:${Math.round(((i + 1) / n) * 100)}%}
  .src{position:absolute;bottom:40px;right:${vertical ? 90 : 140}px;font-size:24px;color:#5d6b63}
  </style></head><body><div class="logo">permiz<b>y</b></div><span class="k">${esc(sc.kicker)}</span><h1>${esc(sc.title)}</h1><ul>${sc.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><div class="src">Sources : notices et fiches officielles · schéma non officiel</div><div class="bar"></div></body></html>`;
}

const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const vtt = (t) => new Date(t * 1000).toISOString().slice(11, 23);

const browser = await chromium.launch();
const cues = [];
let t = 0;
const formats = [["video", 1920, 1080], ["vertical", 1080, 1920]];
const segs = { video: [], vertical: [] };
for (const [i, sc] of spec.scenes.entries()) {
  const mp3 = join(work, `s${i}.mp3`);
  execFileSync("python3", ["-m", "edge_tts", ...(process.env.HTTPS_PROXY ? ["--proxy", process.env.HTTPS_PROXY] : []), "--voice", VOICE, "--rate", "+4%", "--text", sc.say, "--write-media", mp3], { env: { ...process.env, SSL_CERT_FILE: existsSync("/root/.ccr/ca-bundle.crt") ? "/root/.ccr/ca-bundle.crt" : process.env.SSL_CERT_FILE ?? "" } });
  const d = dur(mp3) + PAD;
  cues.push({ start: t, end: t + d - PAD / 2, text: sc.say });
  t += d;
  for (const [name, w, h] of formats) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const html = join(work, `s${i}-${name}.html`);
    writeFileSync(html, sceneHtml(sc, i, spec.scenes.length, w, h));
    await page.goto(`file://${html}`);
    await page.waitForTimeout(150);
    const png = join(work, `s${i}-${name}.png`);
    await page.screenshot({ path: png });
    await page.close();
    if (i === 0 && name === "video") execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", "scale=1280:720", "-q:v", "3", join(out, "poster.jpg")]);
    const seg = join(work, `s${i}-${name}.mp4`);
    // image fixe + léger fondu d'entrée/sortie, audio complété de silence
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-framerate", "25", "-i", png, "-i", mp3, "-filter_complex", `[0:v]scale=${w}:${h},format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${(d - 0.25).toFixed(2)}:d=0.25[v];[1:a]apad=pad_dur=${PAD},aresample=44100[a]`, "-map", "[v]", "-map", "[a]", "-t", d.toFixed(3), "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-tune", "stillimage", "-c:a", "aac", "-b:a", "96k", "-ar", "44100", seg]);
    segs[name].push(seg);
  }
}
await browser.close();
for (const [name] of formats) {
  const list = join(work, `${name}.txt`);
  writeFileSync(list, segs[name].map((s) => `file '${s}'`).join("\n"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", join(out, `${name}.mp4`)]);
}
writeFileSync(join(out, "captions.vtt"), "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${vtt(c.start)} --> ${vtt(c.end)}\n${c.text}\n`).join("\n"));
const meta = { slug: spec.slug, title: spec.title, description: spec.description, guide: spec.guide, durationSec: Math.round(t), uploadDate: new Date().toISOString().slice(0, 10), voice: VOICE, transcript: spec.scenes.map((s) => s.say), sources: spec.sources };
mkdirSync(join(root, "src/data/seo/videos"), { recursive: true });
writeFileSync(join(root, "src/data/seo/videos", `${spec.slug}.json`), JSON.stringify(meta, null, 2) + "\n");
console.log(`OK ${spec.slug} : ${Math.round(t)} s → public/videos/${spec.slug}/`);
