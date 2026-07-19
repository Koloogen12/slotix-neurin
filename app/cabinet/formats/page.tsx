"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Format } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatMeta, formatPriceLabel, PROVIDER_LABELS } from "./shared";

type SortKey = "new" | "name" | "price" | "dur";
type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortKey, string> = {
  new: "Сначала новые",
  name: "По названию",
  price: "По цене",
  dur: "По длительности",
};

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function sortFormats(list: Format[], sort: SortKey): Format[] {
  const copy = [...list];
  if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  else if (sort === "price") copy.sort((a, b) => b.priceKopecks - a.priceKopecks);
  else if (sort === "dur") copy.sort((a, b) => a.durationMin - b.durationMin);
  else copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return copy;
}

export default function FormatsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formats, setFormats] = useState<Format[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("new");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);

  const showToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
    setTimeout(() => setToast((t) => (t?.message === message ? null : t)), 2600);
  }, []);

  const loadFormats = useCallback(async () => {
    try {
      const list = await api.get<Format[]>("/api/formats");
      setFormats(list);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Не удалось загрузить форматы");
    }
  }, []);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  // Closes the open card/row menu on an outside click. Previously a full-screen
  // `position:fixed` overlay handled this instead — but every card/row wrapper has
  // `.glass-card`'s `backdrop-filter`, which creates a new stacking context, so the menu's
  // `z-25` never actually competed against the overlay's `z-20` in the same context. The
  // overlay silently sat on top of every card and ate every click meant for a menu item —
  // publish/unpublish/duplicate/delete were all unreachable by mouse. A mousedown listener
  // that checks whether the click landed inside a menu root sidesteps stacking order
  // entirely instead of trying to out-z-index it.
  useEffect(() => {
    if (menuFor === null) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-root]")) setMenuFor(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuFor]);

  const sorted = useMemo(() => (formats ? sortFormats(formats, sort) : []), [formats, sort]);

  const withAction = useCallback(
    async (id: string, action: () => Promise<unknown>, successMessage: string) => {
      setBusyId(id);
      setMenuFor(null);
      try {
        await action();
        await loadFormats();
        showToast(successMessage, "success");
      } catch (e) {
        showToast(e instanceof ApiError ? e.message : "Что-то пошло не так", "error");
      } finally {
        setBusyId(null);
      }
    },
    [loadFormats, showToast],
  );

  const handleDuplicate = (f: Format) =>
    withAction(f.id, () => api.post(`/api/formats/${f.id}/duplicate`), "Формат дублирован в черновик");

  const handlePublish = (f: Format) =>
    withAction(f.id, () => api.post(`/api/formats/${f.id}/publish`), "Формат опубликован");

  const handleUnpublish = (f: Format) =>
    withAction(f.id, () => api.post(`/api/formats/${f.id}/unpublish`), "Формат снят с публикации");

  const handleDelete = (f: Format) => {
    if (!window.confirm(`Удалить формат «${f.name}»? Это действие необратимо.`)) return;
    withAction(f.id, () => api.delete(`/api/formats/${f.id}`), "Формат удалён");
  };

  const handleCopyFormatLink = async (f: Format) => {
    if (f.status === "draft" || !user) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${user.slug}/${f.id}`);
      showToast("Ссылка на формат скопирована", "success");
    } catch {
      showToast("Не удалось скопировать ссылку", "error");
    }
    setMenuFor(null);
  };

  const handleCopyProfile = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${user.slug}`);
      setCopiedProfile(true);
      showToast("Ссылка на профиль скопирована", "success");
      setTimeout(() => setCopiedProfile(false), 2200);
    } catch {
      showToast("Не удалось скопировать ссылку", "error");
    }
  };

  const handleOpenPublic = () => {
    if (!user) return;
    window.open(`${window.location.origin}/${user.slug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="m-0 text-[28px] font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Форматы встреч
        </h1>
        <div className="ml-auto flex items-center gap-2.5">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
            style={{ borderColor: "rgba(255,255,255,.7)", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border p-0.5" style={{ background: "rgba(255,255,255,.5)", borderColor: "rgba(255,255,255,.7)" }}>
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Сетка"
              className="flex h-7.5 w-8 items-center justify-center rounded-md"
              style={
                view === "grid"
                  ? { background: "var(--color-primary-gradient)", color: "#fff" }
                  : { color: "var(--color-muted)" }
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="Список"
              className="flex h-7.5 w-8 items-center justify-center rounded-md"
              style={
                view === "list"
                  ? { background: "var(--color-primary-gradient)", color: "#fff" }
                  : { color: "var(--color-muted)" }
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
              </svg>
            </button>
          </div>
          <button type="button" onClick={() => router.push("/cabinet/formats/new")} className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить формат
          </button>
        </div>
      </div>

      {user && (
        <div className="glass-card mb-6 flex flex-wrap items-center gap-4 rounded-[20px] px-5 py-4.5">
          <div
            className="flex h-13 w-13 flex-none items-center justify-center overflow-hidden rounded-full"
            style={{ width: 52, height: 52, boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)" }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold" style={{ color: "var(--color-link)" }}>
                {initialsOf(user.name)}
              </span>
            )}
          </div>
          <div>
            <div className="text-base font-bold" style={{ color: "var(--color-ink)" }}>
              {user.name ?? user.slug}
            </div>
            <div className="mt-0.5 text-[13px] font-medium" style={{ color: "var(--color-muted)" }}>
              {typeof window !== "undefined" ? window.location.host : "slotix.ru"}/{user.slug}
            </div>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" onClick={handleCopyProfile} className="btn-secondary" style={{ color: "var(--color-link)" }}>
              {copiedProfile ? "Скопировано" : "Скопировать ссылку"}
            </button>
            <button type="button" onClick={handleOpenPublic} className="btn-secondary">
              Открыть страницу
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div
          className="mb-6 rounded-2xl px-5 py-4 text-sm font-medium"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {loadError}{" "}
          <button type="button" onClick={loadFormats} className="font-semibold underline">
            Повторить
          </button>
        </div>
      )}

      {formats === null && !loadError && (
        <div className="glass-card rounded-[20px] px-6 py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
          Загрузка форматов…
        </div>
      )}

      {formats !== null && formats.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 rounded-[20px] px-6 py-14 text-center">
          <div className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
            Пока нет ни одного формата
          </div>
          <div className="max-w-sm text-sm" style={{ color: "var(--color-muted)" }}>
            Создайте формат встречи — это то, на что будут записываться ваши клиенты.
          </div>
          <button type="button" onClick={() => router.push("/cabinet/formats/new")} className="btn-primary mt-2">
            Добавить формат
          </button>
        </div>
      )}

      {formats !== null && formats.length > 0 && view === "grid" && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(284px, 1fr))" }}>
          {sorted.map((f) => {
            const draft = f.status === "draft";
            return (
              <div
                key={f.id}
                className="glass-card flex cursor-pointer flex-col rounded-[20px]"
                style={{ opacity: draft ? 0.96 : 1 }}
                onClick={() => router.push(`/cabinet/formats/${f.id}`)}
              >
                {/* overflow-hidden used to live on the card itself so this strip's top corners
                    got clipped into shape — but that also clipped the "..." dropdown menu
                    below whenever it needed more height than the card had left. Rounding the
                    strip's own corners gets the same look without clipping anything else. */}
                <div className="rounded-t-[20px]" style={{ height: 6, background: f.color }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex justify-between gap-2">
                    <div className="text-base font-semibold leading-snug" style={{ color: "var(--color-ink)" }}>
                      {f.name}
                    </div>
                    <div className="relative flex-none" data-menu-root onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setMenuFor((m) => (m === f.id ? null : f.id))}
                        disabled={busyId === f.id}
                        className="flex cursor-pointer rounded-md p-0.5"
                        style={{ color: "var(--color-faint-2)" }}
                        aria-label="Действия"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                      {menuFor === f.id && (
                        <div
                          className="absolute right-0 top-[calc(100%+4px)] z-25 min-w-[196px] rounded-[13px] border bg-white p-1.5"
                          style={{ borderColor: "#E3E9EF", boxShadow: "0 16px 40px rgba(20,40,70,.18)" }}
                        >
                          <MenuItem onClick={() => router.push(`/cabinet/formats/${f.id}`)}>Редактировать</MenuItem>
                          {!draft && <MenuItem onClick={() => handleCopyFormatLink(f)}>Скопировать ссылку</MenuItem>}
                          <MenuItem onClick={() => handleDuplicate(f)}>Дублировать</MenuItem>
                          {draft ? (
                            <MenuItem onClick={() => handlePublish(f)} color="var(--color-success)">
                              Опубликовать
                            </MenuItem>
                          ) : (
                            <MenuItem onClick={() => handleUnpublish(f)} color="var(--color-warning)">
                              Снять с публикации
                            </MenuItem>
                          )}
                          <div className="my-1 h-px" style={{ background: "rgba(20,30,45,.07)" }} />
                          <MenuItem onClick={() => handleDelete(f)} color="var(--color-danger)">
                            Удалить
                          </MenuItem>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[13px] font-medium" style={{ color: "var(--color-muted)" }}>
                    {formatMeta(f)}
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <PriceBadge draft={draft} priceKopecks={f.priceKopecks} />
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold"
                      style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)", color: "var(--color-muted)" }}
                    >
                      {PROVIDER_LABELS[f.provider]}
                    </span>
                  </div>
                  <div
                    className="mt-auto flex items-center gap-2 pt-4 text-[13px] font-semibold"
                    style={{ borderTop: "1px solid rgba(20,30,45,.06)", color: draft ? "var(--color-faint-2)" : "var(--color-link)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyFormatLink(f);
                    }}
                  >
                    {draft ? "Сначала опубликуйте" : "Скопировать ссылку"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formats !== null && formats.length > 0 && view === "list" && (
        <div className="glass-card rounded-[18px] p-1.5">
          {sorted.map((f) => {
            const draft = f.status === "draft";
            return (
              <div
                key={f.id}
                className="flex cursor-pointer items-center gap-3.5 rounded-[13px] p-3.5"
                style={{ opacity: draft ? 0.96 : 1 }}
                onClick={() => router.push(`/cabinet/formats/${f.id}`)}
              >
                <div className="h-8.5 w-1.25 flex-none rounded-sm" style={{ width: 5, height: 34, background: f.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold" style={{ color: "var(--color-ink)" }}>
                    {f.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {formatMeta(f)}
                  </div>
                </div>
                <PriceBadge draft={draft} priceKopecks={f.priceKopecks} />
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold"
                  style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)", color: "var(--color-muted)" }}
                >
                  {PROVIDER_LABELS[f.provider]}
                </span>
                <div className="relative flex-none" data-menu-root onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setMenuFor((m) => (m === f.id ? null : f.id))}
                    disabled={busyId === f.id}
                    className="flex cursor-pointer rounded-md p-0.5"
                    style={{ color: "var(--color-faint-2)" }}
                    aria-label="Действия"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </button>
                  {menuFor === f.id && (
                    <div
                      className="absolute right-0 top-[calc(100%+4px)] z-25 min-w-[196px] rounded-[13px] border bg-white p-1.5"
                      style={{ borderColor: "#E3E9EF", boxShadow: "0 16px 40px rgba(20,40,70,.18)" }}
                    >
                      <MenuItem onClick={() => router.push(`/cabinet/formats/${f.id}`)}>Редактировать</MenuItem>
                      {!draft && <MenuItem onClick={() => handleCopyFormatLink(f)}>Скопировать ссылку</MenuItem>}
                      <MenuItem onClick={() => handleDuplicate(f)}>Дублировать</MenuItem>
                      {draft ? (
                        <MenuItem onClick={() => handlePublish(f)} color="var(--color-success)">
                          Опубликовать
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={() => handleUnpublish(f)} color="var(--color-warning)">
                          Снять с публикации
                        </MenuItem>
                      )}
                      <div className="my-1 h-px" style={{ background: "rgba(20,30,45,.07)" }} />
                      <MenuItem onClick={() => handleDelete(f)} color="var(--color-danger)">
                        Удалить
                      </MenuItem>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white"
          style={{ background: "#1A2733", boxShadow: "0 16px 40px rgba(20,40,70,.3)" }}
        >
          <span
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
            style={{ background: toast.kind === "success" ? "var(--color-success-2)" : "var(--color-danger)" }}
          >
            {toast.kind === "success" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium"
      style={{ color: color ?? "var(--color-text-secondary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(80,148,240,.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </div>
  );
}

function PriceBadge({ draft, priceKopecks }: { draft: boolean; priceKopecks: number }) {
  const style = draft
    ? { color: "var(--color-warning)", background: "var(--color-warning-bg)", border: "1px solid rgba(245,185,61,.3)" }
    : priceKopecks === 0
      ? { color: "var(--color-success)", background: "rgba(63,162,148,.1)", border: "1px solid rgba(63,162,148,.2)" }
      : { color: "var(--color-text-secondary)", background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)" };
  return (
    <span className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold" style={style}>
      {draft ? "Черновик" : formatPriceLabel(priceKopecks)}
    </span>
  );
}
