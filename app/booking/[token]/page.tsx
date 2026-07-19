import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { BookingManageView } from "./BookingManageView";
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

  return <BookingManageView booking={booking} token={token} />;
}
