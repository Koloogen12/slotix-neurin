"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type Team, type MembershipRole } from "@/lib/api";
import { useConfirm } from "@/components/confirm-dialog";
import { TeamMeetingsView } from "./TeamMeetingsView";
import { TeamGroupsManager } from "./TeamGroupsManager";
import { TeamFormatsManager } from "./TeamFormatsManager";

const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
};

function RoleBadge({ role }: { role: MembershipRole }) {
  const style =
    role === "owner"
      ? { color: "var(--color-link)", background: "rgba(80,148,240,.14)" }
      : role === "admin"
        ? { color: "#a05a00", background: "rgba(245,185,61,.18)" }
        : { color: "var(--color-muted)", background: "rgba(92,110,125,.12)" };
  return (
    <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={style}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function Avatar({ name, avatarUrl, size = 40 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name ?? ""} style={{ width: size, height: size }} className="flex-none rounded-full object-cover" />;
  }
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full font-bold text-(--color-link)"
      style={{ width: size, height: size, boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)", fontSize: size * 0.36 }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamView() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Team | null>("/api/team")
      .then((t) => setTeam(t))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить команду"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-card p-9 text-center text-sm text-(--color-muted)">Загрузка…</div>;
  }

  return (
    <div className="pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-tight text-(--color-ink)">Команда</h1>
      <p className="mb-6 max-w-[560px] text-sm text-(--color-muted)">
        Объедините специалистов в команду, чтобы вместе вести встречи и видеть общую статистику.
      </p>

      {error && (
        <div
          className="mb-5 rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--color-danger-bg)", borderColor: "rgba(232,86,86,.3)", color: "var(--color-danger)" }}
        >
          {error}
        </div>
      )}

      {team ? (
        <TeamTabs team={team} onChange={setTeam} setError={setError} />
      ) : (
        <CreateTeam onCreated={setTeam} setError={setError} />
      )}
    </div>
  );
}

type Tab = "members" | "internal" | "formats";

function TeamTabs({
  team,
  onChange,
  setError,
}: {
  team: Team;
  onChange: (t: Team) => void;
  setError: (e: string | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("internal");

  // The team section is the internal-coordination workspace: schedule meetings + manage people.
  // (Booking-source / round-robin analytics belong to the external studio product, not here.)
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "internal", label: "Встречи" },
    { key: "members", label: "Участники" },
    ...(team.canManage ? ([{ key: "formats", label: "Форматы студии" }] as Array<{ key: Tab; label: string }>) : []),
  ];

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="whitespace-nowrap rounded-[11px] px-4 py-2.5 text-sm font-semibold"
              style={
                tab === t.key
                  ? { background: "rgba(80,148,240,.12)", color: "var(--color-link)" }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "internal" && <TeamMeetingsView team={team} onGoToMembers={() => setTab("members")} />}
      {tab === "members" && <TeamManage team={team} onChange={onChange} setError={setError} />}
      {tab === "formats" && <TeamFormatsManager team={team} onTeamChange={onChange} />}
    </div>
  );
}


function CreateTeam({ onCreated, setError }: { onCreated: (t: Team) => void; setError: (e: string | null) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const t = await api.post<Team>("/api/team", { name: name.trim() });
      onCreated(t);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось создать команду");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card max-w-[480px] p-7">
      <div className="mb-1 text-lg font-bold text-(--color-ink)">Создайте команду</div>
      <p className="mb-5 text-sm text-(--color-muted)">Вы станете владельцем и сможете приглашать коллег по email.</p>
      <label className="mb-1.5 block text-sm font-semibold text-(--color-ink)">Название команды</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Например, Студия психологии"
        maxLength={100}
        className="mb-4 w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm outline-none focus:border-(--color-primary)"
      />
      <button type="button" onClick={submit} disabled={!name.trim() || busy} className="btn-primary w-full disabled:opacity-50">
        {busy ? "Создаём…" : "Создать команду"}
      </button>
    </div>
  );
}

function TeamManage({
  team,
  onChange,
  setError,
}: {
  team: Team;
  onChange: (t: Team) => void;
  setError: (e: string | null) => void;
}) {
  const confirm = useConfirm();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.org.name);
  const [invited, setInvited] = useState<string | null>(null);

  const run = async (fn: () => Promise<Team | { ok: true }>, onOk?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res && "org" in res) onChange(res);
      onOk?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const invite = () =>
    run(
      () => api.post<Team>("/api/team/invitations", { email: inviteEmail.trim(), role: inviteRole }),
      () => {
        setInvited(inviteEmail.trim());
        setInviteEmail("");
      },
    );

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      {/* Header */}
      <div className="glass-card flex items-center gap-3 p-5">
        {editingName && team.canManage ? (
          <>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={100}
              className="min-w-0 flex-1 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none focus:border-(--color-primary)"
            />
            <button
              type="button"
              className="btn-primary py-2 text-xs"
              disabled={busy || !nameDraft.trim()}
              onClick={() => run(() => api.patch<Team>("/api/team", { name: nameDraft.trim() }), () => setEditingName(false))}
            >
              Сохранить
            </button>
            <button type="button" className="btn-secondary py-2 text-xs" onClick={() => { setEditingName(false); setNameDraft(team.org.name); }}>
              Отмена
            </button>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold text-(--color-ink)">{team.org.name}</div>
              <div className="text-xs text-(--color-muted)">
                {team.members.length} {team.members.length === 1 ? "участник" : "участников"} · вы — {ROLE_LABELS[team.myRole].toLowerCase()}
              </div>
            </div>
            {team.canManage && (
              <button type="button" className="btn-secondary py-2 text-xs" onClick={() => setEditingName(true)}>
                Переименовать
              </button>
            )}
          </>
        )}
      </div>

      {/* Invite */}
      {team.canManage && (
        <div className="glass-card p-5">
          <div className="mb-3 text-sm font-semibold text-(--color-ink)">Пригласить в команду</div>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInvited(null); }}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="email@коллеги.ru"
              className="min-w-[200px] flex-1 rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
              className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-(--color-primary)"
            >
              <option value="member">Участник</option>
              <option value="admin">Администратор</option>
            </select>
            <button type="button" onClick={invite} disabled={busy || !inviteEmail.trim()} className="btn-primary py-2.5 text-sm disabled:opacity-50">
              Пригласить
            </button>
          </div>
          {invited && (
            <div className="mt-3 text-sm font-medium" style={{ color: "var(--color-success)" }}>
              Приглашение отправлено на {invited}
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="glass-card p-0">
        <div className="border-b border-white/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">
          Участники
        </div>
        {team.members.map((m, i) => (
          <div
            key={m.membershipId}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ borderTop: i === 0 ? "none" : "1px solid rgba(20,30,45,.05)" }}
          >
            <Avatar name={m.name} avatarUrl={m.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-(--color-ink)">{m.name ?? m.email}</span>
                {m.isMe && <span className="text-xs text-(--color-muted)">(вы)</span>}
              </div>
              <div className="truncate text-xs text-(--color-muted)">{m.email}</div>
            </div>
            <RoleBadge role={m.role} />
            {team.canManage && !m.isMe && m.role !== "owner" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => api.delete<Team>(`/api/team/members/${m.membershipId}`))}
                className="text-xs font-medium"
                style={{ color: "var(--color-danger)" }}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {team.canManage && team.pendingInvitations.length > 0 && (
        <div className="glass-card p-0">
          <div className="border-b border-white/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">
            Приглашения ожидают ответа
          </div>
          {team.pendingInvitations.map((inv, i) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(20,30,45,.05)" }}
            >
              <div className="min-w-0 flex-1 truncate text-sm text-(--color-text-secondary)">{inv.email}</div>
              <RoleBadge role={inv.role} />
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => api.delete<Team>(`/api/team/invitations/${inv.id}`))}
                className="text-xs font-medium"
                style={{ color: "var(--color-danger)" }}
              >
                Отозвать
              </button>
            </div>
          ))}
        </div>
      )}

      {team.canManage && <TeamGroupsManager team={team} />}

      {/* Danger zone */}
      <div className="flex justify-end">
        {team.myRole === "owner" ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await confirm({ title: "Удалить команду?", description: "Это действие необратимо: пропадут группы, форматы студии и её публичная страница." })) {
                run(() => api.delete<{ ok: true }>("/api/team"), () => location.reload());
              }
            }}
            className="text-sm font-semibold"
            style={{ color: "var(--color-danger)" }}
          >
            Удалить команду
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await confirm({ title: "Покинуть команду?", description: "Вы потеряете доступ к встречам и форматам команды.", confirmLabel: "Покинуть" })) {
                run(() => api.post<{ ok: true }>("/api/team/leave"), () => location.reload());
              }
            }}
            className="text-sm font-semibold"
            style={{ color: "var(--color-danger)" }}
          >
            Покинуть команду
          </button>
        )}
      </div>
    </div>
  );
}
