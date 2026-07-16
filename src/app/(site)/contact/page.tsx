import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Clock, MapPin, ArrowRight } from "lucide-react";
import { SectionHeading, ImagePlaceholder } from "@/components/ui/Primitives";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Steak Town — phone, locations, and working hours.",
};

const LOCATIONS = [
  {
    name: "Sapphire Plaza",
    address: "Sapphire Plaza Hotel, 8113, 950 Al Reem St, Doha, Qatar",
  },
  { name: "Lusail", address: "Lusail City, Doha, Qatar" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Get in Touch"
        title="Contact Us"
        description="We'd love to welcome you. Reach out for reservations, private events, or any enquiry."
      />

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        {/* Info */}
        <div className="space-y-6">
          <div className="card p-8">
            <h3 className="eyebrow mb-5">Reservations</h3>
            <ul className="space-y-4">
              {BRAND.phones.map((phone) => (
                <li key={phone} className="flex items-center gap-3 text-cream-muted">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 text-gold">
                    <Phone className="h-4 w-4" />
                  </span>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-lg hover:text-gold">
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-8">
            <h3 className="eyebrow mb-5">Working Hours</h3>
            <ul className="space-y-3">
              {BRAND.hours.map((h) => (
                <li key={h.days} className="flex items-center justify-between text-cream-muted">
                  <span className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gold" />
                    {h.days}
                  </span>
                  <span className="text-cream-dim">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-8">
            <h3 className="eyebrow mb-5">Follow Us</h3>
            <SocialIcons size="md" />
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-6">
          {LOCATIONS.map((loc) => (
            <div key={loc.name} className="card overflow-hidden">
              <ImagePlaceholder
                label={loc.name}
                className="h-40 w-full"
                icon={<MapPin className="h-8 w-8" />}
              />
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold text-cream">{loc.name}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-cream-dim">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {loc.address}
                </p>
              </div>
            </div>
          ))}
          <div className="text-center">
            <Link href="/book" className="btn-gold w-full">
              Book a Table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
