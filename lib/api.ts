/**
 * Typed client for the Slotix NestJS backend (see /Users/danilkocnev/Downloads/slotix-backend).
 * Session is an httpOnly cookie (slotix_session) set by the backend — same-site in both dev
 * (localhost:3000 + localhost:4000 share the "localhost" site) and prod (both proxied under
 * one domain), so `credentials: "include"` is enough; no token to manage client-side.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  // A handler returning `null` (e.g. GET /team for a user with no team) serializes to a 200
  // with an empty body, which res.json() rejects on — treat "no body" as the null it means.
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

// --- Domain types (mirrors backend Prisma models/DTOs — see slotix-backend/src) ---

export type Plan = "free" | "standard" | "pro";

/** Всё, что можно купить: подписки и разовая докупка минут AI-конспектов. */
export type BillableItem = "standard" | "pro" | "team" | "ai_pack";

/** ₽ проводит Робокасса, $ и € — lava.top; выбор валюты и есть выбор провайдера. */
export type BillingCurrency = "RUB" | "USD" | "EUR";
export type BillingInterval = "monthly" | "yearly" | "one_time";

/** Цены приходят с сервера — в UI их дублировать нельзя, иначе разъедутся со счётом. */
export interface BillingCatalogItem {
  item: BillableItem;
  title: string;
  intervals: { interval: BillingInterval; prices: Record<BillingCurrency, number> }[];
}

export interface BillingCatalog {
  currencies: BillingCurrency[];
  items: BillingCatalogItem[];
}

export interface BillingSubscription {
  item: BillableItem | null;
  interval: BillingInterval;
  currency: BillingCurrency;
  status: "active" | "past_due" | "canceled";
  currentPeriodEnd: string;
  autoRenew: boolean;
  provider: string | null;
}

export interface BillingState {
  plan: Plan;
  subscription: BillingSubscription | null;
}

export interface AiBalance {
  scope: "personal" | "team";
  plan: Plan | "team";
  quotaMinutes: number;
  usedMinutes: number;
  packMinutes: number;
  trialMinutes: number;
  remainingMinutes: number;
  periodEnd: string;
}
export type FormatType = "one" | "group" | "many";
// "phone" is a meeting platform like any other from the UI's point of view, but it needs no
// integration and produces no join link — the client leaves a number instead.
export type VideoProvider = "google_meet" | "zoom" | "yandex_telemost" | "phone";
export type FormatStatus = "draft" | "live";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "moved";

export interface Me {
  id: string;
  email: string;
  name: string | null;
  slug: string;
  timezone: string;
  avatarUrl: string | null;
  plan: Plan;
  acceptingBookings: boolean;
  googleAccountConnected: boolean;
  yandexAccountConnected: boolean;
}

export interface Format {
  id: string;
  userId: string;
  name: string;
  type: FormatType;
  durationMin: number;
  seats: number | null;
  color: string;
  providers: VideoProvider[];
  priceKopecks: number;
  packageSize: number | null;
  packagePriceKopecks: number | null;
  manualConfirm: boolean;
  notetakerEnabled: boolean;
  status: FormatStatus;
  createdAt: string;
}

export interface AvailabilityRule {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface CalendarConnection {
  id: string;
  provider: "google" | "yandex";
  calendarId: string;
  busySyncEnabled: boolean;
  isWriteTarget: boolean;
}

export interface IntegrationStatusEntry {
  status: "on" | "off" | "error";
}

export interface IntegrationsOverview {
  google_meet: IntegrationStatusEntry;
  zoom: IntegrationStatusEntry;
  yandex_telemost: IntegrationStatusEntry;
}

export interface Booking {
  id: string;
  formatId: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientComment: string | null;
  startAt: string;
  endAt: string;
  clientTimezone: string;
  ownerTimezoneAtBooking: string;
  status: BookingStatus;
  /** Platform the client picked when booking; null for rows created before the choice existed. */
  provider: VideoProvider | null;
  /** Only set when `provider` is "phone" — the number the owner should call. */
  clientPhone: string | null;
  channelLink: string | null;
  calendarEventId: string | null;
  cancelReason: string | null;
  rescheduledFromId: string | null;
  publicToken: string;
  /** Present only on a just-created paid booking — the hosted checkout URL to redirect to. */
  paymentUrl?: string;
  createdAt: string;
  format?: Format;
}

export interface BookingSourceRow {
  /** Empty string means "no UTM tag on that dimension" — the UI renders it as «Прямые переходы». */
  source: string;
  medium: string;
  campaign: string;
  bookings: number;
  revenueKopecks: number;
}

export interface BookingSourceStats {
  rows: BookingSourceRow[];
  totalBookings: number;
  totalRevenueKopecks: number;
}

export type MembershipRole = "owner" | "admin" | "member";

export interface TeamMember {
  membershipId: string;
  role: MembershipRole;
  joinedAt: string;
  isMe: boolean;
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  slug: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: MembershipRole;
  createdAt: string;
}

export interface Team {
  org: { id: string; name: string; slug: string | null; plan?: "free" | "team" };
  myRole: MembershipRole;
  canManage: boolean;
  members: TeamMember[];
  pendingInvitations: TeamInvitation[];
}

export type TeamSchedulingType = "round_robin" | "collective";

export interface TeamFormat {
  id: string;
  name: string;
  durationMin: number;
  priceKopecks: number;
  color: string;
  providers: VideoProvider[];
  schedulingType: TeamSchedulingType;
  allowHostPick: boolean;
  status: FormatStatus;
  hosts: { user: PersonRef }[];
}

export interface TeamPageFormat {
  id: string;
  name: string;
  durationMin: number;
  priceKopecks: number;
  color: string;
  providers: VideoProvider[];
  schedulingType: TeamSchedulingType;
  allowHostPick: boolean;
  hosts: { user: PersonRef }[];
}

export interface TeamPage {
  org: { name: string; slug: string };
  formats: TeamPageFormat[];
}

export interface InvitationPreview {
  orgName: string;
  email: string;
  role: MembershipRole;
}

export interface TeamMeeting {
  id: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  clientName: string;
  clientEmail: string;
  clientTimezone: string;
  provider: VideoProvider | null;
  format: { id: string; name: string; color: string; durationMin: number };
  member: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

export interface PersonRef {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface TeamGroup {
  id: string;
  name: string;
  members: { user: PersonRef }[];
}

export interface ProposedSlots {
  participants: PersonRef[];
  slots: { start: string; end: string }[];
}

export interface InternalMeeting {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  durationMin?: number;
  status?: "draft" | "scheduled" | "cancelled";
  provider: VideoProvider | null;
  channelLink: string | null;
  organizerId?: string;
  recordEnabled?: boolean;
  meetingNote?: { id: string; status: MeetingNoteStatus } | null;
  participants: { user: PersonRef }[];
}

export interface PublicProfile {
  id: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  timezone: string;
  acceptingBookings: boolean;
  /** Whether to show the "Работает на Slotix" badge — true for owners on the free plan. */
  showBranding: boolean;
  formats: Pick<
    Format,
    "id" | "name" | "type" | "durationMin" | "seats" | "color" | "providers" | "priceKopecks" | "packageSize" | "packagePriceKopecks" | "manualConfirm"
  >[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

// --- AI meeting notes (notetaker) ---

export type MeetingNoteStatus = "pending" | "recording" | "processing" | "done" | "failed";
export type MeetingNoteSource = "booking" | "manual";

export interface ActionItem {
  owner: string;
  task: string;
  due: string | null;
}

export interface MeetingNote {
  id: string;
  source: MeetingNoteSource;
  status: MeetingNoteStatus;
  provider: string | null;
  meetingUrl: string | null;
  title: string | null;
  summary: string | null;
  decisions: string[];
  actionItems: ActionItem[] | null;
  followUpSuggested: boolean;
  followUpTimeframe: string | null;
  followUpSentAt: string | null;
  createdAt: string;
  booking: { clientName: string; startAt: string } | null;
}

