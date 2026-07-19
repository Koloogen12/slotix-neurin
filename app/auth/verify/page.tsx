"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, type Me } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Status = "verifying" | "error";

function redirectPathFor(user: Me): string {
  return user.slug.startsWith("tmp-") ? "/onboarding" : "/cabinet/formats";
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!email || !token) {
      setStatus("error");
      setError("Ссылка неполная — не указан email или код подтверждения.");
      return;
    }

    (async () => {
      try {
        const { user } = await api.post<{ user: Me }>("/api/auth/passwordless/verify", {
          email,
          codeOrToken: token,
        });
        await refresh();
        router.replace(redirectPathFor(user));
      } catch (err) {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Не удалось подтвердить вход. Попробуйте войти заново.");
      }
    })();
  }, [email, token, refresh, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-[420px] p-9 text-center">
        <div className="mb-5 flex items-center justify-center gap-[10px]">
          <img src="/slotix/slotix-icon.png" alt="" className="h-[38px] w-[38px] rounded-[10px]" />
        </div>

        {status === "verifying" && (
          <>
            <h1 className="mb-2 text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">Входим в аккаунт…</h1>
            <p className="text-[14.5px] leading-[1.5] text-[var(--color-muted)]">Проверяем вашу ссылку, это займёт пару секунд.</p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">Ссылка недействительна</h1>
            <p className="mb-6 text-[14.5px] leading-[1.5] text-[var(--color-muted)]">{error}</p>
            <a href="/" className="btn-primary block w-full py-[15px] text-[15px]">
              Вернуться на главную
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <VerifyContent />
    </Suspense>
  );
}
