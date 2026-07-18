"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Check, UtensilsCrossed } from "lucide-react";
import { MENU_CATEGORIES } from "@/lib/menuData";
import { cn } from "@/lib/utils";

export type SelectedMoodItem = { key: string; name: string; image: string; price: string };

/**
 * Full-screen (mobile) / large modal (desktop) menu browser — the guest
 * switches between categories and multi-selects any number of items across
 * any number of categories. Selection changes apply immediately; "Done"
 * just closes the sheet. Category nav is a horizontal scroll strip on
 * phones/tablets and a vertical sidebar on desktop.
 */
export function MenuBrowserModal({
  open,
  onClose,
  selected,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  selected: SelectedMoodItem[];
  onToggle: (item: SelectedMoodItem) => void;
}) {
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].key);
  const selectedKeys = useMemo(() => new Set(selected.map((s) => s.key)), [selected]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const activeCat = MENU_CATEGORIES.find((c) => c.key === activeCategory) ?? MENU_CATEGORIES[0];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What are you in the mood for today?"
        className="relative z-10 flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-surface-border bg-surface-raised shadow-card-hover animate-scale-in sm:h-[85vh] sm:max-w-4xl sm:rounded-3xl lg:max-w-5xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-content sm:text-2xl">
              What are you in the mood for today?
            </h2>
            <p className="mt-0.5 text-xs text-content-dim sm:text-sm">
              Browse the menu and pick as many as you like.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-content-dim transition-colors hover:bg-surface-sunken hover:text-content"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Category nav — horizontal chips on phone/tablet, scrollable sidebar on desktop */}
          <div className="shrink-0 border-b border-surface-border lg:h-full lg:w-60 lg:border-b-0 lg:border-r">
            <div className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-3 lg:h-full lg:w-auto lg:flex-col lg:snap-none lg:overflow-y-auto lg:overflow-x-visible lg:px-3 lg:py-4">
              {MENU_CATEGORIES.map((cat) => {
                const count = selected.filter((s) => s.key.startsWith(`${cat.key}::`)).length;
                const active = cat.key === activeCategory;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      "flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full lg:justify-between lg:whitespace-normal",
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-content-muted hover:bg-surface-sunken hover:text-content"
                    )}
                  >
                    <span className="text-left">{cat.label}</span>
                    {count > 0 && (
                      <span className="grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-full bg-gold-gradient px-1 text-[10px] font-bold text-brand-950">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeCat.items.length === 0 ? (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center text-content-dim">
                <UtensilsCrossed className="h-8 w-8 opacity-50" />
                <p className="text-sm">No items in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {activeCat.items.map((item) => {
                  const key = `${activeCat.key}::${item.name}`;
                  const isSelected = selectedKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onToggle({ key, name: item.name, image: item.image, price: item.price })}
                      aria-pressed={isSelected}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5",
                        isSelected
                          ? "border-gold shadow-gold"
                          : "border-surface-border hover:border-gold/50"
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full bg-surface-sunken">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                        />
                        <div
                          className={cn(
                            "absolute inset-0 transition-colors",
                            isSelected ? "bg-gold-gradient/10" : "bg-black/0 group-hover:bg-black/10"
                          )}
                        />
                        {isSelected && (
                          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold-gradient text-brand-950 shadow-gold">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-content sm:text-sm">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gold">{item.price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-surface-border px-5 py-4 sm:px-6">
          <span className="text-sm text-content-dim">
            {selected.length === 0
              ? "Nothing selected yet"
              : `${selected.length} item${selected.length === 1 ? "" : "s"} selected`}
          </span>
          <button type="button" onClick={onClose} className="btn-gold px-6 py-2.5 text-sm">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
