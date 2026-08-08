"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type Team, type TeamGroup } from "@/lib/api";
import { useConfirm } from "@/components/confirm-dialog";

function Avatar({ name, avatarUrl, size = 24 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" style={{ width: size, height: size }} className="flex-none rounded-full object-cover" />;
  }
  return (
    <div className="flex flex-none items-center justify-center rounded-full text-[10px] font-bold text-(--color-link)" style={{ width: size, height: size, boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)" }}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamGroupsManager({ team }: { team: Team }) {
  const confirm = useConfirm();
  const [groups, setGroups] = useState<TeamGroup[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TeamGroup[]>("/api/team/groups").then(setGroups).catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить группы"));
  }, []);

  const run = async (p: Promise<TeamGroup[]>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      setGroups(await p);
      after?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const create = () => {
    if (!name.trim()) return;
    run(api.post<TeamGroup[]>("/api/team/groups", { name: name.trim() }), () => setName(""));
  };

  return (
    <div className="glass-card p-5">
      <div className="mb-1 text-sm font-semibold text-(--color-ink)">Группы</div>
      <p className="mb-4 text-sm text-(--color-muted)">
        Объедините участников в группы (Продукт, Разработка…) — при создании встречи их можно добавить одним тапом.
      </p>

      {error && <div className="mb-3 text-sm font-semibold" style={{ color: "var(--color-danger)" }}>{error}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Название группы"
          maxLength={80}
          className="min-w-[180px] flex-1 rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary)"
        />
        <button type="button" onClick={create} disabled={busy || !name.trim()} className="btn-primary py-2.5 text-sm disabled:opacity-50">
          Создать
        </button>
      </div>

      {groups === null ? (
        <div className="text-sm text-(--color-muted)">Загрузка…</div>
      ) : groups.length === 0 ? (
        <div className="text-sm text-(--color-muted)">Пока нет групп.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) =>
            editing === g.id ? (
              <GroupEditor
                key={g.id}
                group={g}
                team={team}
                busy={busy}
                onSave={(userIds) => run(api.put<TeamGroup[]>(`/api/team/groups/${g.id}/members`, { userIds }), () => setEditing(null))}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div key={g.id} className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-(--color-ink)">{g.name}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {g.members.length === 0 ? (
                      <span className="text-xs text-(--color-muted)">нет участников</span>
                    ) : (
                      <>
                        <div className="flex -space-x-1.5">
                          {g.members.slice(0, 5).map((m) => (
                            <Avatar key={m.user.id} name={m.user.name} avatarUrl={m.user.avatarUrl} />
                          ))}
                        </div>
                        <span className="text-xs text-(--color-muted)">{g.members.length}</span>
                      </>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => setEditing(g.id)} className="text-xs font-medium text-(--color-link)">
                  Изменить
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => { if (await confirm({ title: `Удалить группу «${g.name}»?`, description: "Участники останутся в команде — удалится только группа." })) run(api.delete<TeamGroup[]>(`/api/team/groups/${g.id}`)); }}
                  className="text-xs font-medium"
                  style={{ color: "var(--color-danger)" }}
                >
                  Удалить
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function GroupEditor({
  group,
  team,
  busy,
  onSave,
  onCancel,
}: {
  group: TeamGroup;
  team: Team;
  busy: boolean;
  onSave: (userIds: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(group.members.map((m) => m.user.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="rounded-xl border border-white/70 bg-white/70 p-4">
      <div className="mb-2 text-sm font-semibold text-(--color-ink)">{group.name} — участники</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {team.members.map((m) => {
          const active = selected.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium"
              style={active ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,.8)", color: "var(--color-text-secondary)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)" }}
            >
              <Avatar name={m.name} avatarUrl={m.avatarUrl} size={22} />
              {m.name ?? m.email}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave([...selected])} disabled={busy} className="btn-primary py-2 text-xs disabled:opacity-50">
          Сохранить
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-2 text-xs">
          Отмена
        </button>
      </div>
    </div>
  );
}
