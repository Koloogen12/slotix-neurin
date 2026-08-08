"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GlobeIcon } from "../icons";

/** IANA area prefixes, in the order a Russian-speaking audience is most likely to need them. */
const REGION_LABELS: Record<string, string> = {
  Europe: "Европа",
  Asia: "Азия",
  America: "Америка",
  Africa: "Африка",
  Australia: "Австралия",
  Pacific: "Тихий океан",
  Atlantic: "Атлантика",
  Indian: "Индийский океан",
  Antarctica: "Антарктида",
  Arctic: "Арктика",
  Etc: "UTC",
};
const REGION_ORDER = Object.keys(REGION_LABELS);

function allZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return (
    intl.supportedValuesOf?.("timeZone") ?? [
      "Europe/Kaliningrad",
      "Europe/Moscow",
      "Europe/Samara",
      "Asia/Yekaterinburg",
      "Asia/Omsk",
      "Asia/Krasnoyarsk",
      "Asia/Irkutsk",
      "Asia/Yakutsk",
      "Asia/Vladivostok",
      "Asia/Magadan",
      "Asia/Kamchatka",
      "UTC",
    ]
  );
}

/** IANA ids are English-only, so a client typing "владив" would find nothing. Russian names
 * are listed for every Russian zone plus the cities this audience actually books across; the
 * rest fall back to the English city name, which stays searchable either way. */
const RU_NAMES: Record<string, string> = {
  "Europe/Kaliningrad": "Калининград",
  "Europe/Moscow": "Москва",
  "Europe/Simferopol": "Симферополь",
  "Europe/Volgograd": "Волгоград",
  "Europe/Kirov": "Киров",
  "Europe/Astrakhan": "Астрахань",
  "Europe/Saratov": "Саратов",
  "Europe/Ulyanovsk": "Ульяновск",
  "Europe/Samara": "Самара",
  "Asia/Yekaterinburg": "Екатеринбург",
  "Asia/Omsk": "Омск",
  "Asia/Novosibirsk": "Новосибирск",
  "Asia/Barnaul": "Барнаул",
  "Asia/Tomsk": "Томск",
  "Asia/Novokuznetsk": "Новокузнецк",
  "Asia/Krasnoyarsk": "Красноярск",
  "Asia/Irkutsk": "Иркутск",
  "Asia/Chita": "Чита",
  "Asia/Yakutsk": "Якутск",
  "Asia/Khandyga": "Хандыга",
  "Asia/Vladivostok": "Владивосток",
  "Asia/Ust-Nera": "Усть-Нера",
  "Asia/Magadan": "Магадан",
  "Asia/Sakhalin": "Сахалин",
  "Asia/Srednekolymsk": "Среднеколымск",
  "Asia/Kamchatka": "Камчатка",
  "Asia/Anadyr": "Анадырь",
  "Europe/Minsk": "Минск",
  "Europe/Kyiv": "Киев",
  "Asia/Almaty": "Алматы",
  "Asia/Tashkent": "Ташкент",
  "Asia/Tbilisi": "Тбилиси",
  "Asia/Yerevan": "Ереван",
  "Asia/Baku": "Баку",
  "Asia/Bishkek": "Бишкек",
  "Asia/Dushanbe": "Душанбе",
  "Asia/Ashgabat": "Ашхабад",
  "Europe/Chisinau": "Кишинёв",
  "Europe/Riga": "Рига",
  "Europe/Vilnius": "Вильнюс",
  "Europe/Tallinn": "Таллин",
  "Europe/Istanbul": "Стамбул",
  "Europe/London": "Лондон",
  "Europe/Berlin": "Берлин",
  "Europe/Paris": "Париж",
  "Europe/Madrid": "Мадрид",
  "Europe/Rome": "Рим",
  "Europe/Lisbon": "Лиссабон",
  "Europe/Warsaw": "Варшава",
  "Europe/Prague": "Прага",
  "Europe/Belgrade": "Белград",
  "Europe/Amsterdam": "Амстердам",
  "Europe/Zurich": "Цюрих",
  "Asia/Dubai": "Дубай",
  "Asia/Tel_Aviv": "Тель-Авив",
  "Asia/Jerusalem": "Иерусалим",
  "Asia/Bangkok": "Бангкок",
  "Asia/Shanghai": "Шанхай",
  "Asia/Hong_Kong": "Гонконг",
  "Asia/Tokyo": "Токио",
  "Asia/Seoul": "Сеул",
  "Asia/Singapore": "Сингапур",
  "Asia/Dhaka": "Дакка",
  "Asia/Kolkata": "Дели",
  "America/New_York": "Нью-Йорк",
  "America/Chicago": "Чикаго",
  "America/Denver": "Денвер",
  "America/Los_Angeles": "Лос-Анджелес",
  "America/Sao_Paulo": "Сан-Паулу",
  "America/Argentina/Buenos_Aires": "Буэнос-Айрес",
  "Australia/Sydney": "Сидней",
  "Africa/Cairo": "Каир",
  UTC: "UTC",
};

function cityLabel(zone: string): string {
  const city = zone.split("/").slice(1).join(" / ") || zone;
  return city.replace(/_/g, " ");
}

/** Russian name when we have one, English city otherwise. */
function displayLabel(zone: string): string {
  return RU_NAMES[zone] ?? cityLabel(zone);
}

function offsetMinutes(zone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(now);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(raw);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function offsetLabel(zone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
}

function currentTime(zone: string, now: Date): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: zone, hour: "2-digit", minute: "2-digit" }).format(now);
}

interface TimezonePickerProps {
  value: string;
  onChange: (zone: string) => void;
}

export function TimezonePicker({ value, onChange }: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Computed once per open rather than per render: 400+ zones × two Intl formatters is enough
  // work to be worth not repeating on every keystroke.
  const now = useMemo(() => new Date(), [open]);
  const zones = useMemo(() => {
    const list = allZones().map((zone) => ({
      zone,
      city: displayLabel(zone),
      latin: cityLabel(zone),
      region: zone.split("/")[0],
      offset: offsetMinutes(zone, now),
      offsetText: offsetLabel(zone, now),
      time: currentTime(zone, now),
    }));
    list.sort((a, b) => {
      const ra = REGION_ORDER.indexOf(a.region);
      const rb = REGION_ORDER.indexOf(b.region);
      if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
      return a.offset - b.offset || a.city.localeCompare(b.city);
    });
    return list;
  }, [now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.city.toLowerCase().includes(q) ||
        z.latin.toLowerCase().includes(q) ||
        z.zone.toLowerCase().includes(q) ||
        z.offsetText.toLowerCase().includes(q),
    );
  }, [zones, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    // Without this the list opens at the top of Europe and the visitor has to hunt for the
    // zone they're already in.
    rootRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = zones.find((z) => z.zone === value);

  let lastRegion = "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/60 bg-white/85 px-4 py-3 text-left shadow-[0_2px_8px_rgba(20,40,70,0.05)]"
      >
        <GlobeIcon className="flex-none text-[var(--color-muted)]" />
        <span className="flex-1 truncate text-[15px] font-medium text-[var(--color-ink)]">
          {selected ? `${selected.city} (${selected.offsetText})` : value}
        </span>
        <span className="flex-none text-[13px] font-medium text-[var(--color-muted)]">
          {selected?.time ?? ""}
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-full overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_44px_rgba(20,40,70,0.18)]"
          role="listbox"
        >
          <div className="border-b border-[#EEF2F6] p-3">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск часового пояса"
              className="input-field !py-2.5 text-[14px]"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-[13px] text-[var(--color-muted)]">Ничего не найдено</div>
            )}
            {filtered.map((z) => {
              const showRegion = z.region !== lastRegion && !query.trim();
              lastRegion = z.region;
              const isSelected = z.zone === value;
              return (
                <div key={z.zone}>
                  {showRegion && (
                    <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold tracking-wide text-[var(--color-faint)] uppercase">
                      {REGION_LABELS[z.region] ?? z.region}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(z.zone);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-left text-[14px] ${
                      isSelected
                        ? "bg-[var(--color-primary)] font-semibold text-white"
                        : "font-medium text-[var(--color-text-secondary)] hover:bg-[rgba(80,148,240,.08)]"
                    }`}
                  >
                    <span className="truncate">{z.city}</span>
                    <span className={`flex-none text-[13px] ${isSelected ? "text-white/85" : "text-[var(--color-muted)]"}`}>
                      {z.time}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
