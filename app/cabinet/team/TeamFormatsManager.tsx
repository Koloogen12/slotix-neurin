"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type Team, type TeamFormat, type VideoProvider } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { useConfirm } from "@/components/confirm-dialog";

const PROVIDERS: Array<{ value: VideoProvider; label: string }> = [
  { value: "yandex_telemost", label: "Телемост" },
  { value: "google_meet", label: "Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "phone", label: "Телефон" },
];

export function TeamFormatsManager({ team, onTeamChange }: { team: Team; onTeamChange: (t: Team) => void }) {
  const confirm = useConfirm();
  const [formats, setFormats] = useState<TeamFormat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.get<TeamFormat[]>("/api/team/formats").then(setFormats).catch((e) => setError(e instanceof ApiError ? e.message : "Ошибка"));
  useEffect(() => {
    load();
  }, []);

  const run = async (p: Promise<TeamFormat[]>) => {
    setBusy(true);
    setError(null);
    try {
      setFormats(await p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <TeamPageLink team={team} onTeamChange={onTeamChange} setError={setError} />

      {error && <div className="glass-card p-4 text-sm" style={{ color: "var(--color-danger)" }}>{error}</div>}

      {!creating && (
        <button type="button" onClick={() => setCreating(true)} className="btn-primary self-start">
          ➕ Создать формат команды
        </button>
      )}

      {creating && (
        <CreateFormatForm
          team={team}
          busy={busy}
          onCreate={(dto) => run(api.post<TeamFormat[]>("/api/team/formats", dto)).then(() => setCreating(false))}
          onCancel={() => setCreating(false)}
        />
      )}

      {formats && formats.length > 0 && (
        <div className="glass-card p-0">
          {formats.map((f, i) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-4" style={{ borderTop: i === 0 ? "none" : "1px solid rgba(20,30,45,.05)" }}>
              <div className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: f.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-(--color-ink)">{f.name}</div>
                <div className="truncate text-xs text-(--color-muted)">
                  {f.durationMin} мин · {f.priceKopecks > 0 ? `${Math.round(f.priceKopecks / 100)} ₽` : "бесплатно"} ·{" "}
                  {f.schedulingType === "round_robin" ? "любой свободный" : "совместная"} · {f.hosts.length} спец.
                  {f.allowHostPick ? " · выбор спеца" : ""}
                </div>
              </div>
              <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={f.status === "live" ? { color: "var(--color-success)", background: "var(--color-success-bg)" } : { color: "var(--color-muted)", background: "rgba(92,110,125,.12)" }}>
                {f.status === "live" ? "Опубликован" : "Черновик"}
              </span>
              <button type="button" disabled={busy} onClick={() => run(api.post<TeamFormat[]>(`/api/team/formats/${f.id}/${f.status === "live" ? "unpublish" : "publish"}`))} className="text-xs font-medium text-(--color-link)">
                {f.status === "live" ? "Снять" : "Опубликовать"}
              </button>
              <button type="button" disabled={busy} onClick={async () => { if (await confirm({ title: `Удалить «${f.name}»?`, description: "Клиенты больше не смогут записаться на этот формат." })) run(api.delete<TeamFormat[]>(`/api/team/formats/${f.id}`)); }} className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
      {formats && formats.length === 0 && !creating && (
        <div className="glass-card p-8 text-center text-sm text-(--color-muted)">Пока нет командных форматов.</div>
      )}
    </div>
  );
}

function TeamPageLink({ team, onTeamChange, setError }: { team: Team; onTeamChange: (t: Team) => void; setError: (e: string | null) => void }) {
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const host = typeof window !== "undefined" ? window.location.origin : "https://slotix.neurin.tech";

  // The server transliterates before saving ("студия" → "studiya"), so show the real result
  // up front instead of letting the user discover it after claiming.
  const normalized = slugify(slug);

  const claim = async () => {
    setBusy(true);
    setError(null);
    try {
      const t = await api.patch<Team>("/api/team/slug", { slug: slug.trim() });
      onTeamChange(t);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось занять адрес");
    } finally {
      setBusy(false);
    }
  };

  if (team.org.slug) {
    const url = `${host}/t/${team.org.slug}`;
    return (
      <div className="glass-card p-5">
        <div className="mb-1 text-sm font-semibold text-(--color-ink)">Страница студии</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-white/70 px-3 py-2 text-[13px] text-(--color-text-secondary)">{url}</code>
          <button type="button" onClick={() => { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }} className="btn-secondary py-2 text-xs">
            {copied ? "Скопировано" : "Скопировать"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-1 text-sm font-semibold text-(--color-ink)">Адрес страницы студии</div>
      <p className="mb-3 text-sm text-(--color-muted)">Займите адрес — по нему клиенты будут записываться в студию. Можно писать по-русски, мы переведём в латиницу.</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-(--color-muted)">{host}/t/</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="studiya" className="min-w-[140px] flex-1 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-(--color-primary)" />
        <button type="button" onClick={claim} disabled={busy || normalized.length < 2} className="btn-primary py-2 text-sm disabled:opacity-50">Занять</button>
      </div>
      {slug.trim().length > 0 && normalized !== slug.trim().toLowerCase() && (
        <p className="mt-2 text-xs text-(--color-muted)">
          {normalized.length >= 2 ? <>Адрес будет: <code className="text-(--color-ink)">{host}/t/{normalized}</code></> : "В адресе можно использовать только буквы, цифры и дефис"}
        </p>
      )}
    </div>
  );
}

function CreateFormatForm({ team, busy, onCreate, onCancel }: { team: Team; busy: boolean; onCreate: (dto: unknown) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [rubles, setRubles] = useState(0);
  const [providers, setProviders] = useState<Set<VideoProvider>>(new Set(["yandex_telemost"]));
  const [schedulingType, setSchedulingType] = useState<"round_robin" | "collective">("round_robin");
  const [allowHostPick, setAllowHostPick] = useState(true);
  const [hosts, setHosts] = useState<Set<string>>(new Set(team.members.map((m) => m.id)));

  const toggle = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };

  const valid = useMemo(() => name.trim() && providers.size > 0 && hosts.size > 0, [name, providers, hosts]);

  const submit = () =>
    onCreate({
      name: name.trim(),
      durationMin,
      priceKopecks: Math.round(rubles * 100),
      color: "#5094f0",
      providers: [...providers],
      schedulingType,
      allowHostPick,
      hostUserIds: [...hosts],
    });

  return (
    <div className="glass-card flex flex-col gap-3 p-6">
      <div className="text-lg font-bold text-(--color-ink)">Новый формат команды</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название (напр. Консультация 50 мин)" className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)" />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-(--color-muted)">Длительность (мин)
          <input type="number" min={15} step={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-(--color-primary)" />
        </label>
        <label className="text-xs font-semibold text-(--color-muted)">Цена, ₽ (0 = бесплатно)
          <input type="number" min={0} value={rubles} onChange={(e) => setRubles(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-(--color-primary)" />
        </label>
      </div>
      {rubles > 0 && <div className="text-xs text-(--color-muted)">Оплата пойдёт в кассу студии — подключите её на аккаунте владельца в разделе «Оплата».</div>}

      <div>
        <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">Площадки</div>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button key={p.value} type="button" onClick={() => toggle(providers, p.value, setProviders)} className="rounded-lg px-3 py-2 text-sm font-medium" style={providers.has(p.value) ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">Тип</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSchedulingType("round_robin")} className="rounded-lg px-3 py-2 text-sm font-medium" style={schedulingType === "round_robin" ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>Любой свободный</button>
          <button type="button" onClick={() => setSchedulingType("collective")} className="rounded-lg px-3 py-2 text-sm font-medium" style={schedulingType === "collective" ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>Совместная</button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
        <input type="checkbox" checked={allowHostPick} onChange={(e) => setAllowHostPick(e.target.checked)} />
        Разрешить клиенту выбрать конкретного специалиста
      </label>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">Специалисты (пул)</div>
        <div className="flex flex-wrap gap-2">
          {team.members.map((m) => (
            <button key={m.id} type="button" onClick={() => toggle(hosts, m.id, setHosts)} className="rounded-full px-3 py-1.5 text-sm font-medium" style={hosts.has(m.id) ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>{m.name ?? m.email}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy || !valid} className="btn-primary disabled:opacity-50">Создать (черновик)</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
      </div>
    </div>
  );
}
