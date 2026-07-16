import Link from "next/link";
import Image from "next/image";
import { Star, Award, ArrowRight, ChefHat } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
          <div className="absolute inset-0 bg-noise-texture opacity-60" />
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-28 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-in-up">
            <span className="flex items-center gap-2 eyebrow">
              <span className="h-px w-8 bg-gold/60" />
              {BRAND.domain}
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-[1.05] text-cream sm:text-6xl lg:text-7xl">
              Where Fire Meets
              <span className="block text-gold-gradient">Fine Dining</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream-muted">
              Prime, hand-selected cuts seared to perfection. An intimate,
              candle-lit atmosphere in the heart of Doha. Reserve your table and
              savour the art of the steakhouse.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/book" className="btn-gold text-base">
                Book a Table
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/menu" className="btn-ghost text-base">
                View Menu
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-12 flex flex-wrap items-center gap-8 text-sm text-cream-dim">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span>4.9 Guest Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                <span>Prime Grade Beef</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                <span>2 Doha Locations</span>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative animate-scale-in">
            <div className="card overflow-hidden">
              <div className="relative aspect-[700/494] w-full">
                <Image
                  src="/hero.webp"
                  alt="Steak Town signature steak knife and fork on slate with condiments"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="card absolute -bottom-6 -left-6 hidden items-center gap-3 px-5 py-4 sm:flex">
              <ChefHat className="h-8 w-8 text-gold" />
              <div>
                <p className="font-serif text-lg font-semibold text-cream">Master Grill</p>
                <p className="text-xs text-cream-dim">Charcoal-fired, 800°C sear</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
