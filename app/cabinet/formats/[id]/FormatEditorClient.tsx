"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  type IntegrationsOverview,
  type Format,
  type FormatType,
  type VideoProvider,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ScheduleEditor } from "./ScheduleEditor";
import { QuestionsEditor } from "./QuestionsEditor";
import {
  DURATION_PRESETS,
  FORMAT_COLORS,
  PROVIDER_LABELS,
  PROVIDER_NEEDS_CONNECTION,
  PROVIDER_ORDER,
  TYPE_LABELS,
  formatDuration,
  kopecksToRublesInput,
  rublesToKopecks,
} from "../shared";

interface Props {
  id: string;
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function FormatEditorClient({ id }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existing, setExisting] = useState<Format | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<FormatType>("one");
  const [seats, setSeats] = useState(2);
  const [color, setColor] = useState(FORMAT_COLORS[0]);
  const [durationMin, setDurationMin] = useState(30);
  // A format offers a set of platforms; the client picks one at booking time. Platforms the
  // owner hasn't connected stay unselectable and link to the integrations screen instead —
  // enabling them would offer clients a meeting we can't produce a link for.
  const [providers, setProviders] = useState<VideoProvider[]>(["google_meet"]);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [paid, setPaid] = useState(false);
  const [priceRubles, setPriceRubles] = useState("");
  const [packageOn, setPackageOn] = useState(false);
  const [packageSize, setPackageSize] = useState("5");
  const [packagePriceRubles, setPackagePriceRubles] = useState("");
  const [manualConfirm, setManualConfirm] = useState(false);
  const [notetakerEnabled, setNotetakerEnabled] = useState(false);
  const isPro = user?.plan === "pro";

  const [openSections, setOpenSections] = useState({ basic: true, timing: true, advanced: false, price: false });

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await api.get<Format[]>("/api/formats");
        const found = list.find((f) => f.id === id);
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        setExisting(found);
        setName(found.name);
        setType(found.type);
        setSeats(found.seats ?? 2);
        setColor(found.color);
        setDurationMin(found.durationMin);
        setProviders(found.providers.length > 0 ? found.providers : ["google_meet"]);
        setPaid(found.priceKopecks > 0);
        setPackageOn(!!found.packageSize);
        if (found.packageSize) setPackageSize(String(found.packageSize));
        if (found.packagePriceKopecks) setPackagePriceRubles(kopecksToRublesInput(found.packagePriceKopecks));
        setPriceRubles(kopecksToRublesInput(found.priceKopecks));
        setManualConfirm(found.manualConfirm);
        setNotetakerEnabled(found.notetakerEnabled);
        setOpenSections((s) => ({ ...s, price: found.priceKopecks > 0, advanced: found.manualConfirm }));
      } catch (e) {
        if (!cancelled) setErrorMsg(e instanceof ApiError ? e.message : "Не удалось загрузить формат");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<IntegrationsOverview>("/api/integrations")
      .then((data) => {
        if (cancelled) return;
        setConnected({
          google_meet: data.google_meet.status === "on",
          zoom: data.zoom.status === "on",
          yandex_telemost: data.yandex_telemost.status === "on",
        });
      })
      .catch(() => {
        // Status is an enhancement: if it can't be read, tiles stay unselectable rather than
        // silently letting the owner offer a platform we may not be able to deliver.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): string | null {
    if (!name.trim()) return "Введите название формата";
    if (name.trim().length > 100) return "Название не должно превышать 100 символов";
    if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 180) {
      return "Длительность должна быть от 15 до 180 минут";
    }
    if (type === "group" && (!seats || seats < 1)) return "Укажите количество мест для групповой встречи";
    if (providers.length === 0) return "Выберите хотя бы одну площадку для встречи";
    if (paid && rublesToKopecks(priceRubles) <= 0) return "Укажите стоимость платной встречи";
    if (paid && packageOn) {
      if (Number(packageSize) < 2) return "В пакете должно быть минимум 2 встречи";
      if (rublesToKopecks(packagePriceRubles) <= 0) return "Укажите цену пакета";
    }
    return null;
  }

  function buildPayload() {
    return {
      name: name.trim(),
      type,
      durationMin,
      seats: type === "group" ? seats : undefined,
      color,
      providers,
      priceKopecks: paid ? rublesToKopecks(priceRubles) : 0,
      packageSize: paid && packageOn ? Number(packageSize) : undefined,
      packagePriceKopecks: paid && packageOn ? rublesToKopecks(packagePriceRubles) : undefined,
      manualConfirm,
      notetakerEnabled: isPro ? notetakerEnabled : false,
    };
  }

  async function handleSave(publishAfter: boolean) {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = buildPayload();
      if (isNew) {
        const created = await api.post<Format>("/api/formats", payload);
        if (publishAfter) await api.post(`/api/formats/${created.id}/publish`);
      } else if (existing) {
        await api.patch<Format>(`/api/formats/${existing.id}`, payload);
        if (publishAfter && existing.status === "draft") await api.post(`/api/formats/${existing.id}/publish`);
      }
      router.push("/cabinet/formats");
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : "Не удалось сохранить формат");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublishNow() {
    if (!existing) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const updated = await api.post<Format>(`/api/formats/${existing.id}/unpublish`);
      setExisting(updated);
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : "Не удалось снять формат с публикации");
    } finally {
      setSaving(false);
    }
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }

  if (notFound) {
    return (
      <div className="glass-card mx-auto mt-10 max-w-md rounded-[20px] p-8 text-center">
        <div className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          Формат не найден
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
          Возможно, он был удалён.
        </p>
        <Link href="/cabinet/formats" className="btn-primary mt-4 inline-flex">
          К списку форматов
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card mx-auto mt-10 max-w-md rounded-[20px] p-8 text-center text-sm" style={{ color: "var(--color-muted)" }}>
        Загрузка формата…
      </div>
    );
  }

  const isDraftMode = isNew || existing?.status === "draft";
  const breadcrumbName = name || "Новый формат";

  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="min-w-0 flex-1 basis-[440px]" style={{ maxWidth: 720 }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
            <Link href="/cabinet/formats" style={{ color: "var(--color-link)" }}>
              Форматы встреч
            </Link>
            <span>/</span>
            <span className="font-semibold" style={{ color: "var(--color-ink)" }}>
              {breadcrumbName}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {isDraftMode ? (
              <>
                <button type="button" onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
                  Сохранить черновик
                </button>
                <button type="button" onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Опубликовать
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleUnpublishNow}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                  style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}
                >
                  Снять с публикации
                </button>
                <button type="button" onClick={() => handleSave(false)} disabled={saving} className="btn-primary">
                  Сохранить изменения
                </button>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm font-medium" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            {errorMsg}
          </div>
        )}

        <Section title="Основная информация" open={openSections.basic} onToggle={() => toggleSection("basic")}>
          <div className="fe-lbl">Тип встречи</div>
          <div className="mb-6 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))" }}>
            {(Object.keys(TYPE_LABELS) as FormatType[]).map((k) => {
              const on = type === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className="flex flex-col items-center rounded-2xl px-3 py-4 text-center"
                  style={{
                    color: on ? "var(--color-link)" : "var(--color-muted)",
                    background: on ? "rgba(80,148,240,.08)" : "rgba(255,255,255,.5)",
                    border: `1.5px solid ${on ? "var(--color-primary)" : "#E3E9EF"}`,
                    boxShadow: on ? "0 6px 16px rgba(80,148,240,.14)" : "none",
                  }}
                >
                  <div className="text-[13px] font-semibold">{TYPE_LABELS[k].title}</div>
                  <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--color-muted)" }}>
                    {TYPE_LABELS[k].subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {type === "group" && (
            <div className="mb-6">
              <div className="fe-lbl">Количество мест</div>
              <div className="inline-flex items-center gap-0.5 rounded-xl border p-1" style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.7)" }}>
                <button
                  type="button"
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-lg"
                  style={{ width: 34, height: 34, color: "var(--color-text-secondary)" }}
                >
                  −
                </button>
                <div className="w-11 text-center text-[15px] font-semibold" style={{ color: "var(--color-ink)" }}>
                  {seats}
                </div>
                <button
                  type="button"
                  onClick={() => setSeats((s) => Math.min(500, s + 1))}
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-lg"
                  style={{ width: 34, height: 34, color: "var(--color-text-secondary)" }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="fe-lbl">Цвет формата</div>
          <div className="mb-6 flex flex-wrap gap-2.5">
            {FORMAT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: c, boxShadow: c === color ? "0 0 0 2px #fff, 0 0 0 4px " + c : "none" }}
              >
                {c === color && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="fe-lbl">Название</div>
          <input
            className="fe-inp"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            placeholder="Например: Консультация 30 минут"
          />
          <div className="fe-hint">Так формат будет отображаться у клиента · {100 - name.length} символов осталось</div>

          <div className="fe-lbl" style={{ marginTop: 22 }}>
            Место встречи
          </div>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_ORDER.map((p) => {
              const on = providers.includes(p);
              const needsConnection = PROVIDER_NEEDS_CONNECTION[p];
              const isConnected = !needsConnection || connected[p] === true;

              // Not connected: the tile becomes a link to the integrations screen rather than
              // a dead disabled control, so the owner knows what to do about it.
              if (!isConnected) {
                return (
                  <Link
                    key={p}
                    href="/cabinet/integrations"
                    className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
                    style={{ background: "rgba(255,255,255,.5)", border: "1px dashed #C9D4DE", color: "var(--color-muted)" }}
                  >
                    {PROVIDER_LABELS[p]}
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: "rgba(80,148,240,.12)", color: "var(--color-link)" }}
                    >
                      Подключить
                    </span>
                  </Link>
                );
              }

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setProviders((prev) =>
                      prev.includes(p)
                        ? // Never let the last one be switched off — a format with no platform
                          // could not be booked at all.
                          prev.length > 1
                          ? prev.filter((x) => x !== p)
                          : prev
                        : [...prev, p],
                    )
                  }
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
                  style={
                    on
                      ? { background: "rgba(80,148,240,.1)", border: "1px solid rgba(80,148,240,.25)", color: "var(--color-link)" }
                      : { background: "rgba(255,255,255,.5)", border: "1px solid #E3E9EF", color: "var(--color-text-secondary)" }
                  }
                >
                  {PROVIDER_LABELS[p]}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Сколько длится и когда доступно" open={openSections.timing} onToggle={() => toggleSection("timing")}>
          <div className="fe-lbl">Длительность</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDurationMin(v)}
                className="rounded-lg px-3.5 py-2.5 text-sm font-semibold"
                style={
                  v === durationMin
                    ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 4px 12px rgba(80,148,240,.3)" }
                    : { border: "1px solid #D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }
                }
              >
                {formatDuration(v)}
              </button>
            ))}
          </div>
          <div className="mb-6 flex items-center gap-2">
            <label className="fe-hint" style={{ margin: 0 }} htmlFor="custom-duration">
              Своя длительность (15–180 мин):
            </label>
            <input
              id="custom-duration"
              type="number"
              min={15}
              max={180}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="fe-inp"
              style={{ width: 90, padding: "8px 10px" }}
            />
          </div>

          <div className="fe-lbl">Расписание</div>
          <ScheduleEditor formatId={id} timezone={user?.timezone ?? "Europe/Moscow"} />

          <div className="fe-lbl">Вопросы при записи</div>
          <QuestionsEditor formatId={id} />
        </Section>

        <Section title="Продвинутые настройки" open={openSections.advanced} onToggle={() => toggleSection("advanced")}>
          <ToggleRow
            on={manualConfirm}
            onToggle={() => setManualConfirm((v) => !v)}
            title="Подтверждать записи вручную"
            subtitle="Клиент получит подтверждение только после вашего одобрения"
          />
          {isPro ? (
            <div className="mt-4">
              <ToggleRow
                on={notetakerEnabled}
                onToggle={() => setNotetakerEnabled((v) => !v)}
                title="AI-конспект встречи"
                subtitle="Бот подключится к Zoom или Google Meet, запишет встречу и пришлёт конспект с задачами"
              />
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-dashed border-[#C9D4DE] bg-white/50 px-4 py-3">
              <div>
                <div className="text-[14px] font-semibold text-[var(--color-ink)]">AI-конспект встречи</div>
                <div className="mt-0.5 text-[13px] text-[var(--color-muted)]">
                  Автоматический конспект с задачами по спикерам — на тарифе Pro.
                </div>
              </div>
              <Link href="/cabinet/billing" className="btn-secondary flex-none whitespace-nowrap !px-4 !py-2 text-[13px]">
                Перейти на Pro
              </Link>
            </div>
          )}
        </Section>

        <Section
          title="Стоимость"
          open={openSections.price}
          onToggle={() => toggleSection("price")}
          summary={paid ? `${priceRubles || 0} ₽` : "Бесплатно"}
        >
          <ToggleRow on={paid} onToggle={() => setPaid((v) => !v)} title="Платная встреча" />
          {paid && (
            <div className="mt-4" style={{ maxWidth: 220 }}>
              <div className="fe-lbl">Сумма</div>
              <div style={{ position: "relative" }}>
                <input
                  className="fe-inp"
                  style={{ paddingRight: 34 }}
                  value={priceRubles}
                  onChange={(e) => setPriceRubles(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0"
                  inputMode="numeric"
                />
                <span
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 12,
                    color: "var(--color-muted)",
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  ₽
                </span>
              </div>

              <div className="mt-5 border-t border-[rgba(20,30,45,.08)] pt-4">
                <ToggleRow
                  on={packageOn}
                  onToggle={() => setPackageOn((v) => !v)}
                  title="Продавать пакетом"
                  subtitle="Клиент оплачивает несколько встреч сразу — остаток списывается автоматически"
                />
                {packageOn && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div style={{ maxWidth: 140 }}>
                      <div className="fe-lbl">Встреч в пакете</div>
                      <input
                        className="fe-inp"
                        value={packageSize}
                        onChange={(e) => setPackageSize(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="5"
                        inputMode="numeric"
                      />
                    </div>
                    <div style={{ maxWidth: 180 }}>
                      <div className="fe-lbl">Цена пакета</div>
                      <div style={{ position: "relative" }}>
                        <input
                          className="fe-inp"
                          style={{ paddingRight: 34 }}
                          value={packagePriceRubles}
                          onChange={(e) => setPackagePriceRubles(e.target.value.replace(/[^\d.,]/g, ""))}
                          placeholder="0"
                          inputMode="numeric"
                        />
                        <span style={{ position: "absolute", right: 14, top: 12, color: "var(--color-muted)", fontSize: 15, fontWeight: 500 }}>₽</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="flex-1 basis-[280px]" style={{ minWidth: 280, maxWidth: 320, position: "sticky", top: 16 }}>
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          Как увидит клиент
        </div>
        <div
          className="overflow-hidden rounded-[22px]"
          style={{
            background: "rgba(255,255,255,.7)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,.6)",
            boxShadow: "0 16px 40px rgba(20,40,70,.1)",
          }}
        >
          <div style={{ height: 6, background: color }} />
          <div className="p-5.5" style={{ padding: 22 }}>
            <div className="mb-4.5 flex items-center gap-2.5" style={{ marginBottom: 18 }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)", color: "var(--color-link)" }}
              >
                <span className="text-[13px] font-bold">{initialsOf(user?.name)}</span>
              </div>
              <div className="text-[13px] font-medium" style={{ color: "var(--color-muted)" }}>
                {user?.name ?? user?.slug}
              </div>
            </div>
            <div className="mb-4 text-[19px] font-bold leading-snug" style={{ color: "var(--color-ink)" }}>
              {name || "Название формата"}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                <ClockIcon /> {formatDuration(durationMin)}
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                <VideoIcon /> {providers.map((p) => PROVIDER_LABELS[p]).join(" · ")}
              </div>
              {paid && (
                <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  <CashIcon /> {priceRubles || 0} ₽
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fe-lbl {
          font: 600 13px "Golos Text", sans-serif;
          color: var(--color-ink);
          margin-bottom: 9px;
        }
        .fe-inp {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #d1d9e6;
          background: rgba(255, 255, 255, 0.7);
          font: 400 15px "Golos Text", sans-serif;
          color: var(--color-ink);
          outline: none;
        }
        .fe-inp:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(80, 148, 240, 0.15);
        }
        .fe-hint {
          font: 400 12.5px "Golos Text", sans-serif;
          color: var(--color-muted);
          margin-top: 7px;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="mb-4 overflow-hidden rounded-[20px]"
      style={{
        background: "rgba(255,255,255,.6)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,.55)",
        boxShadow: "0 12px 34px rgba(20,40,70,.06)",
      }}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-6 py-5 text-left">
        <span className="text-base font-semibold" style={{ color: "var(--color-ink)" }}>
          {title}
        </span>
        {summary && (
          <span className="text-[13px]" style={{ color: "var(--color-muted)" }}>
            {summary}
          </span>
        )}
        <span
          className="ml-auto"
          style={{ color: "var(--color-muted)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && <div className="px-6 pb-6.5" style={{ paddingBottom: 26 }}>{children}</div>}
    </div>
  );
}

function ToggleRow({
  on,
  onToggle,
  title,
  subtitle,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className="box-border flex-none rounded-full p-0.5"
        style={{ width: 44, minWidth: 44, height: 26, background: on ? "var(--color-primary-gradient)" : "#CBD5E1", transition: "background .2s" }}
      >
        <div
          className="rounded-full bg-white"
          style={{
            width: 20,
            height: 20,
            boxShadow: "0 2px 4px rgba(0,0,0,.2)",
            transform: `translateX(${on ? 18 : 0}px)`,
            transition: "transform .2s",
          }}
        />
      </button>
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <span style={{ color: "var(--color-muted)" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </span>
  );
}

function VideoIcon() {
  return (
    <span style={{ color: "var(--color-muted)" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="13" height="12" rx="2.5" />
        <path d="M15 10l6-3.5v11L15 14" />
      </svg>
    </span>
  );
}

function CashIcon() {
  return (
    <span style={{ color: "var(--color-muted)" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.5V4.8A1.8 1.8 0 0 1 4.8 3h6.9a2 2 0 0 1 1.4.6l7.5 7.5a1.9 1.9 0 0 1 0 2.3z" />
      </svg>
    </span>
  );
}
