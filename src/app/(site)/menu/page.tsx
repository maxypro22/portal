import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Menu",
  description: "Explore Steak Town's menu — prime cuts, starters, sides, and desserts.",
};

const MENU = [
  {
    section: "Starters",
    items: [
      { name: "Steak Tartare", desc: "Hand-cut prime beef, quail yolk, capers, sourdough", price: "QAR 68" },
      { name: "Burrata & Heirloom", desc: "Creamy burrata, tomato, aged balsamic, basil oil", price: "QAR 55" },
      { name: "Seared Foie Gras", desc: "Brioche, fig compote, port reduction", price: "QAR 92" },
      { name: "Charred Octopus", desc: "Smoked paprika, confit potato, salsa verde", price: "QAR 74" },
    ],
  },
  {
    section: "The Grill — Prime Cuts",
    items: [
      { name: "Ribeye 400g", desc: "USDA Prime, 28-day dry-aged, bone-in", price: "QAR 210" },
      { name: "Filet Mignon 250g", desc: "The tenderest cut, butter-basted", price: "QAR 195" },
      { name: "Wagyu Striploin 300g", desc: "Australian MB7+, marbled & rich", price: "QAR 320" },
      { name: "Tomahawk 1kg", desc: "For sharing — a show-stopping bone-in ribeye", price: "QAR 540" },
      { name: "Porterhouse 600g", desc: "Strip & filet in one, dry-aged", price: "QAR 280" },
    ],
  },
  {
    section: "Sides",
    items: [
      { name: "Truffle Mac & Cheese", desc: "Aged cheddar, black truffle", price: "QAR 45" },
      { name: "Charred Asparagus", desc: "Hollandaise, toasted almonds", price: "QAR 38" },
      { name: "Triple-Cooked Chips", desc: "Rosemary salt, aioli", price: "QAR 32" },
      { name: "Creamed Spinach", desc: "Nutmeg, parmesan gratin", price: "QAR 34" },
    ],
  },
  {
    section: "Desserts",
    items: [
      { name: "Molten Valrhona Cake", desc: "Salted caramel, vanilla-bean gelato", price: "QAR 48" },
      { name: "Basque Cheesecake", desc: "Burnt top, berry coulis", price: "QAR 42" },
      { name: "Crème Brûlée", desc: "Tahitian vanilla, caramel crust", price: "QAR 40" },
    ],
  },
];

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Culinary Excellence"
        title="Our Menu"
        description="A celebration of prime beef and seasonal produce. Prices in Qatari Riyal, inclusive of taxes."
      />

      <div className="mt-16 space-y-16">
        {MENU.map((group) => (
          <section key={group.section}>
            <div className="mb-8 flex items-center gap-4">
              <h3 className="font-serif text-2xl font-semibold text-gold">{group.section}</h3>
              <span className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
            </div>
            <ul className="grid gap-x-12 gap-y-6 md:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.name} className="group flex items-baseline gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-lg text-cream transition-colors group-hover:text-gold">
                        {item.name}
                      </span>
                      <span className="h-px flex-1 translate-y-[-2px] border-b border-dotted border-brand-600" />
                      <span className="font-semibold text-gold">{item.price}</span>
                    </div>
                    <p className="mt-1 text-sm text-cream-dim">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-20 text-center">
        <Link href="/book" className="btn-gold text-base">
          Reserve Your Table
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
