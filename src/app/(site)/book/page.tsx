import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book a Table",
  description:
    "Reserve your table at Steak Town with our interactive floor plan. Choose your location, seat, date, and time.",
};

export default function BookPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="flex items-center justify-center gap-2 eyebrow">
          <span className="h-px w-6 bg-gold/60" />
          Reservations
          <span className="h-px w-6 bg-gold/60" />
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold text-cream sm:text-5xl">
          Book Your Table
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-cream-muted">
          A few simple steps to secure your evening at Steak Town.
        </p>
      </div>

      <BookingWizard />
    </div>
  );
}
