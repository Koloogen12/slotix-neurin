"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, apiUrl, ApiError, type AiBalance, type MeetingNote, type MeetingNoteStatus } from "@/lib/api";

const STATUS_META: Record<MeetingNoteStatus, { label: string; bg: string; color: string; dot: string }> = {
  pending: { label: "В очереди", bg: "rgba(80,148,240,.12)", color: "#2F6FD0", dot: "#5094F0" },
  recording: { label: "Идёт запись", bg: "rgba(80,148,240,.12)", color: "#2F6FD0", dot: "#5094F0" },
  processing: { label: "Готовим конспект", bg: "rgba(245,185,61,.16)", color: "#C77E1A", dot: "#E0A93B" },
  done: { label: "Готово", bg: "rgba(63,203,110,.15)", color: "#2FA85A", dot: "#3FCB6E" },
  failed: { label: "Ошибка", bg: "rgba(232,86,86,.13)", color: "#D14343", dot: "#E85656" },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d);
}

function StatusChip({ status }: { status: MeetingNoteStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

/** Groups action items by owner — the "задачи по спикерам" of the landing copy. */
function actionsByOwner(items: MeetingNote["actionItems"]): Record<string, { task: string; due: string | null }[]> {
  const out: Record<string, { task: string; due: string | null }[]> = {};
  for (const it of items ?? []) {
    (out[it.owner] ??= []).push({ task: it.task, due: it.due });
  }
  return out;
}

function NoteCard({ note, onBack }: { note: MeetingNote; onBack: () => void }) {
  const grouped = useMemo(() => actionsByOwner(note.actionItems), [note.actionItems]);
  const who = note.booking?.clientName;

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--color-link)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Ко всем конспектам
      </button>

      <div className="glass-card !rounded-[24px] p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[22px] font-bold tracking-tight text-[var(--color-ink)]">
              {note.title ?? "Конспект встречи"}
            </div>
            <div className="mt-1.5 text-sm text-[var(--color-muted)]">
              {who ? `${who} · ` : ""}
              {formatWhen(note.createdAt)}
            </div>
          </div>
          <StatusChip status={note.status} />
        </div>

        {note.status !== "done" ? (
          <div className="rounded-2xl border border-white/70 bg-white/55 p-6 text-center text-sm text-[var(--color-muted)]">
            {note.status === "failed"
              ? "Не удалось подготовить конспект этой встречи."
              : "Конспект появится здесь, как только встреча закончится и запись обработается."}
          </div>
        ) : (
          <>
            {note.summary && (
              <div className="mb-6 rounded-2xl border border-white/70 bg-white/55 p-5 text-[15px] leading-relaxed whitespace-pre-line text-[var(--color-text-secondary)]">
                {note.summary}
              </div>
            )}

            {note.decisions.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 text-[13px] font-bold tracking-wide text-[var(--color-faint)] uppercase">Договорённости</div>
                <div className="flex flex-col gap-2.5">
                  {note.decisions.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg className="mt-0.5 flex-none text-[var(--color-success)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-[15px] leading-snug text-[var(--color-text-secondary)]">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(grouped).length > 0 && (
              <div>
                <div className="mb-3 text-[13px] font-bold tracking-wide text-[var(--color-faint)] uppercase">Задачи</div>
                <div className="flex flex-col gap-3">
                  {Object.entries(grouped).map(([owner, tasks]) => (
                    <div key={owner} className="rounded-2xl border border-white/70 bg-white/55 p-4">
                      <div className="mb-2 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "var(--color-primary-gradient)" }}>
                          {owner.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[14px] font-semibold text-[var(--color-ink)]">{owner}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 pl-9.5">
                        {tasks.map((t, i) => (
                          <div key={i} className="text-[14px] leading-snug text-[var(--color-text-secondary)]">
                            {t.task}
                            {t.due && <span className="ml-2 text-[12.5px] font-medium text-[var(--color-muted)]">· {t.due}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {note.followUpSuggested && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[rgba(80,148,240,.25)] bg-[rgba(80,148,240,.08)] p-4">
                <svg className="flex-none text-[var(--color-link)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
                </svg>
                <div className="text-[14px] leading-snug text-[var(--color-text-secondary)]">
                  {note.followUpSentAt
                    ? <>Клиенту отправлено предложение записаться{note.followUpTimeframe ? ` (${note.followUpTimeframe})` : ""}.</>
                    : <>На встрече договорились продолжить{note.followUpTimeframe ? ` — ${note.followUpTimeframe}` : ""}.</>}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3 border-t border-white/60 pt-5">
              <a
                href={apiUrl(`/api/notetaker/notes/${note.id}/summary.txt`)}
                className="btn-secondary inline-flex items-center gap-2 !px-4 !py-2.5 text-[13px]"
              >
                <DownloadIcon /> Конспект .txt
              </a>
              {note.provider !== "phone" && (
                <a
                  href={apiUrl(`/api/notetaker/notes/${note.id}/transcript.txt`)}
                  className="btn-secondary inline-flex items-center gap-2 !px-4 !py-2.5 text-[13px]"
                >
                  <DownloadIcon /> Транскрипт .txt
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
    </svg>
  );
}

export function NotesView() {
  const [notes, setNotes] = useState<MeetingNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MeetingNote | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [tg, setTg] = useState<{ linked: boolean; botUsername: string } | null>(null);
  const [balance, setBalance] = useState<AiBalance | null>(null);

  const load = () => {
    api
      .get<MeetingNote[]>("/api/notetaker/notes")
      .then(setNotes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить конспекты"));
  };

  useEffect(load, []);

  useEffect(() => {
    api.get<{ linked: boolean; botUsername: string }>("/api/telegram/status").then(setTg).catch(() => setTg(null));
    api.get<AiBalance>("/api/ai/balance").then(setBalance).catch(() => setBalance(null));
  }, []);

  async function connectTelegram() {
    const { url } = await api.post<{ url: string }>("/api/telegram/link");
    window.open(url, "_blank");
  }

  async function disconnectTelegram() {
    await api.delete("/api/telegram/link");
    setTg((t) => (t ? { ...t, linked: false } : t));
  }

  // Poll while anything is still in flight so the list reflects progress without a refresh.
  useEffect(() => {
    if (!notes?.some((n) => n.status === "pending" || n.status === "recording" || n.status === "processing")) return;
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [notes]);

  async function handleDispatch() {
    setDispatching(true);
    setDispatchError(null);
    try {
      await api.post("/api/notetaker/dispatch", { meetingUrl: meetingUrl.trim() });
      setMeetingUrl("");
      load();
      api.get<AiBalance>("/api/ai/balance").then(setBalance).catch(() => undefined);
    } catch (e) {
      setDispatchError(e instanceof ApiError ? e.message : "Не удалось отправить бота");
    } finally {
      setDispatching(false);
    }
  }

  if (selected) return <NoteCard note={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[var(--color-ink)]">AI-конспекты</h1>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        Бот записывает встречу и присылает конспект с задачами. Включите AI-конспект в формате встречи —
        или отправьте бота на свой звонок вручную.
      </p>

      {balance && (
        <div className="glass-card mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[20px] px-5 py-4">
          <span className="text-sm font-semibold" style={{ color: balance.remainingMinutes === 0 ? "var(--color-danger)" : "var(--color-ink)" }}>
            Осталось {Math.floor(balance.remainingMinutes / 60)} ч {balance.remainingMinutes % 60} мин
          </span>
          <span className="text-[13px] text-[var(--color-muted)]">
            В Телемосте минуты расходуются вдвое медленнее
          </span>
          <Link href="/cabinet/billing" className="ml-auto text-[13px] font-medium text-[var(--color-link)]">
            {balance.remainingMinutes === 0 ? "Докупить часы" : "Тариф и докупка"}
          </Link>
        </div>
      )}

      <div className="glass-card mb-6 rounded-[20px] p-5">
        <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Записать свою встречу</label>
        <p className="mb-2 text-[13px] text-[var(--color-muted)]">Ручная запись списывает 60 минут квоты.</p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="url"
            className="input-field flex-1"
            placeholder="Ссылка на Zoom или Google Meet"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary sm:w-auto sm:px-6"
            disabled={dispatching || meetingUrl.trim().length === 0}
            onClick={handleDispatch}
          >
            {dispatching ? "Отправляем…" : "Отправить бота"}
          </button>
        </div>
        {dispatchError && <div className="mt-2 text-sm font-medium text-[var(--color-danger)]">{dispatchError}</div>}
      </div>

      {tg && (
        <div className="glass-card mb-6 flex items-center justify-between gap-4 rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl" style={{ background: "rgba(80,148,240,.12)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F6FD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4L3 11l6 2.5L18 7l-6.5 8 8-9z" />
              </svg>
            </span>
            <div>
              <div className="text-[15px] font-semibold text-[var(--color-ink)]">Telegram</div>
              <div className="text-[13px] text-[var(--color-muted)]">
                {tg.linked ? "Подключён — конспекты приходят и сюда" : "Получайте конспекты встреч прямо в Telegram"}
              </div>
            </div>
          </div>
          {tg.linked ? (
            <button type="button" onClick={disconnectTelegram} className="btn-secondary flex-none !px-4 !py-2 text-[13px]">
              Отключить
            </button>
          ) : (
            <button type="button" onClick={connectTelegram} className="btn-primary flex-none !px-4 !py-2 text-[13px]">
              Подключить
            </button>
          )}
        </div>
      )}

      {error && <div className="glass-card mb-5 p-4 text-sm text-[var(--color-danger)]">{error}</div>}

      {notes === null ? (
        <div className="py-10 text-center text-sm text-[var(--color-muted)]">Загрузка…</div>
      ) : notes.length === 0 ? (
        <div className="glass-card rounded-[20px] p-10 text-center text-sm text-[var(--color-muted)]">
          Пока нет ни одного конспекта. Они появятся после первой записанной встречи.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelected(n)}
              className="glass-card flex cursor-pointer items-center justify-between gap-4 rounded-[18px] p-5 text-left"
            >
              <div className="min-w-0">
                <div className="truncate text-[16px] font-semibold text-[var(--color-ink)]">
                  {n.title ?? (n.status === "done" ? "Конспект встречи" : "Встреча записывается…")}
                </div>
                <div className="mt-1 truncate text-[13px] text-[var(--color-muted)]">
                  {n.booking?.clientName ? `${n.booking.clientName} · ` : ""}
                  {formatWhen(n.createdAt)}
                </div>
              </div>
              <StatusChip status={n.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
