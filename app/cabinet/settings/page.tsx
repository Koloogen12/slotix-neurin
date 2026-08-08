"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AccountScheduleCard } from "./AccountScheduleCard";

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Europe/Kaliningrad", label: "Калининград (GMT+2)" },
  { value: "Europe/Moscow", label: "Москва (GMT+3)" },
  { value: "Europe/Samara", label: "Самара (GMT+4)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (GMT+5)" },
  { value: "Asia/Omsk", label: "Омск (GMT+6)" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск (GMT+7)" },
  { value: "Asia/Irkutsk", label: "Иркутск (GMT+8)" },
  { value: "Asia/Yakutsk", label: "Якутск (GMT+9)" },
  { value: "Asia/Vladivostok", label: "Владивосток (GMT+10)" },
  { value: "UTC", label: "UTC" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
    setTimezone(user.timezone);
    setAcceptingBookings(user.acceptingBookings);
  }, [user]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const save = useCallback(
    async (patch: { name?: string; timezone?: string; avatarUrl?: string; acceptingBookings?: boolean }) => {
      setSaveState("saving");
      setSaveError(null);
      try {
        await api.patch("/api/me", patch);
        await refresh();
        setSaveState("saved");
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveState("idle"), 2200);
      } catch (err) {
        setSaveState("error");
        setSaveError(err instanceof ApiError ? err.message : "Не удалось сохранить изменения");
      }
    },
    [refresh],
  );

  function handleNameBlur() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === (user?.name ?? "")) return;
    save({ name: trimmed });
  }

  function handleAvatarChange(file: File | null) {
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
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setAvatarUrl(reader.result);
      save({ avatarUrl: reader.result });
    };
    reader.onerror = () => setAvatarError("Не удалось загрузить фото");
    reader.readAsDataURL(file);
  }

  function handleTimezoneChange(value: string) {
    setTimezone(value);
    save({ timezone: value });
  }

  function handleAcceptingBookingsChange(value: boolean) {
    setAcceptingBookings(value);
    save({ acceptingBookings: value });
  }

  const initials = (name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="px-3 pb-10 pt-2" style={{ maxWidth: 680 }}>
      <h1 className="mb-[6px] text-[28px] font-bold tracking-[-.01em] text-[var(--color-ink)]">Настройки профиля</h1>
      <p className="mb-[26px] text-[15px] text-[var(--color-muted)]">Как вас видят клиенты на публичной странице</p>

      <div className="glass-card mb-[18px] p-[26px]">
        <div className="mb-6 flex items-center gap-[18px]">
          <div
            className="flex h-[72px] w-[72px] flex-none items-center justify-center overflow-hidden rounded-full text-[24px] font-bold text-[var(--color-primary)]"
            style={{ boxShadow: "0 0 0 1.5px var(--color-primary)", background: "rgba(255,255,255,.85)" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="mb-1 text-[15px] font-semibold text-[var(--color-ink)]">Фото профиля</div>
            <div className="mb-2 text-[13px] text-[var(--color-muted)]">PNG или JPG, до 2 МБ.</div>
            <label className="btn-secondary inline-flex cursor-pointer">
              Загрузить фото
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarError && <div className="mt-2 text-xs text-[var(--color-danger)]">{avatarError}</div>}
          </div>
        </div>

        <div className="grid gap-[18px]">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]">Имя</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]">Адрес страницы</label>
            <div
              className="flex items-center overflow-hidden rounded-xl border"
              style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.7)" }}
            >
              <span className="py-3 pl-[14px] pr-1 text-[15px] text-[var(--color-muted)]">slotix.ru/</span>
              <span className="flex-1 py-3 pr-[14px] text-[15px] font-semibold text-[var(--color-ink)]">
                {user?.slug}
              </span>
            </div>
            <div className="mt-2 text-[12.5px] font-medium text-[var(--color-muted)]">
              Адрес страницы нельзя изменить после регистрации
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]">Часовой пояс</label>
            <select
              className="input-field cursor-pointer"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3" style={{ borderColor: "#E3ECF6", background: "rgba(255,255,255,.5)" }}>
            <div>
              <div className="text-[14px] font-semibold text-[var(--color-ink)]">Принимать брони</div>
              <div className="text-[12.5px] text-[var(--color-muted)]">
                Если выключить, публичная страница покажет, что вы сейчас не принимаете брони
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={acceptingBookings}
              onClick={() => handleAcceptingBookingsChange(!acceptingBookings)}
              className="relative h-7 w-[46px] flex-none rounded-full transition-colors"
              style={{ background: acceptingBookings ? "var(--color-primary)" : "#D1D9E6" }}
            >
              <span
                className="absolute left-0 top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform"
                style={{ transform: acceptingBookings ? "translateX(21px)" : "translateX(3px)" }}
              />
            </button>
          </div>
        </div>

        <div className="mt-[22px] flex items-center gap-2 text-[13px] font-medium" style={{ color: saveState === "error" ? "var(--color-danger)" : "#2E8A73" }}>
          {saveState === "saving" && <span>Сохраняем…</span>}
          {saveState === "saved" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Сохранено
            </>
          )}
          {saveState === "error" && (saveError ?? "Не удалось сохранить")}
          {saveState === "idle" && "Изменения сохраняются автоматически"}
        </div>
      </div>

      <div className="glass-card mb-[18px] p-[26px]">
        <AccountScheduleCard />
      </div>

      <div className="glass-card p-[26px]" style={{ borderColor: "rgba(242,106,106,.28)" }}>
        <div className="mb-[6px] text-[16px] font-bold" style={{ color: "#D64545" }}>
          Опасная зона
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1 text-[13.5px] leading-[1.5] text-[var(--color-muted)]">
            Удаление аккаунта необратимо. Все форматы, брони и настройки будут стёрты, будущие встречи — отменены.
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex-none cursor-pointer rounded-xl border px-[18px] py-[11px] text-[14px] font-semibold"
            style={{ borderColor: "rgba(242,106,106,.4)", background: "rgba(242,106,106,.06)", color: "#D64545" }}
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,40,60,.4)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full rounded-[22px] bg-white p-7"
            style={{ maxWidth: 440, boxShadow: "0 30px 70px rgba(20,40,70,.28)" }}
          >
            <div
              className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl"
              style={{ background: "rgba(242,106,106,.12)", color: "#E15656" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </div>
            <div className="mb-2 text-[20px] font-bold text-[var(--color-ink)]">Удалить аккаунт?</div>
            <div className="mb-[18px] text-[14px] leading-[1.5] text-[var(--color-text-secondary-3)]">
              Эта функция ещё в разработке — удаление аккаунта пока недоступно. Если это срочно, напишите нам в
              поддержку.
            </div>
            <input
              className="input-field mb-5"
              placeholder="УДАЛИТЬ"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button type="button" disabled className="flex-1 cursor-not-allowed rounded-xl bg-[#E15656] py-[13px] text-[14px] font-semibold text-white opacity-50">
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
