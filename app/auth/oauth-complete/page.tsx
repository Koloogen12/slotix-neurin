"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Me } from "@/lib/api";

function redirectPathFor(user: Me): string {
  return user.slug.startsWith("tmp-") ? "/onboarding" : "/cabinet/formats";
}

// Google/Yandex OAuth login lands here after the backend's callback already set the
// session cookie — unlike the email magic-link flow (app/auth/verify), there's no token
// to exchange, just a cookie to notice. Without this page, the backend's redirect used to
// land on the bare marketing homepage, which has no logged-in-state check of its own — a
// successful OAuth login looked identical to nothing happening at all.
export default function OAuthCompletePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [failed, setFailed] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      const user = await refresh();
      if (user) {
        router.replace(redirectPathFor(user));
      } else {
        setFailed(true);
      }
    })();
  }, [refresh, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-[420px] p-9 text-center">
        <div className="mb-5 flex items-center justify-center gap-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slotix/slotix-icon.png" alt="" className="h-[38px] w-[38px] rounded-[10px]" />
        </div>

        {!failed ? (
          <>
            <h1 className="mb-2 text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">Входим в аккаунт…</h1>
            <p className="text-[14.5px] leading-[1.5] text-[var(--color-muted)]">Это займёт пару секунд.</p>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">Не удалось войти</h1>
            <p className="mb-6 text-[14.5px] leading-[1.5] text-[var(--color-muted)]">Попробуйте войти ещё раз.</p>
            <a href="/" className="btn-primary block w-full py-[15px] text-[15px]">
              Вернуться на главную
            </a>
          </>
        )}
      </div>
    </div>
  );
}
