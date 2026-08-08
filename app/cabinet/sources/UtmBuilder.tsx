"use client";

import { useMemo, useState } from "react";
import { transliterate } from "@/lib/slug";

// Channel presets: picking one fills utm_source + utm_medium with GA-consistent values, so the
// user never types raw markup. Medium follows the standard channel-type grouping (social / email
// / cpc / referral / offline); source is the specific platform.
const CHANNELS: Array<{ key: string; label: string; emoji: string; source: string; medium: string }> = [
  { key: "instagram", label: "Instagram", emoji: "📷", source: "instagram", medium: "social" },
  { key: "telegram", label: "Telegram", emoji: "✈️", source: "telegram", medium: "social" },
  { key: "vk", label: "ВКонтакте", emoji: "🅥", source: "vk", medium: "social" },
  { key: "youtube", label: "YouTube", emoji: "▶️", source: "youtube", medium: "social" },
  { key: "whatsapp", label: "WhatsApp", emoji: "💬", source: "whatsapp", medium: "social" },
  { key: "email", label: "Email-рассылка", emoji: "✉️", source: "email", medium: "email" },
  { key: "yandex", label: "Яндекс Директ", emoji: "🔎", source: "yandex", medium: "cpc" },
  { key: "website", label: "Сайт / блог", emoji: "🌐", source: "website", medium: "referral" },
  { key: "qr", label: "QR-код (офлайн)", emoji: "🔳", source: "qr", medium: "offline" },
];

// GA4 treats "Google" and "google" as different sources, so everything is lowercased; spaces and
// punctuation collapse to underscores to keep the link and the stats grouping clean. Cyrillic is
// transliterated because percent-encoded campaign names are unreadable once a link is shared and
// land mangled in third-party analytics that don't decode UTF-8 params.
function normalize(value: string): string {
  return transliterate(value)
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function UtmBuilder({ baseUrl }: { baseUrl: string }) {
  const [channelKey, setChannelKey] = useState<string>("instagram");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const channel = CHANNELS.find((c) => c.key === channelKey) ?? CHANNELS[0];

  const link = useMemo(() => {
    const params = new URLSearchParams();
    params.set("utm_source", channel.source);
    params.set("utm_medium", channel.medium);
    if (campaign.trim()) params.set("utm_campaign", normalize(campaign));
    if (content.trim()) params.set("utm_content", normalize(content));
    // URLSearchParams re-encodes the already-safe values; decode for a readable, copy-friendly link.
    return `${baseUrl}?${decodeURIComponent(params.toString())}`;
  }, [baseUrl, channel, campaign, content]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard denied — the link is visible to copy manually */
    }
  };

  return (
    <div className="glass-card mb-6 p-5">
      <div className="mb-1 text-sm font-semibold text-(--color-ink)">Сгенерировать ссылку с меткой</div>
      <p className="mb-4 text-sm text-(--color-muted)">
        Выберите канал, где публикуете ссылку — метки подставятся сами. Каждая запись по этой ссылке попадёт в статистику
        ниже.
      </p>

      {/* Channel presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CHANNELS.map((c) => {
          const active = c.key === channelKey;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setChannelKey(c.key)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
              style={
                active
                  ? { background: "var(--color-primary)", color: "#fff" }
                  : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }
              }
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Campaign + optional content */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-(--color-muted)">Кампания (необязательно)</label>
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="например, сторис_июль"
            className="w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-(--color-primary)"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-(--color-muted)">Вариант объявления (необязательно)</label>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="например, кнопка_в_шапке"
            className="w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-(--color-primary)"
          />
        </div>
      </div>

      {/* Live preview + copy */}
      <div className="rounded-xl bg-white/70 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">Ваша ссылка</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all text-[13px] text-(--color-text-secondary)">{link}</code>
          <button type="button" onClick={copy} className="btn-primary flex-none py-2 text-xs">
            {copied ? "Скопировано ✓" : "Скопировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
