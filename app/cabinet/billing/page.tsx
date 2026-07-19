"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { Plan } from "@/lib/api";

interface PlanDef {
  key: Plan;
  name: string;
  priceLabel: string;
  features: string[];
  note?: string;
  highlighted?: boolean;
}

const PLANS: PlanDef[] = [
  {
    key: "free",
    name: "Бесплатный",
    priceLabel: "0 ₽",
    features: ["1 формат встречи", "Только Google Meet", "Без ручного подтверждения броней"],
  },
  {
    key: "standard",
    name: "Стандарт",
    priceLabel: "490 ₽/мес",
    features: ["Безлимит форматов встреч", "Google Meet, Zoom и Яндекс Телемост", "Ручное подтверждение броней"],
    highlighted: true,
  },
  {
    key: "pro",
    name: "Про",
    priceLabel: "1 290 ₽/мес",
    features: ["Всё из «Стандарт»", "Командные страницы", "Свой домен и брендинг"],
    note: "Функции команды пока в разработке",
  },
];

const PLAN_LABEL: Record<Plan, string> = {
  free: "Бесплатный",
  standard: "Стандарт",
  pro: "Про",
};

const PLAN_PRICE: Record<Plan, string> = {
  free: "0 ₽",
  standard: "490 ₽",
  pro: "1 290 ₽",
};

export default function BillingPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const currentPlan = user?.plan ?? "free";

  return (
    <div className="px-3 pb-10 pt-2" style={{ maxWidth: 920 }}>
      <h1 className="mb-[6px] text-[28px] font-bold tracking-[-.01em] text-[var(--color-ink)]">Оплата</h1>
      <p className="mb-[26px] text-[15px] text-[var(--color-muted)]">Ваш тариф и его возможности</p>

      <div
        className="glass-card mb-[26px] flex flex-wrap items-center gap-[18px] p-6"
        style={{ background: "linear-gradient(120deg, rgba(80,148,240,.1), rgba(255,255,255,.6))" }}
      >
        <div>
          <div className="text-[13px] text-[var(--color-muted)]">Текущий тариф</div>
          <div className="mt-[2px] text-[22px] font-bold text-[var(--color-ink)]">{PLAN_LABEL[currentPlan]}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[22px] font-bold text-[var(--color-ink)]">
            {PLAN_PRICE[currentPlan]}
            {currentPlan !== "free" && <span className="text-[14px] font-normal text-[var(--color-muted)]">/мес</span>}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.key} plan={plan} isCurrent={plan.key === currentPlan} onUpgrade={() => showToast("Скоро — оплата тарифов пока в разработке")} />
        ))}
      </div>

      <div className="glass-card p-2 pb-3">
        <div className="px-[10px] pb-3 pt-4 text-[16px] font-bold text-[var(--color-ink)]">История платежей</div>
        <div className="flex flex-col items-center gap-2 border-t px-[18px] py-8 text-center" style={{ borderColor: "rgba(20,30,45,.05)" }}>
          <div className="text-[14px] font-medium text-[var(--color-ink)]">Платежей пока нет</div>
          <div className="text-[13px] text-[var(--color-muted)]">
            История появится здесь после первой оплаты — сейчас приём платежей ещё не подключён.
          </div>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-[26px] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-[11px] rounded-2xl px-5 py-[14px] text-[14px] font-semibold text-white"
          style={{ background: "#1A2733", boxShadow: "0 16px 40px rgba(20,40,70,.3)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, isCurrent, onUpgrade }: { plan: PlanDef; isCurrent: boolean; onUpgrade: () => void }) {
  return (
    <div
      className="glass-card relative p-[26px]"
      style={
        plan.highlighted
          ? { border: "2px solid #5094F0", boxShadow: "0 16px 40px rgba(80,148,240,.18)" }
          : undefined
      }
    >
      {plan.highlighted && (
        <div
          className="absolute -top-[11px] left-[26px] rounded-lg px-3 py-1 text-[11px] font-semibold text-white"
          style={{ background: "var(--color-primary-gradient)" }}
        >
          РЕКОМЕНДУЕМ
        </div>
      )}
      <div className="text-[17px] font-bold" style={{ color: plan.highlighted ? "var(--color-link)" : "var(--color-ink)" }}>
        {plan.name}
      </div>
      <div className="my-[10px] mb-[18px] text-[26px] font-bold text-[var(--color-ink)]">{plan.priceLabel}</div>
      {plan.features.map((feature) => (
        <div key={feature} className="flex items-center gap-[10px] py-[7px] text-[14px] text-[var(--color-text-secondary)]">
          <span className="flex flex-none" style={{ color: "#3FA294" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          {feature}
        </div>
      ))}
      {plan.note && <div className="mt-1 text-[12px] text-[var(--color-muted)]">{plan.note}</div>}

      {isCurrent ? (
        <button
          type="button"
          disabled
          className="mt-[18px] w-full cursor-default rounded-xl py-3 text-[14px] font-semibold text-white"
          style={{ background: "var(--color-primary-gradient)", boxShadow: "0 8px 20px rgba(80,148,240,.3)" }}
        >
          Текущий тариф
        </button>
      ) : plan.key === "free" ? (
        <button
          type="button"
          disabled
          className="mt-[18px] w-full cursor-default rounded-xl border py-3 text-[14px] font-semibold"
          style={{ borderColor: "#D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-muted)" }}
        >
          Недоступно
        </button>
      ) : (
        <button
          type="button"
          onClick={onUpgrade}
          className={plan.key === "pro" ? "mt-[18px] w-full cursor-pointer rounded-xl py-3 text-[14px] font-semibold text-white" : "btn-primary mt-[18px] w-full py-3 text-[14px]"}
          style={plan.key === "pro" ? { background: "#1A2733" } : undefined}
        >
          {plan.key === "pro" ? "Перейти на Про" : "Перейти на Стандарт"}
        </button>
      )}
    </div>
  );
}
