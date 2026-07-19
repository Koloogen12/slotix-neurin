"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, apiUrl, ApiError, type CalendarConnection } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const PROVIDER_LABEL: Record<CalendarConnection["provider"], string> = {
  google: "Google Calendar",
};

function GoogleGlyph() {
  return (
    <div
      className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
      style={{ background: "#EAF1FE", color: "var(--color-link)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </svg>
    </div>
  );
}

function CalendarsContent() {
  const { refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<CalendarConnection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      const data = await api.get<CalendarConnection[]>("/api/calendars");
      setConnections(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Не удалось загрузить календари");
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (searchParams.get("connected") !== "google") return;
    loadConnections();
    refresh();
    showToast("Google Calendar подключён");
    router.replace("/cabinet/calendars");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
  }

  function setPending(id: string, value: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggleBusySync(connection: CalendarConnection) {
    setPending(connection.id, true);
    const nextValue = !connection.busySyncEnabled;
    try {
      await api.patch<CalendarConnection>(`/api/calendars/${connection.id}`, { busySyncEnabled: nextValue });
      setConnections((prev) => prev?.map((c) => (c.id === connection.id ? { ...c, busySyncEnabled: nextValue } : c)) ?? prev);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось обновить настройку");
    } finally {
      setPending(connection.id, false);
    }
  }

  async function setWriteTarget(connection: CalendarConnection) {
    if (connection.isWriteTarget) return;
    setPending(connection.id, true);
    try {
      await api.patch<CalendarConnection>(`/api/calendars/${connection.id}`, { isWriteTarget: true });
      setConnections((prev) => prev?.map((c) => ({ ...c, isWriteTarget: c.id === connection.id })) ?? prev);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось обновить настройку");
    } finally {
      setPending(connection.id, false);
    }
  }

  function connectGoogle() {
    window.location.href = apiUrl("/api/integrations/google-calendar/connect");
  }

  const hasConnections = (connections?.length ?? 0) > 0;

  return (
    <div className="max-w-[720px] pb-10">
      <h1 className="mb-1.5 text-[28px] font-bold tracking-tight text-(--color-ink)">Календари</h1>
      <p className="mb-6.5 text-[15px] text-(--color-muted)">Куда записывать встречи и где проверять вашу занятость</p>

      {loadError && <div className="glass-card mb-4.5 p-5 text-sm text-(--color-danger)">{loadError}</div>}

      {connections === null && !loadError && (
        <div className="glass-card p-8 text-center text-sm text-(--color-muted)">Загружаем календари…</div>
      )}

      {connections !== null && !hasConnections && (
        <div className="glass-card flex flex-col items-center px-6 py-12 text-center">
          <div
            className="mb-5 flex h-[70px] w-[70px] items-center justify-center rounded-[20px]"
            style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.6)", color: "var(--color-primary)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
              <path d="M3 9h18M8 2.5v4M16 2.5v4" />
            </svg>
          </div>
          <div className="mb-1.5 text-lg font-bold text-(--color-ink)">Календарь ещё не подключён</div>
          <div className="mb-5 max-w-[360px] text-sm text-(--color-muted)">
            Подключите Google Calendar, чтобы новые встречи автоматически появлялись в календаре и слоты скрывались при занятости
          </div>
          <button onClick={connectGoogle} className="btn-primary">
            Подключить Google Calendar
          </button>
        </div>
      )}

      {connections !== null && hasConnections && (
        <>
          <div className="glass-card p-6">
            <div className="mb-3.5 flex items-center">
              <div className="text-base font-bold text-(--color-ink)">Подключённые аккаунты</div>
              <button onClick={connectGoogle} className="btn-secondary ml-auto !px-4 !py-2.5 !text-[13px]">
                + Подключить ещё
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {connections.map((c) => (
                <div key={c.id} className="flex items-center gap-3.5 p-3">
                  <GoogleGlyph />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-(--color-ink)">{c.calendarId}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--color-success)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {PROVIDER_LABEL[c.provider]} · подключён
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-1 text-base font-bold text-(--color-ink)">Куда записывать встречи</div>
            <div className="mb-3 text-[13px] text-(--color-muted)">Новые события будут появляться в этом календаре</div>
            {connections.map((c) => (
              <div
                key={c.id}
                onClick={() => setWriteTarget(c)}
                className="flex cursor-pointer items-center gap-3.5 rounded-xl p-3.5 hover:bg-[rgba(80,148,240,.05)]"
                style={pendingIds.has(c.id) ? { opacity: 0.6, pointerEvents: "none" } : undefined}
              >
                <div
                  className="flex h-5.5 w-5.5 flex-none items-center justify-center rounded-full"
                  style={c.isWriteTarget ? { background: "var(--color-primary-gradient)" } : { border: "2px solid var(--color-faint)" }}
                >
                  {c.isWriteTarget && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                </div>
                <span className="text-[15px] font-medium text-(--color-ink)">{c.calendarId}</span>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <div className="mb-1 text-base font-bold text-(--color-ink)">Где проверять занятость</div>
            <div className="mb-3 text-[13px] text-(--color-muted)">
              Слоты, пересекающиеся с событиями этих календарей, будут скрыты
            </div>
            {connections.map((c) => (
              <div
                key={c.id}
                onClick={() => toggleBusySync(c)}
                className="flex cursor-pointer items-center gap-3.5 rounded-xl p-3.5 hover:bg-[rgba(80,148,240,.05)]"
                style={pendingIds.has(c.id) ? { opacity: 0.6, pointerEvents: "none" } : undefined}
              >
                <div
                  className="flex h-5.5 w-5.5 flex-none items-center justify-center rounded-[7px]"
                  style={c.busySyncEnabled ? { background: "var(--color-primary-gradient)" } : { border: "2px solid var(--color-faint)" }}
                >
                  {c.busySyncEnabled && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className="text-[15px] font-medium text-(--color-ink)">{c.calendarId}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {toast && (
        <div
          className="fixed bottom-6.5 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,40,70,.3)]"
          style={{ background: "#1A2733" }}
        >
          <span
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
            style={{ background: "var(--color-success-2)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function CalendarsPage() {
  return (
    <Suspense fallback={<div className="glass-card p-8 text-center text-sm text-(--color-muted)">Загружаем календари…</div>}>
      <CalendarsContent />
    </Suspense>
  );
}
