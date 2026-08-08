"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { api, ApiError, type Team, type TeamGroup, type ProposedSlots, type InternalMeeting, type PersonRef, type VideoProvider, type IntegrationsOverview } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useConfirm } from "@/components/confirm-dialog";

const DURATIONS = [15, 30, 60];
const PROVIDERS: Array<{ value: VideoProvider; label: string }> = [
  { value: "yandex_telemost", label: "Яндекс Телемост" },
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "phone", label: "Телефон" },
];
const PROVIDER_LABEL: Record<VideoProvider, string> = {
  yandex_telemost: "Яндекс Телемост",
  google_meet: "Google Meet",
  zoom: "Zoom",
  phone: "Телефон",
};
const RANGES: Array<{ label: string; days: number }> = [
  { label: "Эта неделя", days: 7 },
  { label: "2 недели", days: 14 },
  { label: "Месяц", days: 30 },
];

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz
}

function personName(p: PersonRef): string {
  return p.name ?? p.email;
}

function Avatar({ p, size = 34 }: { p: PersonRef; size?: number }) {
  if (p.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatarUrl} alt="" style={{ width: size, height: size }} className="flex-none rounded-full object-cover" />;
  }
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full font-bold text-(--color-link)"
      style={{ width: size, height: size, boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)", fontSize: size * 0.4 }}
    >
      {personName(p).charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamMeetingsView({ team, onGoToMembers }: { team: Team; onGoToMembers?: () => void }) {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<InternalMeeting[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUpcoming = () => {
    api
      .get<InternalMeeting[]>("/api/team/meetings/upcoming")
      .then(setMeetings)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить встречи"));
  };
  useEffect(loadUpcoming, []);

  if (creating) {
    return (
      <CreateMeetingFlow
        team={team}
        onGoToMembers={onGoToMembers}
        onDone={() => {
          setCreating(false);
          setMeetings(null);
          loadUpcoming();
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  if (openId) {
    return (
      <MeetingDetail
        meetingId={openId}
        onBack={() => setOpenId(null)}
        onCancelled={() => {
          setOpenId(null);
          setMeetings(null);
          loadUpcoming();
        }}
      />
    );
  }

  return (
    <div className="max-w-[720px]">
      <button type="button" onClick={() => setCreating(true)} className="btn-primary mb-6">
        ➕ Создать встречу команды
      </button>

      {error && <div className="glass-card p-5 text-sm" style={{ color: "var(--color-danger)" }}>{error}</div>}

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">Предстоящие</div>
      {!meetings ? (
        <div className="glass-card p-9 text-center text-sm text-(--color-muted)">Загрузка…</div>
      ) : meetings.length === 0 ? (
        <div className="glass-card p-9 text-center text-sm text-(--color-muted)">
          Пока нет встреч. Создайте первую — Slotix сам найдёт время, когда все свободны.
        </div>
      ) : (
        <div className="glass-card p-0">
          {meetings.map((m, i) => (
            <MeetingRow key={m.id} meeting={m} first={i === 0} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingRow({ meeting, first, onOpen }: { meeting: InternalMeeting; first: boolean; onOpen: () => void }) {
  const { user } = useAuth();
  const tz = user?.timezone ?? "Europe/Moscow";
  const when = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz,
  }).format(new Date(meeting.startAt));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/50"
      style={{ borderTop: first ? "none" : "1px solid rgba(20,30,45,.05)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-(--color-ink)">{meeting.title}</div>
        <div className="truncate text-xs text-(--color-muted)">
          {when}
          {meeting.provider ? ` · ${PROVIDER_LABEL[meeting.provider]}` : ""}
        </div>
      </div>
      <div className="flex flex-none -space-x-2">
        {meeting.participants.slice(0, 4).map((p) => (
          <Avatar key={p.user.id} p={p.user} size={28} />
        ))}
        {meeting.participants.length > 4 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-(--color-muted)" style={{ boxShadow: "0 0 0 1.5px var(--color-primary)" }}>
            +{meeting.participants.length - 4}
          </div>
        )}
      </div>
      <svg className="flex-none text-(--color-faint)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
    </button>
  );
}

function MeetingDetail({ meetingId, onBack, onCancelled }: { meetingId: string; onBack: () => void; onCancelled: () => void }) {
  const confirm = useConfirm();
  const { user } = useAuth();
  const tz = user?.timezone ?? "Europe/Moscow";
  const [meeting, setMeeting] = useState<InternalMeeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<InternalMeeting>(`/api/team/meetings/${meetingId}`)
      .then(setMeeting)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить встречу"));
  }, [meetingId]);

  const cancel = async () => {
    if (!(await confirm({ title: "Отменить встречу?", description: "Участники получат уведомление об отмене.", confirmLabel: "Отменить встречу", cancelLabel: "Не отменять" }))) return;
    setBusy(true);
    try {
      await api.delete(`/api/team/meetings/${meetingId}`);
      onCancelled();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отменить");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[560px]">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-(--color-muted)">← К встречам</button>
      {error && <div className="glass-card p-5 text-sm" style={{ color: "var(--color-danger)" }}>{error}</div>}
      {!meeting ? (
        <div className="glass-card p-9 text-center text-sm text-(--color-muted)">Загрузка…</div>
      ) : (
        <div className="glass-card p-7">
          <div className="mb-1 text-[22px] font-bold text-(--color-ink)">{meeting.title}</div>
          <div className="mb-5 text-sm text-(--color-muted)">
            {new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(meeting.startAt))}
            {meeting.durationMin ? ` · ${meeting.durationMin} мин` : ""}
          </div>

          <DetailRow label="Платформа" value={meeting.provider ? PROVIDER_LABEL[meeting.provider] : "не указана"} />
          <DetailRow
            label="Ссылка"
            value={
              meeting.channelLink ? (
                <a href={meeting.channelLink} target="_blank" rel="noopener noreferrer" className="text-(--color-link) underline">
                  Подключиться
                </a>
              ) : meeting.provider && meeting.provider !== "phone" ? (
                "создаётся автоматически (подключите платформу в Интеграциях)"
              ) : (
                "—"
              )
            }
          />
          {meeting.description && <DetailRow label="Повестка" value={<span className="whitespace-pre-wrap">{meeting.description}</span>} />}
          {meeting.recordEnabled && (
            <DetailRow
              label="AI-конспект"
              value={
                meeting.meetingNote?.status === "done" ? (
                  <a href="/cabinet/notes" className="text-(--color-link) underline">готов — открыть</a>
                ) : meeting.meetingNote ? (
                  "записывается…"
                ) : (
                  "будет записан ботом"
                )
              }
            />
          )}

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Участники ({meeting.participants.length})</div>
            <div className="flex flex-col gap-2">
              {meeting.participants.map((p) => (
                <div key={p.user.id} className="flex items-center gap-2.5">
                  <Avatar p={p.user} size={30} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-(--color-ink)">{personName(p.user)}</div>
                    <div className="truncate text-xs text-(--color-muted)">{p.user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {meeting.organizerId === user?.id && (
            <button type="button" onClick={cancel} disabled={busy} className="mt-6 text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
              Отменить встречу
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-white/60 py-2.5 text-sm first:border-t-0">
      <div className="w-24 flex-none text-(--color-muted)">{label}</div>
      <div className="min-w-0 flex-1 text-(--color-text-secondary)">{value}</div>
    </div>
  );
}

function CreateMeetingFlow({ team, onDone, onCancel, onGoToMembers }: { team: Team; onDone: () => void; onCancel: () => void; onGoToMembers?: () => void }) {
  const { user } = useAuth();
  const tz = user?.timezone ?? "Europe/Moscow";

  const others = useMemo(() => team.members.filter((m) => !m.isMe), [team.members]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState(30);
  const [rangeDays, setRangeDays] = useState(7);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<VideoProvider | null>(null);
  // Only offer platforms the organizer has actually connected — the server refuses the rest,
  // and a meeting on an unconnected platform would have no join link.
  const [connected, setConnected] = useState<Record<string, boolean> | null>(null);
  const [description, setDescription] = useState("");
  const [recordEnabled, setRecordEnabled] = useState(false);
  const joinable = provider === "google_meet" || provider === "zoom";
  const [groups, setGroups] = useState<TeamGroup[]>([]);

  const [proposed, setProposed] = useState<ProposedSlots | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<TeamGroup[]>("/api/team/groups").then(setGroups).catch(() => undefined);
    api
      .get<IntegrationsOverview>("/api/integrations")
      .then((d) =>
        setConnected({
          google_meet: d.google_meet.status === "on",
          zoom: d.zoom.status === "on",
          yandex_telemost: d.yandex_telemost.status === "on",
        }),
      )
      .catch(() => setConnected({}));
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const addGroup = (g: TeamGroup) =>
    setSelected((prev) => {
      const next = new Set(prev);
      g.members.forEach((m) => m.user.id !== user?.id && next.add(m.user.id));
      return next;
    });

  const propose = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<ProposedSlots>("/api/team/meetings/propose", {
        participantUserIds: [...selected],
        durationMin: duration,
        fromDate: todayISO(),
        days: rangeDays,
      });
      setProposed(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось подобрать время");
    } finally {
      setBusy(false);
    }
  };

  const pick = async (startAt: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.post<InternalMeeting>("/api/team/meetings", {
        title: title.trim() || undefined,
        participantUserIds: [...selected],
        durationMin: duration,
        startAt,
        provider: provider ?? undefined,
        description: description.trim() || undefined,
        recordEnabled: recordEnabled && joinable ? true : undefined,
      });
      setDone(true);
      setTimeout(onDone, 1400);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось создать встречу");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="glass-card max-w-[520px] p-9 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(63,203,110,.15)", color: "var(--color-success)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <div className="text-lg font-bold text-(--color-ink)">Встреча создана</div>
        <div className="mt-1 text-sm text-(--color-muted)">Уведомления ушли всем участникам.</div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px]">
      <button type="button" onClick={onCancel} className="mb-4 text-sm font-medium text-(--color-muted)">← Отмена</button>

      {error && (
        <div className="mb-4 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--color-danger-bg)", borderColor: "rgba(232,86,86,.3)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {others.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="mb-1 text-lg font-bold text-(--color-ink)">Пока вы в команде одни</div>
          <p className="mx-auto mb-5 max-w-[420px] text-sm text-(--color-muted)">
            Встреча команды подбирает время, когда свободны все участники. Пригласите коллег — и Slotix сам найдёт общий слот.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {team.canManage && onGoToMembers && (
              <button type="button" onClick={onGoToMembers} className="btn-primary py-2 text-sm">Пригласить коллег</button>
            )}
            <button type="button" onClick={onCancel} className="btn-secondary py-2 text-sm">Назад</button>
          </div>
        </div>
      ) : !proposed ? (
        <div className="glass-card p-6">
          <div className="mb-1 text-lg font-bold text-(--color-ink)">Кого зовём</div>
          <p className="mb-3 text-sm text-(--color-muted)">Выберите участников — Slotix найдёт время, когда все свободны.</p>

          {groups.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {groups.map((g) => (
                <button key={g.id} type="button" onClick={() => addGroup(g)} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(80,148,240,.12)", color: "var(--color-link)" }}>
                  + {g.name}
                </button>
              ))}
            </div>
          )}

          <div className="mb-5 flex flex-wrap gap-2">
            {others.map((m) => {
              const active = selected.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition-colors"
                  style={active ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}
                >
                  <Avatar p={m} size={26} />
                  {personName(m)}
                </button>
              );
            })}
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">Длительность</div>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => setDuration(d)} className="rounded-lg px-3 py-2 text-sm font-semibold" style={duration === d ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>
                    {d} мин
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">В пределах</div>
              <div className="flex gap-2">
                {RANGES.map((r) => (
                  <button key={r.days} type="button" onClick={() => setRangeDays(r.days)} className="rounded-lg px-3 py-2 text-sm font-semibold" style={rangeDays === r.days ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название (необязательно)"
            maxLength={200}
            className="mb-3 w-full rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)"
          />

          <div className="mb-3">
            <div className="mb-1.5 text-xs font-semibold text-(--color-muted)">Платформа</div>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => {
                const needsConnection = p.value !== "phone";
                if (needsConnection && connected && connected[p.value] !== true) {
                  return (
                    <Link
                      key={p.value}
                      href="/cabinet/integrations"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                      style={{ background: "rgba(255,255,255,.5)", border: "1px dashed #C9D4DE", color: "var(--color-muted)" }}
                    >
                      {p.label}
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "rgba(80,148,240,.12)", color: "var(--color-link)" }}>
                        Подключить
                      </span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setProvider(provider === p.value ? null : p.value)}
                    className="rounded-lg px-3 py-2 text-sm font-medium"
                    style={provider === p.value ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.7)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {provider && provider !== "phone" && (
              <div className="mt-1.5 text-xs text-(--color-muted)">Ссылка создастся автоматически и уйдёт участникам.</div>
            )}
          </div>

          {joinable && (
            <button
              type="button"
              onClick={() => setRecordEnabled((v) => !v)}
              className="mb-3 flex w-full items-center gap-3 rounded-xl border border-white/70 bg-white/60 px-4 py-3 text-left"
            >
              <span
                className="relative h-6 w-11 flex-none rounded-full transition-colors"
                style={{ background: recordEnabled ? "var(--color-primary)" : "rgba(20,30,45,.15)" }}
              >
                <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: recordEnabled ? 22 : 2 }} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-(--color-ink)">🤖 Записать AI-конспект</span>
                <span className="block text-xs text-(--color-muted)">Бот запишет встречу, расшифрует и пришлёт саммари. Тариф Pro.</span>
              </span>
            </button>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Повестка (необязательно)"
            rows={3}
            className="mb-4 w-full resize-y rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)"
          />

          <button type="button" onClick={propose} disabled={busy || selected.size === 0} className="btn-primary w-full disabled:opacity-50">
            {busy ? "Ищем время…" : "Найти время"}
          </button>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="mb-1 text-lg font-bold text-(--color-ink)">Когда все свободны</div>
          <p className="mb-4 text-sm text-(--color-muted)">
            {proposed.participants.length} участника · {duration} мин. Выберите слот — встреча создастся и уведомит всех.
          </p>
          {proposed.slots.length === 0 ? (
            <div className="rounded-xl bg-white/60 p-6 text-center text-sm text-(--color-muted)">
              Нет общего свободного времени в этом диапазоне. Попробуйте больше дней или меньше участников.
            </div>
          ) : (
            <SlotPicker slots={proposed.slots} tz={tz} busy={busy} onPick={pick} />
          )}
          <button type="button" onClick={() => setProposed(null)} className="mt-4 text-sm font-medium text-(--color-muted)">← Изменить участников</button>
        </div>
      )}
    </div>
  );
}

function SlotPicker({ slots, tz, busy, onPick }: { slots: { start: string; end: string }[]; tz: string; busy: boolean; onPick: (startAt: string) => void }) {
  // Group by calendar day for readability.
  const byDay = useMemo(() => {
    const map = new Map<string, { start: string; end: string }[]>();
    for (const s of slots) {
      const day = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(s.start));
      (map.get(day) ?? map.set(day, []).get(day)!).push(s);
    }
    return [...map.entries()];
  }, [slots, tz]);

  const time = (iso: string) => new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-4">
      {byDay.map(([day, daySlots]) => (
        <div key={day}>
          <div className="mb-2 text-xs font-semibold capitalize text-(--color-muted)">{day}</div>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((s) => (
              <button key={s.start} type="button" disabled={busy} onClick={() => onPick(s.start)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--color-primary)", color: "var(--color-link)", background: "rgba(255,255,255,.7)" }}>
                {time(s.start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
