"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, type InvitationPreview, type Team } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { rememberPostAuthRedirect } from "@/lib/post-auth-redirect";

export function InviteView({ token }: { token: string }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const autoAccepted = useRef(false);

  useEffect(() => {
    api
      .get<InvitationPreview>(`/api/invitations/${encodeURIComponent(token)}`)
      .then(setPreview)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Приглашение недействительно"));
  }, [token]);

  const accept = useCallback(async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post<Team>("/api/team/invitations/accept", { token });
      // Hold this state until the navigation lands: accepting consumes the token, so a
      // re-fetched preview would 404 and flash "приглашение недоступно" at someone who
      // has in fact just joined.
      setAccepted(true);
      router.push("/cabinet/team");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось принять приглашение");
      setAccepting(false);
    }
  }, [token, router]);

  const emailMismatch = !!(user && preview && user.email.toLowerCase() !== preview.email.toLowerCase());

  // Coming back from signup/login on this very page, the person already expressed intent by
  // opening the invite — make the round trip end where they expected instead of asking them
  // to press one more button.
  useEffect(() => {
    if (autoAccepted.current) return;
    if (!user || !preview || emailMismatch || accepting) return;
    if (!authOpen && sessionStorage.getItem(`invite-intent:${token}`) === "1") {
      autoAccepted.current = true;
      sessionStorage.removeItem(`invite-intent:${token}`);
      void accept();
    }
  }, [user, preview, emailMismatch, accepting, authOpen, token, accept]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="glass-card p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slotix/slotix-icon.png" alt="" className="mx-auto mb-5 h-11 w-11 rounded-xl" />

          {accepted || accepting ? (
            <>
              <div className="mb-2 text-[20px] font-bold text-(--color-ink)">Готово!</div>
              <div className="text-sm text-(--color-muted)">Открываем команду…</div>
            </>
          ) : error && !preview ? (
            <>
              <div className="mb-2 text-[20px] font-bold text-(--color-ink)">Приглашение недоступно</div>
              <div className="mb-6 text-sm text-(--color-muted)">{error}</div>
              <Link href="/" className="btn-secondary">
                На главную
              </Link>
            </>
          ) : !preview ? (
            <div className="text-sm text-(--color-muted)">Загрузка…</div>
          ) : (
            <>
              <div className="mb-2 text-[22px] font-bold text-(--color-ink)">Приглашение в команду</div>
              <div className="mb-6 text-sm text-(--color-text-secondary)">
                Вас приглашают присоединиться к команде{" "}
                <span className="font-semibold text-(--color-ink)">«{preview.orgName}»</span> в SLOTIX.
              </div>

              {error && (
                <div
                  className="mb-4 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--color-danger-bg)", borderColor: "rgba(232,86,86,.3)", color: "var(--color-danger)" }}
                >
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-sm text-(--color-muted)">Проверяем вход…</div>
              ) : !user ? (
                <>
                  <div className="mb-4 rounded-xl bg-white/60 px-4 py-3 text-sm text-(--color-text-secondary)">
                    Создайте аккаунт с адресом{" "}
                    <span className="font-semibold text-(--color-ink)">{preview.email}</span> — и сразу попадёте в команду.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem(`invite-intent:${token}`, "1");
                      rememberPostAuthRedirect(`/invite/${encodeURIComponent(token)}`);
                      setAuthOpen(true);
                    }}
                    className="btn-primary w-full"
                  >
                    Зарегистрироваться и вступить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem(`invite-intent:${token}`, "1");
                      rememberPostAuthRedirect(`/invite/${encodeURIComponent(token)}`);
                      setAuthOpen(true);
                    }}
                    className="mt-2 w-full text-sm font-medium text-(--color-link)"
                  >
                    У меня уже есть аккаунт
                  </button>
                </>
              ) : emailMismatch ? (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
                  Вы вошли как {user.email}, а приглашение отправлено на {preview.email}. Войдите под нужным аккаунтом.
                </div>
              ) : (
                <button type="button" onClick={accept} disabled={accepting} className="btn-primary w-full disabled:opacity-50">
                  {accepting ? "Присоединяемся…" : "Принять приглашение"}
                </button>
              )}
            </>
          )}
        </div>
        <div className="mt-6 text-center text-xs text-(--color-faint)">Работает на SLOTIX</div>
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode="signup"
          initialEmail={preview?.email}
          redirectTo={`/invite/${encodeURIComponent(token)}`}
        />
      </div>
    </div>
  );
}
