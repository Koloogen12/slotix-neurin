"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Ссылка неполная — не указан код подтверждения.");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/password-reset/confirm", { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сменить пароль. Ссылка могла устареть.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-[420px] p-9">
        <div className="mb-5 flex items-center justify-center gap-[10px]">
          <img src="/slotix/slotix-icon.png" alt="" className="h-[38px] w-[38px] rounded-[10px]" />
        </div>

        {!done ? (
          <>
            <h1 className="mb-[6px] text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">
              Новый пароль
            </h1>
            <p className="mb-[26px] text-center text-[14.5px] leading-[1.5] text-[var(--color-muted)]">
              Придумайте новый пароль для входа в Slotix
            </p>

            {error && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
              >
                {error}
              </div>
            )}

            {!token && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}
              >
                В ссылке не найден код подтверждения. Откройте ссылку из письма ещё раз.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
              <div>
                <label className="mb-[7px] block text-[13px] font-semibold text-[var(--color-ink)]">Новый пароль</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[13px] font-semibold text-[var(--color-ink)]">Повторите пароль</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full py-[15px] text-[15px]">
                {isSubmitting ? "Сохраняем…" : "Сохранить пароль"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)]">Пароль изменён</h1>
            <p className="mb-6 text-[14.5px] leading-[1.55] text-[var(--color-muted)]">
              Теперь вы можете войти в Slotix с новым паролем.
            </p>
            <a href="/" className="btn-primary block w-full py-[15px] text-[15px]">
              Вернуться на главную
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
