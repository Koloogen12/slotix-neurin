"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  ApiError,
  type AiBalance,
  type BillableItem,
  type BillingCatalog,
  type BillingCurrency,
  type BillingInterval,
  type BillingState,
  type Plan,
} from "@/lib/api";

interface PlanDef {
  key: BillableItem | "free";
  name: string;
  features: string[];
  note?: string;
  highlighted?: boolean;
}

const PLANS: PlanDef[] = [
  {
    key: "free",
    name: "Бесплатный",
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
    features: ["Всё из «Стандарта»", "10 часов AI-конспектов в месяц", "Приоритетная поддержка"],
  },
  {
    key: "team",
    name: "Команда",
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

const CURRENCY_LABEL: Record<BillingCurrency, string> = { RUB: "₽", USD: "$", EUR: "€" };

const INTERVAL_SUFFIX: Record<BillingInterval, string> = { monthly: "/мес", yearly: "/год", one_time: "" };

/** Тот же формат, что и в письмах с чеками: рубли с разделителями, валюта — с центами. */
function formatPrice(minor: number, currency: BillingCurrency): string {
  const major = minor / 100;
  if (currency === "RUB") return `${major.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
  return `${CURRENCY_LABEL[currency]}${major.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

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
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [currency, setCurrency] = useState<BillingCurrency>("RUB");
  // Не `interval`: имя затенило бы глобальный setInterval внутри компонента.
  const [period, setPeriod] = useState<Exclude<BillingInterval, "one_time">>("monthly");
  const [cancelling, setCancelling] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadBalance = useCallback(() => {
    api.get<AiBalance>("/api/ai/balance").then(setBalance).catch(() => setBalance(null));
  }, []);
  useEffect(loadBalance, [loadBalance]);

  const loadBilling = useCallback(() => {
    api
      .get<BillingState>("/api/billing/subscription")
      .then((state) => {
        setBilling(state);
        // Валюту и период подписки не переспрашиваем: если клиент платит в евро за год,
        // продление предлагаем так же, а не в рублях помесячно.
        const active = state.subscription;
        if (!active) return;
        setCurrency(active.currency);
        if (active.interval !== "one_time") setPeriod(active.interval);
      })
      .catch(() => setBilling(null));
  }, []);
  useEffect(loadBilling, [loadBilling]);

  useEffect(() => {
    api
      .get<BillingCatalog>("/api/billing/pricing")
      .then((loaded) => {
        setCatalog(loaded);
        setCurrency((current) => (loaded.currencies.includes(current) ? current : (loaded.currencies[0] ?? "RUB")));
      })
      .catch(() => setCatalog(null));
  }, []);

  // Провайдер возвращает клиента сюда с ?payment=... Тариф обычно поднимает вебхук, но просить
  // сервер сверить платёж напрямую — это то, что делает возврат безопасным: если вебхук не
  // дойдёт, оплативший клиент иначе останется на бесплатном тарифе без выхода.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment !== "success" && payment !== "failed") return;
    let cancelled = false;
    (async () => {
      if (payment === "failed") {
        showToast("Оплата не прошла. Попробуйте ещё раз.");
        return;
      }
      showToast("Оплата прошла — обновляем тариф…");
      try {
        await api.post<{ plan: Plan }>("/api/billing/sync", {});
      } catch {
        // Сверка — best effort; вебхук может дойти сам.
      }
      if (cancelled) return;
      refresh();
      loadBilling();
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, refresh, showToast, loadBilling]);

  const priceOf = useCallback(
    (item: BillableItem, period: BillingInterval): number | null => {
      const entry = catalog?.items.find((candidate) => candidate.item === item);
      return entry?.intervals.find((row) => row.interval === period)?.prices[currency] ?? null;
    },
    [catalog, currency],
  );

  const priceLabel = useCallback(
    (item: BillableItem, period: BillingInterval): string | null => {
      const price = priceOf(item, period);
      return price === null ? null : `${formatPrice(price, currency)}${INTERVAL_SUFFIX[period]}`;
    },
    [priceOf, currency],
  );

  const handleUpgrade = useCallback(
    async (plan: BillableItem) => {
      setCheckingOut(plan);
      try {
        const { paymentUrl } = await api.post<{ paymentUrl: string }>("/api/billing/checkout", {
          plan,
          currency,
          interval: plan === "ai_pack" ? "one_time" : period,
        });
        window.location.href = paymentUrl;
      } catch (e) {
        showToast(e instanceof ApiError ? e.message : "Не удалось начать оплату. Попробуйте ещё раз.");
        setCheckingOut(null);
      }
    },
    [showToast, currency, period],
  );

  const handleCancel = useCallback(async () => {
    if (!window.confirm("Отключить автопродление? Тариф продолжит работать до конца оплаченного периода.")) return;
    setCancelling(true);
    try {
      const { currentPeriodEnd } = await api.post<{ currentPeriodEnd: string }>("/api/billing/cancel", {});
      showToast(`Автопродление отключено. Тариф действует до ${formatDate(currentPeriodEnd)}.`);
      loadBilling();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Не удалось отключить автопродление.");
    } finally {
      setCancelling(false);
    }
  }, [showToast, loadBilling]);

  const currentPlan = user?.plan ?? "free";
  const subscription = billing?.subscription ?? null;
  const currentItem: BillableItem | null = subscription?.item ?? (currentPlan === "free" ? null : currentPlan);
  // Тариф может быть выдан и без записи о подписке (перенос, ручная выдача) — тогда
  // показываем базовую месячную цену, а не ноль.
  const currentPrice = useMemo(() => {
    if (!currentItem) return null;
    const activeInterval = subscription?.interval === "yearly" ? "yearly" : "monthly";
    const activeCurrency = subscription?.currency ?? currency;
    const entry = catalog?.items.find((candidate) => candidate.item === currentItem);
    const price = entry?.intervals.find((row) => row.interval === activeInterval)?.prices[activeCurrency];
    return price == null ? null : `${formatPrice(price, activeCurrency)}${INTERVAL_SUFFIX[activeInterval]}`;
  }, [catalog, currentItem, subscription, currency]);

  const packPrice = priceLabel("ai_pack", "one_time");
  const currencies = catalog?.currencies ?? ["RUB" as BillingCurrency];

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
          <div className="mt-[2px] text-[22px] font-bold text-[var(--color-ink)]">
            {subscription?.item === "team" ? "Команда" : PLAN_LABEL[currentPlan]}
          </div>
          {subscription && (
            <div className="mt-[6px] text-[13px] text-[var(--color-muted)]">
              {subscription.status === "past_due"
                ? `Списание не прошло — повторим ещё раз. Доступ сохраняется до ${formatDate(subscription.currentPeriodEnd)}.`
                : subscription.autoRenew
                  ? `Продлится ${formatDate(subscription.currentPeriodEnd)}`
                  : `Действует до ${formatDate(subscription.currentPeriodEnd)}, автопродление отключено`}
            </div>
          )}
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="text-[22px] font-bold text-[var(--color-ink)]">
            {currentPrice ? (
              <>
                {currentPrice.replace(/\/(мес|год)$/, "")}
                <span className="text-[14px] font-normal text-[var(--color-muted)]">
                  {subscription?.interval === "yearly" ? "/год" : "/мес"}
                </span>
              </>
            ) : (
              "0 ₽"
            )}
          </div>
          {subscription?.autoRenew && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[13px] font-medium underline disabled:opacity-50"
              style={{ color: "var(--color-muted)" }}
            >
              {cancelling ? "Отключаем…" : "Отключить автопродление"}
            </button>
          )}
        </div>
      </div>

      {balance && (
        <AiBalanceCard
          balance={balance}
          packPrice={packPrice}
          onBuyPack={() => handleUpgrade("ai_pack")}
          buying={checkingOut === "ai_pack"}
        />
      )}

      <div className="mb-[18px] flex flex-wrap items-center gap-3">
        <Switcher
          options={[
            { value: "monthly", label: "Помесячно" },
            { value: "yearly", label: "На год — 2 месяца в подарок" },
          ]}
          value={period}
          onChange={(value) => setPeriod(value as Exclude<BillingInterval, "one_time">)}
        />
        {currencies.length > 1 && (
          <Switcher
            options={currencies.map((code) => ({ value: code, label: CURRENCY_LABEL[code] }))}
            value={currency}
            onChange={(value) => setCurrency(value as BillingCurrency)}
          />
        )}
        {currency !== "RUB" && (
          <span className="text-[13px] text-[var(--color-muted)]">Оплата иностранной картой или через PayPal</span>
        )}
      </div>

      <div className="mb-8 grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            priceLabel={plan.key === "free" ? formatPrice(0, currency) : priceLabel(plan.key, period)}
            isCurrent={plan.key === (currentItem ?? "free")}
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

/** Переключатель периода и валюты: два-три варианта, между которыми выбор очевиден. */
function Switcher({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl p-1" style={{ background: "rgba(20,30,45,.06)" }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="rounded-lg px-3 py-[7px] text-[13px] font-semibold transition-colors"
          style={
            option.value === value
              ? { background: "#fff", color: "var(--color-ink)", boxShadow: "0 2px 6px rgba(20,40,70,.1)" }
              : { color: "var(--color-muted)" }
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Остаток минут AI-конспектов. Единственный лимитируемый ресурс продукта, поэтому он
 * показывается прямо в биллинге, а не прячется в настройках. */
function AiBalanceCard({
  balance,
  packPrice,
  onBuyPack,
  buying,
}: {
  balance: AiBalance;
  packPrice: string | null;
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

      <button type="button" onClick={onBuyPack} disabled={buying || !packPrice} className="btn-secondary mt-4 py-2 text-sm disabled:opacity-50">
        {buying ? "Открываем оплату…" : `Докупить 5 часов${packPrice ? ` — ${packPrice}` : ""}`}
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  priceLabel,
  isCurrent,
  loading,
  onUpgrade,
}: {
  plan: PlanDef;
  priceLabel: string | null;
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
      <div className="my-[10px] mb-[18px] text-[26px] font-bold text-[var(--color-ink)]">{priceLabel ?? "—"}</div>
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
          disabled={loading || !priceLabel}
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
