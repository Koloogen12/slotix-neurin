"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Webhook, type WebhookDelivery } from "@/lib/api";

const EVENT_LABELS: Record<string, string> = {
  booking_created: "запись создана",
  booking_confirmed: "запись подтверждена",
  booking_cancelled: "запись отменена",
  booking_rescheduled: "встреча перенесена",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "в очереди",
  delivered: "доставлено",
  failed: "не доставлено",
};

/** Исходящие вебхуки: запись уезжает в CRM или таблицу владельца сама. */
export function WebhooksSection() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ключ подписи показывается ровно один раз — повторно его взять неоткуда. */
  const [freshSecret, setFreshSecret] = useState<{ id: string; secret: string } | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});

  const load = useCallback(async () => {
    try {
      setHooks(await api.get<Webhook[]>("/api/webhooks-out"));
    } catch {
      setError("Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    setError(null);
    setBusy(true);
    try {
      const created = await api.post<Webhook & { secret: string }>("/api/webhooks-out", { url: url.trim() });
      setFreshSecret({ id: created.id, secret: created.secret });
      setUrl("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить вебхук");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await api.delete(`/api/webhooks-out/${id}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function test(id: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ status: string; lastError: string | null }>(`/api/webhooks-out/${id}/test`);
      if (result.status !== "delivered") setError(`Пробное событие не дошло: ${result.lastError ?? "нет ответа"}`);
      await showDeliveries(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить пробное событие");
    } finally {
      setBusy(false);
    }
  }

  async function showDeliveries(id: string) {
    const rows = await api.get<WebhookDelivery[]>(`/api/webhooks-out/${id}/deliveries`);
    setDeliveries((current) => ({ ...current, [id]: rows }));
  }

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-bold tracking-tight text-[var(--color-ink)]">Вебхуки</h2>
      <p className="mb-4 max-w-[640px] text-[14px] leading-relaxed text-[var(--color-muted)]">
        Slotix будет присылать на ваш адрес каждое событие о записи — вместе с ответами на вопросы
        формата. Подходит, чтобы складывать заявки в CRM или таблицу. Тело подписано
        HMAC-SHA256, заголовок <code>X-Slotix-Signature</code>; сверяйте подпись, иначе писать
        туда сможет кто угодно.
      </p>

      {loading ? (
        <div className="text-[14px] text-[var(--color-muted)]">Загружаем…</div>
      ) : (
        <>
          {hooks.map((hook) => (
            <div key={hook.id} className="mb-3 rounded-2xl border border-[rgba(20,30,45,.08)] bg-white/60 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="break-all font-mono text-[13px] text-[var(--color-ink)]">{hook.url}</span>
                <span className="text-[12px] text-[var(--color-muted)]">
                  {hook.events.map((e) => EVENT_LABELS[e] ?? e).join(", ")}
                </span>
                <div className="ml-auto flex gap-2">
                  <button type="button" className="wh-mini" disabled={busy} onClick={() => test(hook.id)}>
                    Проверить
                  </button>
                  <button type="button" className="wh-mini" disabled={busy} onClick={() => showDeliveries(hook.id)}>
                    История
                  </button>
                  <button type="button" className="wh-mini wh-del" disabled={busy} onClick={() => remove(hook.id)}>
                    Удалить
                  </button>
                </div>
              </div>

              {freshSecret?.id === hook.id && (
                <div className="mt-3 rounded-xl bg-[rgba(80,148,240,.1)] p-3 text-[13px] leading-relaxed">
                  Ключ подписи — сохраните сейчас, показать повторно его нельзя:
                  <div className="mt-1 break-all font-mono text-[12px]">{freshSecret.secret}</div>
                </div>
              )}

              {deliveries[hook.id] && (
                <div className="mt-3 flex flex-col gap-1">
                  {deliveries[hook.id].length === 0 && (
                    <div className="text-[13px] text-[var(--color-muted)]">Событий пока не было.</div>
                  )}
                  {deliveries[hook.id].map((row) => (
                    <div key={row.id} className="flex flex-wrap gap-2 text-[12px] text-[var(--color-muted)]">
                      <span>{new Date(row.createdAt).toLocaleString("ru-RU")}</span>
                      <span>{EVENT_LABELS[row.event] ?? row.event}</span>
                      <span className={row.status === "failed" ? "text-[#c0392b]" : ""}>
                        {STATUS_LABELS[row.status] ?? row.status}
                        {row.attempts > 1 ? ` · попыток: ${row.attempts}` : ""}
                      </span>
                      {row.lastError && <span className="text-[#c0392b]">{row.lastError}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <input
              className="input-field max-w-[420px] flex-1"
              placeholder="https://ваш-сервис/slotix"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="button" className="wh-add" disabled={busy || !url.trim()} onClick={add}>
              Добавить
            </button>
          </div>
          {error && <div className="mt-2 text-[13px] text-[#c0392b]">{error}</div>}
        </>
      )}

      <style jsx>{`
        code { font-size: 12px; background: rgba(20, 30, 45, 0.06); padding: 1px 5px; border-radius: 5px; }
        .wh-mini { border: 1px solid rgba(20, 30, 45, 0.12); background: #fff; border-radius: 9px; padding: 6px 12px; font-size: 13px; cursor: pointer; color: var(--color-ink); }
        .wh-mini:disabled { opacity: 0.5; cursor: default; }
        .wh-del { color: #c0392b; }
        .wh-add { border: 0; background: var(--color-accent, #5094f0); color: #fff; border-radius: 10px; padding: 10px 20px; font: 500 14px/1 inherit; cursor: pointer; }
        .wh-add:disabled { opacity: 0.5; cursor: default; }
      `}</style>
    </section>
  );
}
