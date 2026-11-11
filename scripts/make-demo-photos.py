# Génère des photos d'ILLUSTRATION pour les dossiers de démo (aucune photo réelle des adresses n'est utilisée).
# Usage : python3 scripts/make-demo-photos.py
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

W, H = 1600, 1200
OUT = "public/demo"

def noise(img, amt=10, seed=0):
    rng = np.random.default_rng(seed)
    a = np.asarray(img).astype(np.int16)
    a = a + rng.integers(-amt, amt + 1, a.shape, dtype=np.int16)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def sky_ground(d, horizon):
    for y in range(H):
        if y < horizon:
            t = y / horizon
            c = (int(120 + 90 * t), int(170 + 60 * t), int(225 + 20 * t))
        else:
            t = (y - horizon) / (H - horizon)
            c = (int(95 - 30 * t), int(140 - 40 * t), int(70 - 20 * t))
        d.line([(0, y), (W, y)], fill=c)

def tree(d, x, y, r, seed):
    rnd = random.Random(seed)
    d.rectangle([x - r * 0.12, y, x + r * 0.12, y + r * 1.4], fill=(90, 65, 40))
    for i in range(14):
        dx, dy = rnd.uniform(-r, r), rnd.uniform(-r * 1.2, r * 0.3)
        rr = rnd.uniform(r * 0.4, r * 0.75)
        g = rnd.randint(85, 130)
        d.ellipse([x + dx - rr, y + dy - rr, x + dx + rr, y + dy + rr], fill=(40, g, 45))

def house(d, x0, y0, w, h, roof_h, wall=(232, 220, 196), roof=(150, 70, 50), seed=1):
    # façade
    d.rectangle([x0, y0, x0 + w, y0 + h], fill=wall, outline=(160, 150, 130), width=3)
    # toiture (vue de face : pan avant trapézoïdal)
    d.polygon([(x0 - 30, y0), (x0 + w + 30, y0), (x0 + w - 90, y0 - roof_h), (x0 + 90, y0 - roof_h)], fill=roof, outline=(110, 50, 35))
    for i in range(1, 12):
        yy = y0 - roof_h * i / 12
        inset = 30 + (90 + 30) * i / 12 - 30
        d.line([(x0 - 30 + inset, yy), (x0 + w + 30 - inset, yy)], fill=(125, 58, 42), width=2)
    # fenêtres et porte
    ww = w / 7
    for k in (1, 3, 5):
        d.rectangle([x0 + ww * k, y0 + h * 0.2, x0 + ww * (k + 0.8), y0 + h * 0.5], fill=(70, 90, 110), outline=(250, 250, 250), width=6)
    d.rectangle([x0 + ww * 3, y0 + h * 0.55, x0 + ww * 3.8, y0 + h], fill=(120, 80, 50))
    d.rectangle([x0 + w * 0.75, y0 - roof_h * 0.85, x0 + w * 0.8, y0 - roof_h * 0.35], fill=(170, 80, 60))

def watermark(img, text):
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
    except Exception:
        f = ImageFont.load_default()
    d.rectangle([0, H - 60, W, H], fill=(0, 0, 0))
    d.text((24, H - 50), text, fill=(255, 255, 255), font=f)

def facade(name, roof, wall, seed):
    img = Image.new("RGB", (W, H)); d = ImageDraw.Draw(img)
    sky_ground(d, 820)
    tree(d, 170, 640, 140, seed); tree(d, 1460, 620, 160, seed + 1)
    house(d, 330, 520, 940, 380, 300, wall=wall, roof=roof, seed=seed)
    img = noise(img.filter(ImageFilter.GaussianBlur(0.6)), 8, seed)
    watermark(img, "ILLUSTRATION DÉMO – façade avec toiture (photo de synthèse)")
    img.resize((2000, 1500), Image.LANCZOS).save(f"{OUT}/{name}-facade.jpg", quality=86)

def proche(name, seed):
    img = Image.new("RGB", (W, H)); d = ImageDraw.Draw(img)
    sky_ground(d, 700)
    for i, x in enumerate([60, 560, 1080]):
        house(d, x, 520, 420, 220, 150, wall=[(225, 214, 190), (210, 205, 200), (235, 225, 205)][i], roof=[(150, 70, 50), (90, 90, 95), (155, 75, 55)][i], seed=seed + i)
    d.polygon([(0, 900), (W, 900), (W, H), (0, H)], fill=(80, 80, 85))
    img = noise(img.filter(ImageFilter.GaussianBlur(0.6)), 8, seed)
    watermark(img, "ILLUSTRATION DÉMO – environnement proche (photo de synthèse)")
    img.resize((2000, 1500), Image.LANCZOS).save(f"{OUT}/{name}-proche.jpg", quality=86)

def lointain(name, seed):
    img = Image.new("RGB", (W, H)); d = ImageDraw.Draw(img)
    sky_ground(d, 560)
    rnd = random.Random(seed)
    for i in range(14):
        x = rnd.randint(0, W - 120); s = rnd.uniform(0.25, 0.45)
        house(d, x, 600 + rnd.randint(-20, 30), 300 * s * 2, 140 * s * 2, 100 * s * 2, roof=(150, 70, 50) if i % 3 else (90, 90, 95), seed=i)
    for i in range(10): tree(d, rnd.randint(0, W), 560 + rnd.randint(0, 60), rnd.randint(40, 70), seed + i)
    img = noise(img.filter(ImageFilter.GaussianBlur(0.8)), 8, seed)
    watermark(img, "ILLUSTRATION DÉMO – paysage lointain (photo de synthèse)")
    img.resize((2000, 1500), Image.LANCZOS).save(f"{OUT}/{name}-lointain.jpg", quality=86)

for i, (name, roof, wall) in enumerate([("sans-contrainte", (150, 70, 50), (232, 220, 196)), ("abf", (85, 88, 95), (215, 205, 190)), ("plu-restrictif", (145, 75, 55), (225, 222, 210))]):
    facade(name, roof, wall, 10 + i); proche(name, 20 + i); lointain(name, 30 + i)
# photo volontairement sombre et floue pour démontrer le contrôle qualité
img = Image.open(f"{OUT}/sans-contrainte-facade.jpg").filter(ImageFilter.GaussianBlur(9)).point(lambda v: v * 0.25)
img.save(f"{OUT}/exemple-photo-sombre-floue.jpg", quality=80)
print("ok")
