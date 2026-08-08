# -*- coding: utf-8 -*-
"""Генератор иконок Slotix. Оригинальный знак — полупрозрачное стекло; в 16-32 px
он превращается в бледное пятно, поэтому для иконок знак перерисован плотным
штрихом: лемниската (бесконечность) с галочкой в левой доле, белым по фирменному
градиенту. Запускать из корня фронтенда: python3 /tmp/genicons.py"""
from PIL import Image, ImageDraw
import math, os

SS = 12  # суперсэмплинг: PIL не сглаживает линии сам

def draw_mark(size, stroke_ratio=0.105, scale=0.94, yk=1.30, with_check=True):
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = max(2, int(S * stroke_ratio))
    cx = cy = S / 2
    a = (S - w) * scale / 2

    pts = []
    for i in range(361):
        t = math.radians(i)
        den = 1 + math.sin(t) ** 2
        pts.append((cx + a * math.cos(t) / den, cy + a * math.sin(t) * math.cos(t) / den * yk))
    d.line(pts, fill=(255, 255, 255, 255), width=w, joint="curve")
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0]-w/2, p[1]-w/2, p[0]+w/2, p[1]+w/2], fill=(255, 255, 255, 255))

    if with_check:
        lx, cw = cx - a * 0.50, a * 0.26
        check = [(lx - cw*0.80, cy + cw*0.02), (lx - cw*0.10, cy + cw*0.66), (lx + cw*1.00, cy - cw*0.78)]
        d.line(check, fill=(255, 255, 255, 255), width=int(w*0.92), joint="curve")
        for p in check:
            r = w * 0.92 / 2
            d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=(255, 255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)

def tile(size, radius_ratio=0.22, pad=0.15, **mark_kw):
    S = size * SS
    grad = Image.new("RGBA", (S, S))
    dd = ImageDraw.Draw(grad)
    for y in range(S):  # тот же градиент, что у кнопок: #66A6FF → #5094F0
        t = y / S
        dd.line([(0, y), (S, y)],
                fill=(int(0x66+(0x50-0x66)*t), int(0xA6+(0x94-0xA6)*t), int(0xFF+(0xF0-0xFF)*t), 255))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S-1, S-1], radius=int(S*radius_ratio), fill=255)
    bg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg.paste(grad, (0, 0), mask)
    bg = bg.resize((size, size), Image.LANCZOS)
    inner = int(size * (1 - pad * 2))
    m = draw_mark(inner, **mark_kw)
    bg.paste(m, ((size-inner)//2, (size-inner)//2), m)
    return bg

def report(path):
    print(f"  {path} — {os.path.getsize(path)//1024 or 1} КБ")

# 16 px: галочка не выживает, оставляем только петлю и штрих потолще
frames = [
    tile(16, radius_ratio=0.16, pad=0.08, stroke_ratio=0.155, with_check=False),
    tile(32, radius_ratio=0.17, pad=0.10, stroke_ratio=0.120),
    tile(48, radius_ratio=0.20, pad=0.13),
    tile(64, radius_ratio=0.22, pad=0.15),
]
frames[0].save("app/favicon.ico", format="ICO",
               sizes=[(16, 16), (32, 32), (48, 48), (64, 64)], append_images=frames[1:])
report("app/favicon.ico")

tile(32, radius_ratio=0.17, pad=0.10, stroke_ratio=0.120).save("app/icon.png"); report("app/icon.png")

apple = Image.new("RGB", (180, 180), "#5094F0")
t180 = tile(180)
apple.paste(t180, (0, 0), t180)      # iOS не умеет прозрачность — подложка обязательна
apple.save("app/apple-icon.png"); report("app/apple-icon.png")

tile(192).save("public/slotix/icon-192.png"); report("public/slotix/icon-192.png")
tile(512).save("public/slotix/icon-512.png"); report("public/slotix/icon-512.png")

# маскируемая иконка Android: система сама обрежет под свою форму, знак держим в центре
mask512 = tile(512, radius_ratio=0.5, pad=0.28)
flat = Image.new("RGB", (512, 512), "#5094F0")
flat.paste(mask512, (0, 0), mask512)
flat.save("public/slotix/icon-maskable-512.png"); report("public/slotix/icon-maskable-512.png")
