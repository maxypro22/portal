"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = { id: number; label: string };

export function WizardProgress({
  steps,
  current,
}: {
  steps: WizardStep[];
  current: number;
}) {
  return (
    <nav aria-label="Booking progress" className="mx-auto max-w-3xl">
      <ol className="flex items-center">
        {steps.map((step, i) => {
          const isDone = step.id < current;
          const isActive = step.id === current;
          const isLast = i === steps.length - 1;
          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isDone && "border-gold bg-gold-gradient text-brand-950",
                    isActive && "border-gold bg-gold/10 text-gold shadow-gold",
                    !isDone && !isActive && "border-surface-border-strong bg-surface-raised text-content-dim"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span
                  className={cn(
                    "hidden text-center text-[11px] font-medium sm:block",
                    isActive ? "text-gold" : isDone ? "text-content-muted" : "text-content-dim/70"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={cn(
                    "mx-2 mb-6 h-0.5 flex-1 rounded-full transition-colors duration-500 sm:mx-3",
                    isDone ? "bg-gold" : "bg-surface-border-strong"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
