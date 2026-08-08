"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type BookingSourceStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SourceStats } from "./SourceStats";
import { UtmBuilder } from "./UtmBuilder";

export function SourcesView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BookingSourceStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BookingSourceStats>("/api/bookings/sources")
      .then((data) => !cancelled && setStats(data))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Не удалось загрузить статистику"));
    return () => {
      cancelled = true;
    };
  }, []);

  const baseUrl = useMemo(() => {
    const host = typeof window !== "undefined" ? window.location.origin : "https://slotix.neurin.tech";
    return `${host}/${user?.slug ?? "your-slug"}`;
  }, [user?.slug]);

  return (
    <div className="pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-tight text-(--color-ink)">Источники записей</h1>
      <p className="mb-6 max-w-[560px] text-sm text-(--color-muted)">
        Откуда приходят клиенты. Сгенерируйте ссылку с меткой под нужный канал — и каждая запись по ней попадёт в
        статистику ниже.
      </p>

      <UtmBuilder baseUrl={baseUrl} />

      {error && (
        <div
          className="mb-5 rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--color-danger-bg)", borderColor: "rgba(232,86,86,.3)", color: "var(--color-danger)" }}
        >
          {error}
        </div>
      )}

      {!stats && !error && (
        <div className="glass-card p-9 text-center text-sm text-(--color-muted)">Загрузка…</div>
      )}

      {stats && <SourceStats stats={stats} />}
    </div>
  );
}
