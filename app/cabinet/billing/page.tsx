"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, type AiBalance, type BillableItem, type Plan } from "@/lib/api";

interface PlanDef {
  key: BillableItem | "free";
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
    features: [
      "3 формата встреч",
      "Безлимит броней и календари",
      "Телемост, Google Meet, Zoom",
      "60 минут AI-конспектов — разово",
    ],
  },
  {
    key: "standard",
    name: "Стандарт",
    priceLabel: "690 ₽/мес",
    features: [
      "Безлимит форматов",
      "Приём оплат от клиентов",
      "Пакеты встреч и UTM-аналитика",
      "Без бейджа Slotix",
      "3 часа AI-конспектов в месяц",
    ],
    highlighted: true,
  },
  {
    key: "pro",
    name: "Про",
    priceLabel: "1 490 ₽/мес",
    features: ["Всё из «Стандарта»", "10 часов AI-конспектов в месяц", "Приоритетная поддержка"],
  },
  {
    key: "team",
    name: "Команда",
    priceLabel: "4 990 ₽/мес",
    features: [
      "До 5 человек, дальше 990 ₽ за место",
      "30 часов AI-конспектов — общий пул",
      "Внутренние встречи команды",
      "Страница студии и запись к любому свободному",
    ],
    note: "Оплачивает владелец команды",
  },
];

const PLAN_LABEL: Record<Plan, string> = {
  free: "Бесплатный",
  standard: "Стандарт",
  pro: "Про",
};

const PLAN_PRICE: Record<Plan, string> = {
  free: "0 ₽",
  standard: "690 ₽",
  pro: "1 490 ₽",
};

/** Минуты в «2 ч 30 мин» — час с хвостом читается хуже, чем два числа. */
function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageContent />
    </Suspense>
  );
}

function BillingPageContent() {
  const { user, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<BillableItem | null>(null);
  const [balance, setBalance] = useState<AiBalance | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // T-Bank's SuccessURL/FailURL redirect back here with ?payment=... The webhook normally
  // flips the plan, but asking the server to reconcile against T-Bank directly is what makes
  // this safe: if the webhook never arrives, a customer who paid would otherwise be stuck on
  // the free plan with no way out.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      showToast("Оплата прошла — обновляем тариф…");
      let cancelled = false;
      (async () => {
        try {
          await api.post<{ plan: Plan }>("/api/billing/sync", {});
        } catch {
          // Reconciliation is best-effort; the webhook may still land on its own.
        }
        if (!cancelled) refresh();
      })();
      return () => {
        cancelled = true;
      };
    }
    if (payment === "failed") {
      showToast("Оплата не прошла. Попробуйте ещё раз.");
    }
  }, [searchParams, refresh, showToast]);

  const loadBalance = useCallback(() => {
    api.get<AiBalance>("/api/ai/balance").then(setBalance).catch(() => setBalance(null));
  }, []);
  useEffect(loadBalance, [loadBalance]);

  const handleUpgrade = useCallback(
    async (plan: BillableItem) => {
      setCheckingOut(plan);
      try {
        const { paymentUrl } = await api.post<{ paymentUrl: string }>("/api/billing/checkout", { plan });
        window.location.href = paymentUrl;
      } catch (e) {
        showToast(e instanceof ApiError ? e.message : "Не удалось начать оплату. Попробуйте ещё раз.");
        setCheckingOut(null);
      }
    },
    [showToast],
  );

  const currentPlan = user?.plan ?? "free";

  return (
    <div className="px-3 pb-10 pt-2" style={{ maxWidth: 1180 }}>
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

      {balance && <AiBalanceCard balance={balance} onBuyPack={() => handleUpgrade("ai_pack")} buying={checkingOut === "ai_pack"} />}

      <div className="mb-8 grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            isCurrent={plan.key === currentPlan}
            loading={checkingOut === plan.key}
            onUpgrade={() => plan.key !== "free" && handleUpgrade(plan.key)}
          />
        ))}
      </div>

      <div className="glass-card p-2 pb-3">
        <div className="px-[10px] pb-3 pt-4 text-[16px] font-bold text-[var(--color-ink)]">История платежей</div>
        <div className="flex flex-col items-center gap-2 border-t px-[18px] py-8 text-center" style={{ borderColor: "rgba(20,30,45,.05)" }}>
          <div className="text-[14px] font-medium text-[var(--color-ink)]">Платежей пока нет</div>
          <div className="text-[13px] text-[var(--color-muted)]">История появится здесь после первой оплаты.</div>
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

/** Остаток минут AI-конспектов. Единственный лимитируемый ресурс продукта, поэтому он
 * показывается прямо в биллинге, а не прячется в настройках. */
function AiBalanceCard({
  balance,
  onBuyPack,
  buying,
}: {
  balance: AiBalance;
  onBuyPack: () => void;
  buying: boolean;
}) {
  const total = balance.quotaMinutes + balance.packMinutes + balance.trialMinutes;
  const usedShare = total > 0 ? Math.min(100, Math.round((balance.usedMinutes / total) * 100)) : 0;
  const empty = balance.remainingMinutes === 0;

  return (
    <div className="glass-card mb-[26px] p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="text-[16px] font-bold text-[var(--color-ink)]">AI-конспекты</div>
        {balance.scope === "team" && (
          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: "var(--color-link)", background: "rgba(80,148,240,.12)" }}>
            общий пул команды
          </span>
        )}
        <div className="ml-auto text-[15px] font-semibold" style={{ color: empty ? "var(--color-danger)" : "var(--color-ink)" }}>
          Осталось {formatMinutes(balance.remainingMinutes)}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(20,30,45,.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${usedShare}%`, background: empty ? "var(--color-danger)" : "var(--color-primary-gradient)" }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[var(--color-muted)]">
        {balance.quotaMinutes > 0 && (
          <span>
            По тарифу: {formatMinutes(balance.quotaMinutes)} · обновится{" "}
            {new Date(balance.periodEnd).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </span>
        )}
        {balance.trialMinutes > 0 && <span>Пробные: {formatMinutes(balance.trialMinutes)}</span>}
        {balance.packMinutes > 0 && <span>Докуплено: {formatMinutes(balance.packMinutes)} — не сгорают</span>}
      </div>

      <p className="mt-3 text-[13px] text-[var(--color-muted)]">
        Встречи в Телемосте расходуют минуты вдвое медленнее. Ручная запись списывает 60 минут.
      </p>

      <button type="button" onClick={onBuyPack} disabled={buying} className="btn-secondary mt-4 py-2 text-sm disabled:opacity-50">
        {buying ? "Открываем оплату…" : "Докупить 5 часов — 890 ₽"}
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  loading,
  onUpgrade,
}: {
  plan: PlanDef;
  isCurrent: boolean;
  loading: boolean;
  onUpgrade: () => void;
}) {
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
          disabled={loading}
          className={
            (plan.key === "pro" ? "mt-[18px] w-full cursor-pointer rounded-xl py-3 text-[14px] font-semibold text-white" : "btn-primary mt-[18px] w-full py-3 text-[14px]") +
            " disabled:cursor-not-allowed disabled:opacity-60"
          }
          style={plan.key === "pro" ? { background: "#1A2733" } : undefined}
        >
          {loading ? "Переходим к оплате…" : `Перейти на «${plan.name}»`}
        </button>
      )}
    </div>
  );
}
