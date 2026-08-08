"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, apiUrl, ApiError, type Me } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AuthModalMode = "login" | "signup";

type View = "login" | "signup" | "passwordless-request" | "passwordless-verify" | "reset-request" | "reset-sent";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: AuthModalMode;
  initialEmail?: string;
  /** Where to land after a successful auth. Defaults to the cabinet; the invite page passes
   * its own URL so an invited person isn't bounced away from what they were doing. */
  redirectTo?: string;
}

function redirectPathFor(user: Me): string {
  return user.slug.startsWith("tmp-") ? "/onboarding" : "/cabinet/formats";
}

export function AuthModal({ isOpen, onClose, initialMode, initialEmail, redirectTo }: AuthModalProps) {
  const router = useRouter();
  const { refresh } = useAuth();

  const [view, setView] = useState<View>(initialMode);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setView(initialMode);
    setEmail(initialEmail ?? "");
    setPassword("");
    setCode("");
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, initialMode, initialEmail]);

  if (!isOpen) return null;

  async function completeAuth(user: Me) {
    await refresh();
    onClose();
    // Onboarding still wins for a brand-new account — it has to pick a slug before anything
    // else works — but otherwise honour the caller's destination.
    const needsOnboarding = user.slug.startsWith("tmp-");
    router.push(redirectTo && !needsOnboarding ? redirectTo : redirectPathFor(user));
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user } = await api.post<{ user: Me }>("/api/auth/login", { email, password });
      await completeAuth(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/passwordless/request", { email });
      setView("passwordless-verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить письмо. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user } = await api.post<{ user: Me }>("/api/auth/passwordless/verify", {
        email,
        codeOrToken: code,
      });
      await completeAuth(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Неверный или истёкший код. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/password-reset/request", { email });
      setView("reset-sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить письмо. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(20,32,54,.42)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card relative w-full max-w-[420px] box-border"
        style={{ background: "rgba(255,255,255,.9)", padding: "36px 32px" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-[18px] right-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[var(--color-text-secondary-2)] hover:text-[var(--color-ink)] cursor-pointer"
          style={{ background: "rgba(120,132,148,.12)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center justify-center gap-[10px] mb-[18px]">
          <img src="/slotix/slotix-icon.png" alt="" className="w-[38px] h-[38px] rounded-[10px]" />
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
          >
            {error}
          </div>
        )}

        {view === "login" && (
          <LoginView
            email={email}
            password={password}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onGoReset={() => {
              setError(null);
              setView("reset-request");
            }}
            onGoPasswordless={() => {
              setError(null);
              setView("passwordless-request");
            }}
            onGoSignup={() => {
              setError(null);
              setView("signup");
            }}
          />
        )}

        {view === "signup" && (
          <SignupView
            email={email}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onSubmit={handleRequestCode}
            onGoLogin={() => {
              setError(null);
              setView("login");
            }}
          />
        )}

        {view === "passwordless-request" && (
          <PasswordlessRequestView
            email={email}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onSubmit={handleRequestCode}
            onBack={() => {
              setError(null);
              setView("login");
            }}
          />
        )}

        {view === "passwordless-verify" && (
          <PasswordlessVerifyView
            email={email}
            code={code}
            isSubmitting={isSubmitting}
            onCodeChange={setCode}
            onSubmit={handleVerifyCode}
            onBack={() => {
              setError(null);
              setView("login");
            }}
          />
        )}

        {view === "reset-request" && (
          <ResetRequestView
            email={email}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onSubmit={handleRequestReset}
            onGoLogin={() => {
              setError(null);
              setView("login");
            }}
          />
        )}

        {view === "reset-sent" && (
          <ResetSentView
            onGoLogin={() => {
              setError(null);
              setView("login");
            }}
          />
        )}
      </div>
    </div>
  );
}

function OAuthButtons() {
  return (
    <div className="flex flex-col gap-[10px]">
      <a
        href={apiUrl("/api/auth/google")}
        className="flex w-full items-center justify-center gap-[11px] rounded-[13px] border border-[#D6DEE9] bg-white py-[13px] text-[14.5px] font-semibold text-[var(--color-ink)] hover:bg-[#F7FAFE] hover:border-[#C3D0E0]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.8 3.2-7.8z" />
          <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1-3.6 1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1a11 11 0 0 0-9.7 6l3.7 2.8c.9-2.5 3.2-4.4 6-4.4z" />
        </svg>
        Войти с помощью Google
      </a>
      <a
        href={apiUrl("/api/auth/yandex")}
        className="flex w-full items-center justify-center gap-[11px] rounded-[13px] border border-[#D6DEE9] bg-white py-[13px] text-[14.5px] font-semibold text-[var(--color-ink)] hover:bg-[#F7FAFE] hover:border-[#C3D0E0]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
          <path
            fill="#fff"
            d="M13.32 6.5h-1.24c-2.22 0-3.39 1.13-3.39 2.78 0 1.87 0.8 2.74 2.46 3.87l-2.71 4.05h1.98l2.44-3.66-.99-.66c-1.2-.82-1.79-1.46-1.79-2.68 0-1.08.76-1.81 2.01-1.81h.83v8.81h1.79V6.5z"
          />
        </svg>
        Войти с помощью Яндекс ID
      </a>
    </div>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-[14px] my-5">
      <span className="flex-1 h-px" style={{ background: "rgba(20,30,45,.1)" }} />
      <span className="text-[12.5px] font-medium text-[var(--color-faint)]">{text}</span>
      <span className="flex-1 h-px" style={{ background: "rgba(20,30,45,.1)" }} />
    </div>
  );
}

function LoginView({
  email,
  password,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoReset,
  onGoPasswordless,
  onGoSignup,
}: {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onGoReset: () => void;
  onGoPasswordless: () => void;
  onGoSignup: () => void;
}) {
  return (
    <div>
      <h3 className="text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-[6px]">
        С возвращением
      </h3>
      <p className="text-center text-[14.5px] text-[var(--color-muted)] mb-[26px]">
        Войдите, чтобы управлять расписанием
      </p>

      <OAuthButtons />
      <Divider text="или по email" />

      <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--color-ink)] mb-[7px]">Email</label>
          <input
            type="email"
            required
            placeholder="you@mail.ru"
            className="input-field"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-[7px]">
            <label className="text-[13px] font-semibold text-[var(--color-ink)]">Пароль</label>
            <button
              type="button"
              onClick={onGoReset}
              className="text-[12.5px] font-medium cursor-pointer"
              style={{ color: "var(--color-primary)" }}
            >
              Забыли пароль?
            </button>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="input-field"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2 py-[15px] text-[15px]">
          {isSubmitting ? "Входим…" : "Войти"}
        </button>
      </form>

      <div className="text-center mt-4">
        <button type="button" onClick={onGoPasswordless} className="text-[14px] font-semibold cursor-pointer" style={{ color: "var(--color-link)" }}>
          Войти по ссылке
        </button>
      </div>

      <div className="text-center mt-5 text-[14px] text-[var(--color-muted)]">
        Нет аккаунта?{" "}
        <button type="button" onClick={onGoSignup} className="font-semibold cursor-pointer" style={{ color: "var(--color-link)" }}>
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}

function SignupView({
  email,
  isSubmitting,
  onEmailChange,
  onSubmit,
  onGoLogin,
}: {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onGoLogin: () => void;
}) {
  return (
    <div>
      <h3 className="text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-[6px]">
        Регистрация в Slotix
      </h3>
      <p className="text-center text-[14.5px] leading-[1.5] text-[var(--color-muted)] mb-[26px]">
        Для регистрации нужен только email — пришлём код для входа
      </p>

      <OAuthButtons />
      <Divider text="или по email" />

      <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--color-ink)] mb-[7px]">Email</label>
          <input
            type="email"
            required
            placeholder="you@mail.ru"
            className="input-field"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2 py-[15px] text-[15px]">
          {isSubmitting ? "Отправляем…" : "Получить код"}
        </button>
      </form>

      <div className="text-center mt-5 text-[14px] text-[var(--color-muted)]">
        Уже есть аккаунт?{" "}
        <button type="button" onClick={onGoLogin} className="font-semibold cursor-pointer" style={{ color: "var(--color-link)" }}>
          Войти
        </button>
      </div>
    </div>
  );
}

function PasswordlessRequestView({
  email,
  isSubmitting,
  onEmailChange,
  onSubmit,
  onBack,
}: {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h3 className="text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-[6px]">
        Вход по ссылке
      </h3>
      <p className="text-center text-[14.5px] leading-[1.5] text-[var(--color-muted)] mb-[26px]">
        Введите email — пришлём ссылку и код для входа
      </p>
      <form onSubmit={onSubmit}>
        <label className="block text-[13px] font-semibold text-[var(--color-ink)] mb-[7px]">Email</label>
        <input
          type="email"
          required
          placeholder="you@mail.ru"
          className="input-field"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-[22px] py-[15px] text-[15px]">
          {isSubmitting ? "Отправляем…" : "Отправить код"}
        </button>
      </form>
      <div className="text-center mt-5">
        <button type="button" onClick={onBack} className="text-[14px] font-semibold cursor-pointer" style={{ color: "var(--color-muted)" }}>
          ← Вернуться ко входу
        </button>
      </div>
    </div>
  );
}

function PasswordlessVerifyView({
  email,
  code,
  isSubmitting,
  onCodeChange,
  onSubmit,
  onBack,
}: {
  email: string;
  code: string;
  isSubmitting: boolean;
  onCodeChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h3 className="text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-[6px]">
        Проверьте почту
      </h3>
      <p className="text-center text-[14.5px] leading-[1.5] text-[var(--color-muted)] mb-[26px]">
        Мы отправили письмо на <strong className="text-[var(--color-ink)]">{email}</strong>. Перейдите по ссылке
        из письма или введите 6-значный код ниже.
      </p>
      <form onSubmit={onSubmit}>
        <label className="block text-[13px] font-semibold text-[var(--color-ink)] mb-[7px]">Код из письма</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          placeholder="000000"
          className="input-field text-center tracking-[0.4em] font-semibold"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-[22px] py-[15px] text-[15px]">
          {isSubmitting ? "Проверяем…" : "Подтвердить"}
        </button>
      </form>
      <div className="text-center mt-5">
        <button type="button" onClick={onBack} className="text-[14px] font-semibold cursor-pointer" style={{ color: "var(--color-muted)" }}>
          ← Вернуться ко входу
        </button>
      </div>
    </div>
  );
}

function ResetRequestView({
  email,
  isSubmitting,
  onEmailChange,
  onSubmit,
  onGoLogin,
}: {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onGoLogin: () => void;
}) {
  return (
    <div>
      <h3 className="text-center text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-[6px]">
        Восстановление пароля
      </h3>
      <p className="text-center text-[14.5px] leading-[1.5] text-[var(--color-muted)] mb-[26px]">
        Введите email — пришлём ссылку для смены пароля
      </p>
      <form onSubmit={onSubmit}>
        <label className="block text-[13px] font-semibold text-[var(--color-ink)] mb-[7px]">Email</label>
        <input
          type="email"
          required
          placeholder="you@mail.ru"
          className="input-field"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-[22px] py-[15px] text-[15px]">
          {isSubmitting ? "Отправляем…" : "Отправить ссылку"}
        </button>
      </form>
      <div className="text-center mt-5">
        <button type="button" onClick={onGoLogin} className="text-[14px] font-semibold cursor-pointer" style={{ color: "var(--color-muted)" }}>
          ← Вернуться ко входу
        </button>
      </div>
    </div>
  );
}

function ResetSentView({ onGoLogin }: { onGoLogin: () => void }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
        style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>
      <h3 className="text-2xl font-extrabold tracking-[-.01em] text-[var(--color-ink)] mb-2">Проверьте почту</h3>
      <p className="text-[14.5px] leading-[1.55] text-[var(--color-muted)] mb-[26px]">
        Мы отправили ссылку для смены пароля. Если письма нет — проверьте папку «Спам».
      </p>
      <button type="button" onClick={onGoLogin} className="btn-primary w-full py-[15px] text-[15px]">
        Вернуться ко входу
      </button>
    </div>
  );
}
