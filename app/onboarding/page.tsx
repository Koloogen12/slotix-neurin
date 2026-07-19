"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiUrl, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const RESERVED_HINT: Record<string, string> = {
  reserved: "Этот адрес зарезервирован — выберите другой",
};

type SlugCheckState = "idle" | "checking" | "available" | "taken" | "reserved";

function sanitizeSlugInput(raw: string): string {
  return raw.replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

function slugMessage(slug: string, state: SlugCheckState): { text: string; className: string } {
  if (!slug) return { text: "Придумайте адрес — латиницей", className: "text-(--color-muted)" };
  if (slug.length < 3) return { text: "Минимум 3 символа", className: "text-(--color-muted)" };
  if (state === "checking") return { text: "Проверяем…", className: "text-(--color-muted)" };
  if (state === "taken") {
    return {
      text: `✗ Занят — попробуйте ${slug}1 или ${slug}.pro`,
      className: "text-(--color-danger)",
    };
  }
  if (state === "reserved") {
    return { text: `✗ ${RESERVED_HINT.reserved}`, className: "text-(--color-danger)" };
  }
  if (state === "available") {
    return { text: "✓ Адрес свободен", className: "text-(--color-success)" };
  }
  return { text: "Проверяем…", className: "text-(--color-muted)" };
}

function getTimezoneOptions(): string[] {
  try {
    // Intl.supportedValuesOf isn't in every TS lib target yet — guard defensively.
    const intlWithSupportedValues = Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    };
    const zones = intlWithSupportedValues.supportedValuesOf?.("timeZone");
    if (zones && zones.length > 0) return zones;
  } catch {
    // fall through to the static fallback below
  }
  return [
    "Europe/Kaliningrad",
    "Europe/Moscow",
    "Europe/Samara",
    "Asia/Yekaterinburg",
    "Asia/Omsk",
    "Asia/Novosibirsk",
    "Asia/Krasnoyarsk",
    "Asia/Irkutsk",
    "Asia/Yakutsk",
    "Asia/Vladivostok",
    "Asia/Magadan",
    "Asia/Kamchatka",
    "UTC",
    "Europe/London",
    "Europe/Berlin",
    "America/New_York",
    "America/Los_Angeles",
  ];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refresh } = useAuth();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [slugCheck, setSlugCheck] = useState<SlugCheckState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timezoneOptions = useRef<string[] | null>(null);
  if (!timezoneOptions.current) timezoneOptions.current = getTimezoneOptions();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || initialized) return;
    setName(user.name ?? "");
    setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow");
    setAvatarUrl(user.avatarUrl ?? null);
    if (!user.slug.startsWith("tmp-")) {
      setSlug(user.slug);
      setSlugCheck("available");
    }
    setInitialized(true);
  }, [user, initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (slug.length < 3) {
      setSlugCheck("idle");
      return;
    }
    if (user && !user.slug.startsWith("tmp-") && slug === user.slug) {
      setSlugCheck("available");
      return;
    }

    setSlugCheck("checking");
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await api.get<{ available: boolean; reason?: "reserved" | "taken" }>(
          `/api/slug-availability?slug=${encodeURIComponent(slug)}`
        );
        if (cancelled) return;
        if (result.available) {
          setSlugCheck("available");
        } else {
          setSlugCheck(result.reason === "reserved" ? "reserved" : "taken");
        }
      } catch {
        if (!cancelled) setSlugCheck("idle");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, initialized, user]);

  const handleAvatarChange = (file: File | null) => {
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Выберите файл изображения");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Файл слишком большой (макс. 2 МБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setAvatarError("Не удалось загрузить фото");
    reader.readAsDataURL(file);
  };

  const step1Ready = name.trim().length > 0 && slugCheck === "available";

  const handleSubmit = async () => {
    if (!step1Ready || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/api/onboarding", {
        name: name.trim(),
        slug,
        timezone,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      await refresh();
      router.push("/cabinet/formats");
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : "Не удалось сохранить данные. Попробуйте ещё раз."
      );
      setSubmitting(false);
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = apiUrl("/api/integrations/google-calendar/connect");
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card p-6 text-sm font-medium text-(--color-muted)">Загрузка…</div>
      </div>
    );
  }

  const slugMsg = slugMessage(slug, slugCheck);
  const googleConnected = user.googleAccountConnected;

  return (
    <div className="flex min-h-screen justify-center px-6 py-20">
      <div className="w-[600px] max-w-full">
        <div className="mb-3.5 flex items-center justify-center gap-[11px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slotix/slotix-icon.png" alt="" className="h-[34px] w-[34px] rounded-[9px]" />
          <div className="text-xl font-bold tracking-[0.02em] text-(--color-ink)">SLOTIX</div>
        </div>
        <h1 className="mb-1.5 text-center text-[28px] font-bold text-(--color-ink)">Добро пожаловать!</h1>
        <p className="mb-[30px] text-center text-[15px] text-(--color-muted)">
          Два шага — и вашу ссылку можно отправлять клиентам
        </p>

        {/* Step 1 — profile + slug */}
        <div className="glass-card mb-4 p-[26px]">
          <div className="mb-[22px] flex items-center gap-[13px]">
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: "var(--color-primary-gradient)" }}
            >
              1
            </div>
            <div className="text-base font-bold text-(--color-ink)">Расскажите о себе и выберите адрес</div>
          </div>

          <div className="mb-[18px] flex items-center gap-4">
            <div className="flex h-[60px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-full bg-white/85 shadow-[0_0_0_1.5px_var(--color-primary)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-[60px] w-[60px] object-cover" />
              ) : (
                <span className="text-sm font-semibold text-(--color-muted)">Фото</span>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-2 text-[13px] text-(--color-muted)">
                Загрузите фото — так клиенты узнают, к кому идут на встречу
              </div>
              <label className="btn-secondary inline-flex cursor-pointer">
                Загрузить фото
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {avatarError && <div className="mt-2 text-xs text-(--color-danger)">{avatarError}</div>}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-(--color-ink)">Имя</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Алексей Ковалёв"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-(--color-ink)">
                Короткое описание
              </label>
              <input
                className="input-field"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Например: продуктовый эксперт"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-(--color-ink)">
                Адрес страницы
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-[#d1d9e6] bg-white/75">
                <span className="py-3 pr-1 pl-[14px] text-[15px] text-(--color-muted)">slotix.ru/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(sanitizeSlugInput(e.target.value))}
                  className="flex-1 border-none bg-transparent py-3 pr-[14px] text-[15px] font-semibold text-(--color-ink) outline-none"
                />
              </div>
              <div className={`mt-2 text-[12.5px] font-medium ${slugMsg.className}`}>{slugMsg.text}</div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-(--color-ink)">
                Часовой пояс
              </label>
              <select
                className="input-field"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {!timezoneOptions.current!.includes(timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {timezoneOptions.current!.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-(--color-muted)">
                Определили автоматически — проверьте
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 — Google */}
        <div className="glass-card mb-6 p-[26px]">
          <div className="mb-[18px] flex items-center gap-[13px]">
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold"
              style={
                googleConnected
                  ? { background: "linear-gradient(135deg,#4fd6a0,#3fcb6e)", color: "#fff" }
                  : { background: "rgba(80,148,240,.14)", color: "#2f6fd0" }
              }
            >
              {googleConnected ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                "2"
              )}
            </div>
            <div className="text-base font-bold text-(--color-ink)">Подключите аккаунт Google</div>
          </div>

          {googleConnected ? (
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(63,162,148,.22)] bg-[rgba(63,162,148,.1)] px-4 py-3.5">
              <span className="text-(--color-success)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <div className="text-sm font-semibold text-(--color-ink)">Google подключён</div>
            </div>
          ) : (
            <div>
              <p className="mb-[18px] text-sm leading-[1.5] text-(--color-muted)">
                Нужно для синхронизации календаря и создания ссылок Google Meet.
              </p>
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="flex w-full cursor-pointer items-center justify-center gap-[11px] rounded-xl border border-[#d1d9e6] bg-white py-3.5 text-sm font-semibold text-(--color-ink)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.8 3.2-7.8z" />
                  <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1-3.6 1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3z" />
                  <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1a11 11 0 0 0-9.7 6l3.7 2.8c.9-2.5 3.2-4.4 6-4.4z" />
                </svg>
                Войти с помощью Google
              </button>
            </div>
          )}
        </div>

        {submitError && (
          <div className="mb-4 rounded-xl border border-[rgba(232,86,86,.25)] bg-(--color-danger-bg) px-4 py-3 text-sm font-medium text-(--color-danger)">
            {submitError}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!step1Ready || submitting}
          className="w-full rounded-[13px] py-4 text-[15px] font-semibold transition-shadow"
          style={
            step1Ready && !submitting
              ? {
                  background: "var(--color-primary-gradient)",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(80,148,240,.35)",
                }
              : { background: "#dce4ec", color: "#a9b4bf", cursor: "not-allowed" }
          }
        >
          {submitting ? "Сохраняем…" : "Сохранить и продолжить"}
        </button>

        {!googleConnected && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!step1Ready || submitting}
              className="cursor-pointer text-sm font-medium text-(--color-muted) disabled:cursor-not-allowed disabled:opacity-60"
            >
              Настрою Google позже
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
