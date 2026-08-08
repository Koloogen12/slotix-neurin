import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { BookingManageView } from "./BookingManageView";
import { BrandingBadge } from "../../[slug]/branding-badge";
import type { BookingWithOwner } from "./types";

export default async function BookingManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let booking: BookingWithOwner;
  try {
    booking = await api.get<BookingWithOwner>(`/api/public/booking/${token}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <BookingManageView booking={booking} token={token} />
      <BrandingBadge show={booking.showBranding} />
    </div>
  );
}
