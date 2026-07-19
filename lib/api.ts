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
  return res.json() as Promise<T>;
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
export type FormatType = "one" | "group" | "many";
export type VideoProvider = "google_meet" | "zoom" | "yandex_telemost";
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
  provider: VideoProvider;
  priceKopecks: number;
  manualConfirm: boolean;
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
  provider: "google";
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
  channelLink: string | null;
  calendarEventId: string | null;
  cancelReason: string | null;
  rescheduledFromId: string | null;
  publicToken: string;
  createdAt: string;
  format?: Format;
}

export interface PublicProfile {
  id: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  timezone: string;
  acceptingBookings: boolean;
  formats: Pick<
    Format,
    "id" | "name" | "type" | "durationMin" | "seats" | "color" | "provider" | "priceKopecks" | "manualConfirm"
  >[];
}

export interface TimeSlot {
  start: string;
  end: string;
}
