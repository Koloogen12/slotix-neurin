import type { Booking, Format } from "@/lib/api";

/**
 * The backend's GET /api/public/booking/:token includes the full format and a safe
 * (password-stripped) subset of the owner — see slotix-backend PublicService.getBookingByToken
 * and SAFE_USER_SELECT. Only the fields this page actually renders are declared here.
 */
export interface PublicBookingOwner {
  id: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  timezone: string;
}

export interface BookingWithOwner extends Booking {
  format: Format;
  user: PublicBookingOwner;
}
