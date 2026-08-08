"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type TeamPage, type TeamPageFormat, type PersonRef, type VideoProvider, type TimeSlot } from "@/lib/api";
import { getAttribution } from "@/lib/attribution";

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  yandex_telemost: "Яндекс Телемост",
  google_meet: "Google Meet",
  zoom: "Zoom",
  phone: "Телефон",
};

function rub(kopecks: number) {
  return kopecks > 0 ? `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽` : "Бесплатно";
}

function Avatar({ p, size = 40 }: { p: PersonRef; size?: number }) {
  if (p.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatarUrl} alt="" style={{ width: size, height: size }} className="flex-none rounded-full object-cover" />;
  }
  return (
    <div className="flex flex-none items-center justify-center rounded-full font-bold text-(--color-link)" style={{ width: size, height: size, boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)", fontSize: size * 0.38 }}>
      {(p.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

function next14Days(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    out.push({
      iso: d.toLocaleDateString("en-CA"),
      label: d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return out;
}

export function TeamBookingView({ page, slug }: { page: TeamPage; slug: string }) {
  const [format, setFormat] = useState<TeamPageFormat | null>(null);

  if (format) {
    return <FormatBooking page={page} slug={slug} format={format} onBack={() => setFormat(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="glass-card p-8">
        <div className="mb-1 text-[24px] font-bold text-(--color-ink)">{page.org.name}</div>
        <div className="mb-6 text-sm text-(--color-muted)">Выберите услугу, чтобы записаться</div>
        {page.formats.length === 0 ? (
          <div className="text-sm text-(--color-muted)">Пока нет доступных форматов.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {page.formats.map((f) => (
              <button key={f.id} type="button" onClick={() => setFormat(f)} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 text-left transition-colors hover:border-(--color-primary)">
                <div className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: f.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-(--color-ink)">{f.name}</div>
                  <div className="text-xs text-(--color-muted)">{f.durationMin} мин · {rub(f.priceKopecks)}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-(--color-faint)"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 text-center text-xs text-(--color-faint)">Работает на SLOTIX</div>
    </div>
  );
}

function FormatBooking({ page, slug, format, onBack }: { page: TeamPage; slug: string; format: TeamPageFormat; onBack: () => void }) {
  const days = useMemo(next14Days, []);
  const [mode, setMode] = useState<"time" | "specialist">("time");
  const [host, setHost] = useState<PersonRef | null>(null);
  const [date, setDate] = useState(days[0].iso);
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hostId = mode === "specialist" ? host?.id : undefined;
  const ready = mode === "time" || (mode === "specialist" && host);

  useEffect(() => {
    if (!ready) return;
    setSlots(null);
    setSlot(null);
    const params = new URLSearchParams({ date });
    if (hostId) params.set("hostId", hostId);
    api
      .get<TimeSlot[]>(`/api/public/team/${encodeURIComponent(slug)}/${format.id}/slots?${params}`)
      .then((s) => setSlots(s))
      .catch(() => setSlots([]));
  }, [date, hostId, ready, slug, format.id]);

  if (booked) {
    return (
      <div className="mx-auto w-full max-w-[480px]">
        <div className="glass-card p-9 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(63,203,110,.15)", color: "var(--color-success)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div className="text-lg font-bold text-(--color-ink)">Вы записаны!</div>
          <div className="mt-1 text-sm text-(--color-muted)">Детали и ссылку отправили на почту.</div>
        </div>
      </div>
    );
  }

  if (slot) {
    return <ClientForm page={page} slug={slug} format={format} startAt={slot} hostId={hostId} onBack={() => setSlot(null)} onDone={() => setBooked(true)} />;
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-(--color-muted)">← К услугам</button>
      <div className="glass-card p-7">
        <div className="mb-1 text-[19px] font-bold text-(--color-ink)">{format.name}</div>
        <div className="mb-5 text-sm text-(--color-muted)">{format.durationMin} мин · {rub(format.priceKopecks)}</div>

        {format.allowHostPick && format.hosts.length > 1 && (
          <div className="mb-5 flex gap-2">
            <button type="button" onClick={() => { setMode("time"); setHost(null); }} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={mode === "time" ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>Выбрать время</button>
            <button type="button" onClick={() => setMode("specialist")} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={mode === "specialist" ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>Выбрать специалиста</button>
          </div>
        )}

        {mode === "specialist" && (
          <div className="mb-5">
            <div className="mb-2 text-xs font-semibold text-(--color-muted)">Специалист</div>
            <div className="flex flex-wrap gap-2">
              {format.hosts.map(({ user }) => (
                <button key={user.id} type="button" onClick={() => setHost(user)} className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium" style={host?.id === user.id ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>
                  <Avatar p={user} size={26} />
                  {user.name ?? "Специалист"}
                </button>
              ))}
            </div>
          </div>
        )}

        {ready && (
          <>
            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
              {days.map((d) => (
                <button key={d.iso} type="button" onClick={() => setDate(d.iso)} className="flex-none whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold" style={date === d.iso ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>{d.label}</button>
              ))}
            </div>
            {slots === null ? (
              <div className="py-6 text-center text-sm text-(--color-muted)">Загрузка…</div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center text-sm text-(--color-muted)">На этот день нет свободного времени.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button key={s.start} type="button" onClick={() => setSlot(s.start)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--color-primary)", color: "var(--color-link)", background: "rgba(255,255,255,.7)" }}>
                    {new Date(s.start).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: tz })}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ClientForm({ page, slug, format, startAt, hostId, onBack, onDone }: { page: TeamPage; slug: string; format: TeamPageFormat; startAt: string; hostId?: string; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<VideoProvider>(format.providers[0]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<{ paymentUrl?: string }>(`/api/public/team/${encodeURIComponent(slug)}/${format.id}/book`, {
        clientName: name.trim(),
        clientEmail: email.trim(),
        clientComment: comment.trim() || undefined,
        startAt,
        clientTimezone: tz,
        provider,
        clientPhone: provider === "phone" ? phone.trim() : undefined,
        hostUserId: hostId,
        utm: getAttribution(),
      });
      if (created.paymentUrl) {
        window.location.href = created.paymentUrl;
        return;
      }
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось записаться");
      setBusy(false);
    }
  };

  const valid = name.trim() && /.+@.+/.test(email) && (provider !== "phone" || phone.trim());

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-(--color-muted)">← Выбрать другое время</button>
      <div className="glass-card p-7">
        <div className="mb-1 text-lg font-bold text-(--color-ink)">{format.name}</div>
        <div className="mb-5 text-sm text-(--color-muted)">
          {new Date(startAt).toLocaleString("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz })}
        </div>
        {error && <div className="mb-3 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>{error}</div>}
        <div className="flex flex-col gap-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)" />
          {format.providers.length > 1 && (
            <select value={provider} onChange={(e) => setProvider(e.target.value as VideoProvider)} className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)">
              {format.providers.map((p) => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
            </select>
          )}
          {provider === "phone" && <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)" />}
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий (необязательно)" rows={2} className="resize-y rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)" />
          <button type="button" onClick={submit} disabled={busy || !valid} className="btn-primary disabled:opacity-50">{busy ? "Записываем…" : "Записаться"}</button>
        </div>
      </div>
    </div>
  );
}
