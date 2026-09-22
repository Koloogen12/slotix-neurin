"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, type IntegrationsOverview } from "@/lib/api";
import { WebhooksSection } from "./WebhooksSection";

type ConnectableProvider = "zoom" | "yandex_telemost";
type ProviderKey = "google_meet" | ConnectableProvider;
type ConnectionStatus = "on" | "off" | "error";

interface ProviderDef {
  key: ProviderKey;
  name: string;
  logoSrc: string;
  desc: string;
  pendingVerification?: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    key: "google_meet",
    name: "Google Meet",
    logoSrc: "/logos/google-meet.png",
    desc: "Ссылки на встречу создаются автоматически через ваш Google Calendar.",
  },
  {
    key: "zoom",
    name: "Zoom",
    logoSrc: "/logos/zoom.png",
    desc: "Создавайте Zoom-конференции для форматов с этой локацией.",
  },
  {
    key: "yandex_telemost",
    name: "Яндекс Телемост",
    logoSrc: "/logos/yandex-telemost.png",
    desc: "Российский сервис видеовстреч без установки приложений.",
  },
];

function isConnectable(key: ProviderKey): key is ConnectableProvider {
  return key === "zoom" || key === "yandex_telemost";
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<IntegrationsPageSkeleton />}>
      <IntegrationsPageContent />
    </Suspense>
  );
}

function IntegrationsPageSkeleton() {
  return (
    <div className="px-3 pb-10 pt-2">
      <h1 className="mb-[6px] text-[28px] font-bold tracking-[-.01em] text-[var(--color-ink)]">Интеграции</h1>
      <p className="mb-[26px] text-[15px] text-[var(--color-muted)]">
        Подключите сервисы видеосвязи для ваших форматов встреч
      </p>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {PROVIDERS.map((def) => (
          <SkeletonCard key={def.key} />
        ))}
      </div>
    </div>
  );
}

function IntegrationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [overview, setOverview] = useState<IntegrationsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<ConnectableProvider | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.get<IntegrationsOverview>("/api/integrations");
      setOverview(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Не удалось загрузить интеграции");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The backend's OAuth callback redirects back here with ?connected=<provider> (see
  // integrations.controller.ts) since a server redirect can't carry client-side toast state.
  useEffect(() => {
    const connected = searchParams.get("connected");
    if (!connected) return;
    const def = PROVIDERS.find((p) => p.key === connected);
    showToast(`${def?.name ?? connected} подключён`);
    load();
    router.replace("/cabinet/integrations");
  }, [searchParams, router, load, showToast]);

  async function handleConnect(provider: ConnectableProvider, action: "on" | "reconnect") {
    setPending(provider);
    try {
      const { redirectUrl } = await api.patch<{ redirectUrl: string }>(`/api/integrations/${provider}`, { action });
      window.location.href = redirectUrl;
    } catch (err) {
      setPending(null);
      showToast(err instanceof ApiError ? err.message : "Не удалось начать подключение");
    }
  }

  async function handleDisconnect(provider: ConnectableProvider, name: string) {
    setPending(provider);
    try {
      await api.patch(`/api/integrations/${provider}`, { action: "off" });
      await load();
      showToast(`${name} отключён`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось отключить");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="px-3 pb-10 pt-2">
      <h1 className="mb-[6px] text-[28px] font-bold tracking-[-.01em] text-[var(--color-ink)]">Интеграции</h1>
      <p className="mb-[26px] text-[15px] text-[var(--color-muted)]">
        Подключите сервисы видеосвязи для ваших форматов встреч
      </p>

      {loadError && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {loadError}
        </div>
      )}

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {isLoading || !overview
          ? PROVIDERS.map((def) => <SkeletonCard key={def.key} />)
          : PROVIDERS.map((def) => {
              const connectableKey = isConnectable(def.key) ? def.key : null;
              return (
                <IntegrationCard
                  key={def.key}
                  def={def}
                  status={overview[def.key].status}
                  isPending={connectableKey !== null && pending === connectableKey}
                  onConnect={connectableKey ? () => handleConnect(connectableKey, "on") : undefined}
                  onReconnect={connectableKey ? () => handleConnect(connectableKey, "reconnect") : undefined}
                  onDisconnect={connectableKey ? () => handleDisconnect(connectableKey, def.name) : undefined}
                />
              );
            })}
      </div>

      <PaymentAcceptance />

      <WebhooksSection />

      {toast && (
        <div
          className="fixed bottom-[26px] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-[11px] rounded-2xl px-5 py-[14px] text-[14px] font-semibold text-white"
          style={{ background: "#1A2733", boxShadow: "0 16px 40px rgba(20,40,70,.3)" }}
        >
          <span
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
            style={{ background: "#3FCB6E" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card flex flex-col p-6" style={{ minHeight: 190 }}>
      <div className="mb-[14px] flex items-center gap-[14px]">
        <div className="h-[46px] w-[46px] flex-none animate-pulse rounded-[13px] bg-[rgba(20,30,45,.08)]" />
        <div className="h-[16px] w-[110px] animate-pulse rounded bg-[rgba(20,30,45,.08)]" />
      </div>
      <div className="mb-[18px] flex-1 space-y-2">
        <div className="h-[12px] w-full animate-pulse rounded bg-[rgba(20,30,45,.06)]" />
        <div className="h-[12px] w-4/5 animate-pulse rounded bg-[rgba(20,30,45,.06)]" />
      </div>
      <div className="h-[40px] w-full animate-pulse rounded-[11px] bg-[rgba(20,30,45,.06)]" style={{ borderTop: "1px solid rgba(20,30,45,.06)" }} />
    </div>
  );
}

function IntegrationCard({
  def,
  status,
  isPending,
  onConnect,
  onReconnect,
  onDisconnect,
}: {
  def: ProviderDef;
  status: ConnectionStatus;
  isPending: boolean;
  onConnect?: () => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}) {
  const isError = status === "error";

  return (
    <div
      className="glass-card flex flex-col p-6"
      style={isError ? { borderColor: "rgba(242,106,106,.3)" } : undefined}
    >
      <div className="mb-[14px] flex items-center gap-[14px]">
        <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] bg-white p-2" style={{ border: "1px solid rgba(20,30,45,.06)" }}>
          <img src={def.logoSrc} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="text-[16px] font-bold text-[var(--color-ink)]">{def.name}</div>
        {def.pendingVerification && status !== "on" && (
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(199,154,46,.15)", color: "#8A6A1F" }}
          >
            {def.pendingVerification}
          </span>
        )}
      </div>
      <div className="mb-[18px] flex-1 text-[13.5px] leading-[1.5] text-[var(--color-muted)]">{def.desc}</div>

      {def.key === "google_meet" ? (
        <GoogleMeetFooter status={status} />
      ) : def.pendingVerification && status !== "on" ? (
        <div className="border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-[11px] border py-[11px] text-[14px] font-semibold opacity-50"
            style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-link)" }}
          >
            Подключить
          </button>
        </div>
      ) : status === "on" ? (
        <div className="flex items-center gap-[9px] border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
          <span className="flex items-center gap-[7px] text-[13px] font-semibold" style={{ color: "#2E8A73" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Подключено
          </span>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={isPending}
            className="ml-auto cursor-pointer text-[12.5px] font-medium text-[var(--color-muted)] disabled:opacity-50"
          >
            {isPending ? "Отключаем…" : "Отключить"}
          </button>
        </div>
      ) : status === "error" ? (
        <div className="flex items-center gap-[9px] border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
          <span className="flex items-center gap-[7px] text-[13px] font-semibold" style={{ color: "#D64545" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            Ошибка подключения
          </span>
          <button type="button" onClick={onReconnect} disabled={isPending} className="btn-primary ml-auto px-[14px] py-2 text-[13px] disabled:opacity-60">
            {isPending ? "Подключаем…" : "Переподключить"}
          </button>
        </div>
      ) : (
        <div className="border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
          <button
            type="button"
            onClick={onConnect}
            disabled={isPending}
            className="w-full cursor-pointer rounded-[11px] border py-[11px] text-[14px] font-semibold disabled:opacity-60"
            style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-link)" }}
          >
            {isPending ? "Подключаем…" : "Подключить"}
          </button>
        </div>
      )}
    </div>
  );
}

// Google Meet has no standalone OAuth — its status is derived from whether a Google Calendar
// write-target connection exists (see IntegrationsService.listIntegrations). There is no
// PATCH action for it, so this footer only ever links to Calendars instead of connecting directly.
function GoogleMeetFooter({ status }: { status: ConnectionStatus }) {
  if (status === "on") {
    return (
      <div className="flex items-center gap-[9px] border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
        <span className="flex items-center gap-[7px] text-[13px] font-semibold" style={{ color: "#2E8A73" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Подключено
        </span>
        <span className="ml-auto text-[12.5px] text-[var(--color-muted)]">через Google Calendar</span>
      </div>
    );
  }

  return (
    <div className="border-t pt-4" style={{ borderColor: "rgba(20,30,45,.06)" }}>
      <Link
        href="/cabinet/calendars"
        className="block w-full rounded-[11px] border py-[11px] text-center text-[14px] font-semibold"
        style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-link)" }}
      >
        Подключить через Календари
      </Link>
    </div>
  );
}


type PaymentProviderKind = "yookassa" | "cloudpayments";

interface PaymentStatus {
  connected: boolean;
  provider: PaymentProviderKind | null;
  publicId: string | null;
}

const PAYMENT_PROVIDERS: {
  key: PaymentProviderKind;
  name: string;
  publicLabel: string;
  secretLabel: string;
  hint: string;
  helpUrl: string;
  helpText: string;
}[] = [
  {
    key: "yookassa",
    name: "ЮKassa",
    publicLabel: "shopId",
    secretLabel: "Секретный ключ",
    hint: "Личный кабинет ЮKassa → Интеграция → Ключи API. Для проверки можно завести тестовый магазин — договор не нужен.",
    helpUrl: "https://yookassa.ru/developers/using-api/testing",
    helpText: "Где взять ключи и тестовый магазин",
  },
  {
    key: "cloudpayments",
    name: "CloudPayments",
    publicLabel: "Public ID",
    secretLabel: "API Secret",
    hint: "Личный кабинет CloudPayments → Настройки → API. Public ID нужен для оплат, API Secret — для подтверждения.",
    helpUrl: "https://developers.cloudpayments.ru/",
    helpText: "Где взять ключи и тестовые карты",
  },
];

function PaymentAcceptance() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [provider, setProvider] = useState<PaymentProviderKind>("yookassa");
  const [publicId, setPublicId] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<PaymentStatus>("/api/payment-connections").then(setStatus).catch(() => setStatus(null));
  }, []);
  useEffect(load, [load]);

  const def = PAYMENT_PROVIDERS.find((p) => p.key === provider)!;

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const next = await api.post<PaymentStatus>("/api/payment-connections", { provider, publicId: publicId.trim(), secret: secret.trim() });
      setStatus(next);
      setPublicId("");
      setSecret("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось подключить");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await api.delete("/api/payment-connections");
    load();
  }

  return (
    <div className="mt-9">
      <h2 className="mb-1 text-lg font-bold tracking-tight text-[var(--color-ink)]">Приём оплат от клиентов</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        Подключите свою платёжную систему — деньги за платные встречи и пакеты приходят напрямую вам.
      </p>

      <div className="glass-card max-w-[560px] rounded-[20px] p-6">
        {status?.connected ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-success)" }} />
                <span className="text-[15px] font-semibold text-[var(--color-ink)]">
                  {PAYMENT_PROVIDERS.find((p) => p.key === status.provider)?.name ?? status.provider} подключён
                </span>
              </div>
              {status.publicId && <div className="mt-1 text-[13px] text-[var(--color-muted)]">ID: {status.publicId}</div>}
            </div>
            <button type="button" onClick={disconnect} className="btn-secondary flex-none !px-4 !py-2 text-[13px]">
              Отключить
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {PAYMENT_PROVIDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setProvider(p.key)}
                  className="flex-1 cursor-pointer rounded-xl px-3.5 py-2.5 text-[14px] font-semibold"
                  style={
                    provider === p.key
                      ? { background: "rgba(80,148,240,.1)", border: "1px solid rgba(80,148,240,.25)", color: "var(--color-link)" }
                      : { background: "rgba(255,255,255,.5)", border: "1px solid #E3E9EF", color: "var(--color-text-secondary)" }
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">{def.publicLabel}</label>
                <input className="input-field" value={publicId} onChange={(e) => setPublicId(e.target.value)} placeholder={def.publicLabel} />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">{def.secretLabel}</label>
                <input className="input-field" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                {def.hint}{" "}
                <a href={def.helpUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-link)]">
                  {def.helpText} ↗
                </a>
              </div>
              {error && <div className="text-sm font-medium text-[var(--color-danger)]">{error}</div>}
              <button type="button" className="btn-primary" disabled={busy || !publicId.trim() || !secret.trim()} onClick={connect}>
                {busy ? "Проверяем ключи…" : "Подключить"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
