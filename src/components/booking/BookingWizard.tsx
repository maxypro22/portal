"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  MapPin,
  Users,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Phone,
  Mail,
  User,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
  Clock,
  PartyPopper,
} from "lucide-react";
import { WizardProgress } from "./WizardProgress";
import { MenuBrowserModal, type SelectedMoodItem } from "./MenuBrowserModal";
import { Skeleton, EmptyState } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { guestDetailsSchema, type GuestDetailsInput } from "@/lib/validations";
import { parseSelectedMoodItems } from "@/lib/menuData";
import { MAX_ADVANCE_BOOKING_DAYS, MAX_PARTY_SIZE, MIN_PARTY_SIZE } from "@/lib/constants";
import {
  buildMonthGrid,
  cn,
  formatTime12h,
  formatLongDate,
  fromDateKey,
  generateSlotsForDay,
  normalizeQatarPhone,
  qatarNow,
  toDateKey,
} from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  _count?: { tables: number };
};
type DayHours = { dayOfWeek: number; isOpen: boolean; openMinutes: number; closeMinutes: number };
type BookingResult = {
  reference: string;
  timeSlot: string;
  date: string;
  guestName: string;
  location: { name: string; address: string };
  table: { number: number; capacity: number; section: string };
};

const STEPS = [
  { id: 1, label: "Location" },
  { id: 2, label: "Guests & Time" },
  { id: 3, label: "Details" },
  { id: 4, label: "Confirm" },
];
const LAST_STEP = STEPS.length;

export function BookingWizard() {
  const [step, setStep] = useState(1);

  // Selections — no table: it's auto-assigned server-side at booking time.
  const [location, setLocation] = useState<Location | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [details, setDetails] = useState<GuestDetailsInput | null>(null);

  // Result
  const [result, setResult] = useState<BookingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goNext = () => setStep((s) => Math.min(LAST_STEP, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSelectLocation = (loc: Location) => {
    if (loc.id !== location?.id) {
      setDateKey(null);
      setTimeSlot(null);
    }
    setLocation(loc);
  };

  // Changing party size can invalidate the currently-picked slot (a bigger
  // party may not fit wherever was free before), so clear it defensively.
  const handlePartySizeChange = (n: number) => {
    setPartySize(n);
    setTimeSlot(null);
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!location;
      case 2:
        return partySize >= MIN_PARTY_SIZE && !!dateKey && !!timeSlot;
      case 3:
        return !!details;
      default:
        return true;
    }
  }, [step, location, partySize, dateKey, timeSlot, details]);

  async function submitBooking() {
    if (!location || !dateKey || !timeSlot || !details) return;
    setSubmitting(true);
    try {
      const booking = await apiFetch<BookingResult>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          locationId: location.id,
          partySize,
          date: dateKey,
          timeSlot,
          guestName: details.guestName,
          guestPhone: normalizeQatarPhone(details.guestPhone),
          guestEmail: details.guestEmail,
          specialRequests: details.specialRequests || "",
        }),
      });
      setResult(booking);
      toast.success("Reservation confirmed!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Success screen replaces the wizard entirely. Uses the wizard's own
  // dateKey (the exact "YYYY-MM-DD" the guest picked) rather than parsing
  // result.date — the server returns a full ISO datetime string there,
  // which isn't the plain date key fromDateKey() expects.
  if (result) return <SuccessScreen result={result} partySize={partySize} dateKey={dateKey!} />;

  return (
    <div className="mx-auto max-w-4xl pb-24 lg:pb-0">
      {/* Sticky progress — stays visible while scrolling a step's content. */}
      <div className="sticky top-20 z-30 -mx-4 bg-surface-bg/90 px-4 py-3 backdrop-blur-md sm:top-24 sm:mx-0 sm:rounded-2xl sm:bg-surface-bg/70 sm:px-4">
        <WizardProgress steps={STEPS} current={step} />
      </div>

      <div className="card mt-6 p-6 sm:p-8 lg:p-10">
        {step === 1 && (
          <LocationStep selected={location} onSelect={handleSelectLocation} />
        )}
        {step === 2 && location && (
          <GuestsDateTimeStep
            partySize={partySize}
            onPartyChange={handlePartySizeChange}
            dateKey={dateKey}
            timeSlot={timeSlot}
            onPickDate={(d) => {
              setDateKey(d);
              setTimeSlot(null);
            }}
            onPickTime={setTimeSlot}
          />
        )}
        {step === 3 && (
          <DetailsStep defaultValues={details} onValid={setDetails} />
        )}
        {step === 4 && location && dateKey && timeSlot && details && (
          <ConfirmStep
            location={location}
            partySize={partySize}
            dateKey={dateKey}
            timeSlot={timeSlot}
            details={details}
          />
        )}
      </div>

      {/* Footer navigation — fixed bottom bar on phones (equal-width buttons), inline on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-3 border-t border-surface-border bg-surface-raised/95 px-4 py-3 backdrop-blur-md lg:static lg:mt-6 lg:flex lg:items-center lg:justify-between lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="btn-ghost justify-center px-5 py-2.5 text-sm disabled:invisible lg:flex-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < LAST_STEP ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="btn-gold justify-center px-6 py-2.5 text-sm lg:flex-none"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitBooking}
            disabled={submitting}
            className="btn-gold justify-center px-6 py-2.5 text-sm lg:flex-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                Confirm Reservation
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Step header ------------------------------ */
function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/5 text-gold">
        {icon}
      </span>
      <div>
        <h2 className="font-serif text-2xl font-bold text-content">{title}</h2>
        <p className="mt-1 text-sm text-content-dim">{subtitle}</p>
      </div>
    </div>
  );
}

/* ------------------------------ Step 1 --------------------------------- */
function LocationStep({
  selected,
  onSelect,
}: {
  selected: Location | null;
  onSelect: (l: Location) => void;
}) {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Location[]>("/api/locations")
      .then(setLocations)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Choose a Location"
        subtitle="Select the Steak Town branch you'd like to dine at."
      />

      {error && <EmptyState title="Couldn't load locations" description={error} />}

      {!locations && !error && <Skeleton className="h-12 w-full rounded-xl" />}

      {locations && (
        <LocationDropdown locations={locations} selected={selected} onSelect={onSelect} />
      )}
    </div>
  );
}

/** Mobile location picker: a dropdown listing each branch's name + address. */
function LocationDropdown({
  locations,
  selected,
  onSelect,
}: {
  locations: Location[];
  selected: Location | null;
  onSelect: (l: Location) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-base flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className={selected ? "text-content" : "text-content-dim"}>
          {selected ? selected.name : "Select a location"}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gold transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-surface-border bg-surface-raised shadow-card-hover">
          {locations.map((loc) => {
            const active = selected?.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  onSelect(loc);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                  active ? "bg-gold/15 text-gold" : "text-content-muted hover:bg-surface-sunken hover:text-content"
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium">{loc.name}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-80">{loc.address}</span>
                </span>
                {active && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Step 2 --------------------------------- */
/**
 * Combined Guests / Date / Time picker — one pill-shaped bar with three
 * segments, each opening a dropdown panel below (guest count list, a real
 * month calendar, and a tap-to-select time list). The time list is purely
 * generated from working hours — there's no availability restriction, so
 * any number of guests can pick the same time. No table is chosen here
 * either — one is auto-assigned for record-keeping when the booking is
 * submitted, and never blocks the reservation.
 */
function GuestsDateTimeStep({
  partySize,
  onPartyChange,
  dateKey,
  timeSlot,
  onPickDate,
  onPickTime,
}: {
  partySize: number;
  onPartyChange: (n: number) => void;
  dateKey: string | null;
  timeSlot: string | null;
  onPickDate: (d: string) => void;
  onPickTime: (t: string) => void;
}) {
  const [open, setOpen] = useState<"guests" | "date" | "time" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Per-weekday working hours (set from /admin/hours) — used to grey out
  // closed weekdays in the calendar and to bound the free time input to
  // hours the restaurant is actually open on the selected date.
  const [hoursByDay, setHoursByDay] = useState<DayHours[]>([]);
  useEffect(() => {
    apiFetch<DayHours[]>("/api/working-hours")
      .then(setHoursByDay)
      .catch(() => setHoursByDay([]));
  }, []);

  // How close to closing time the last slot sits (admin-editable from
  // /admin/hours) — regular slot spacing is fixed and unaffected by this.
  const [lastSeatingBuffer, setLastSeatingBuffer] = useState(30);
  useEffect(() => {
    apiFetch<{ lastSeatingBufferMinutes: number }>("/api/booking-settings")
      .then((s) => setLastSeatingBuffer(s.lastSeatingBufferMinutes))
      .catch(() => setLastSeatingBuffer(30));
  }, []);

  const closedDays = useMemo(
    () => new Set(hoursByDay.filter((d) => !d.isOpen).map((d) => d.dayOfWeek)),
    [hoursByDay]
  );
  const daySlots = useMemo(() => {
    if (!dateKey) return [];
    const dow = fromDateKey(dateKey).getDay();
    const dayHours = hoursByDay.find((d) => d.dayOfWeek === dow && d.isOpen);
    if (!dayHours) return [];
    return generateSlotsForDay(
      dow,
      { [dow]: { open: dayHours.openMinutes, close: dayHours.closeMinutes } },
      lastSeatingBuffer
    );
  }, [dateKey, hoursByDay, lastSeatingBuffer]);

  // Close the open panel on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const dateLabel = dateKey ? formatShortDate(fromDateKey(dateKey)) : "Select date";
  const timeLabel = timeSlot ? formatTime12h(timeSlot) : "Select time";

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<CalendarDays className="h-5 w-5" />}
        title="Guests, Date & Time"
        subtitle="Reservations run for 2 hours. Pick your preferred time — we'll seat you then."
      />

      <div ref={ref} className="relative">
        <div className="grid grid-cols-3 divide-x divide-gold/20 overflow-hidden rounded-2xl border-2 border-gold/40 bg-surface-sunken/60">
          <PillSegmentButton
            icon={<Users className="h-4 w-4" />}
            label="Guests"
            value={`${partySize} ${partySize === 1 ? "Guest" : "Guests"}`}
            active={open === "guests"}
            onClick={() => setOpen((v) => (v === "guests" ? null : "guests"))}
          />
          <PillSegmentButton
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date"
            value={dateLabel}
            active={open === "date"}
            onClick={() => setOpen((v) => (v === "date" ? null : "date"))}
          />
          <PillSegmentButton
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={timeLabel}
            active={open === "time"}
            disabled={!dateKey}
            onClick={() => dateKey && setOpen((v) => (v === "time" ? null : "time"))}
          />
        </div>

        {open && (
          <div className="absolute left-1/2 top-full z-30 mt-2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-card-hover sm:w-96">
            {open === "guests" && (
              <GuestsList max={MAX_PARTY_SIZE} value={partySize} onSelect={(n) => { onPartyChange(n); setOpen(null); }} />
            )}
            {open === "date" && (
              <MiniCalendar
                selectedKey={dateKey}
                closedDays={closedDays}
                onSelect={(k) => { onPickDate(k); setOpen(null); }}
              />
            )}
            {open === "time" && dateKey && (
              <TimesList
                slots={daySlots}
                value={timeSlot}
                onSelect={(t) => { onPickTime(t); setOpen(null); }}
              />
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-content-dim/70">
        Pick any time — every slot stays open no matter how many other guests book it.
      </p>
    </div>
  );
}

/** One tappable segment of the Guests/Date/Time pill bar. */
function PillSegmentButton({
  icon,
  label,
  value,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-3 transition-colors sm:py-4",
        active ? "bg-gold/10" : "hover:bg-gold/5",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span className="text-gold/70">{icon}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-content-dim">{label}</span>
      <span className="max-w-full truncate text-sm font-semibold text-content">{value}</span>
    </button>
  );
}

/** Guest-count dropdown list. */
function GuestsList({
  max,
  value,
  onSelect,
}: {
  max: number;
  value: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="max-h-72 overflow-y-auto py-2">
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={cn(
              "flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-gold-gradient text-brand-950" : "text-content-muted hover:bg-surface-sunken hover:text-content"
            )}
          >
            {n} {n === 1 ? "Guest" : "Guests"}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Scrollable time-slot list, generated from working hours — tap to select.
 * No restriction of any kind on which time can be picked: every slot stays
 * selectable regardless of the current time or how many other guests have
 * already picked it.
 */
function TimesList({
  slots,
  value,
  onSelect,
}: {
  slots: string[];
  value: string | null;
  onSelect: (t: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title="Closed on this day" description="Please choose another date." />
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto py-2">
      {slots.map((time) => {
        const active = value === time;
        return (
          <button
            key={time}
            type="button"
            onClick={() => onSelect(time)}
            className={cn(
              "flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-gold-gradient text-brand-950"
                : "text-content-muted hover:bg-surface-sunken hover:text-content"
            )}
          >
            {formatTime12h(time)}
          </button>
        );
      })}
    </div>
  );
}

/** Real month-view calendar (prev/next navigation, past & out-of-range days disabled). */
function MiniCalendar({
  selectedKey,
  closedDays,
  onSelect,
}: {
  selectedKey: string | null;
  closedDays?: Set<number>;
  onSelect: (key: string) => void;
}) {
  const today = useMemo(() => {
    const d = qatarNow();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_ADVANCE_BOOKING_DAYS);
    return d;
  }, [today]);

  const [viewDate, setViewDate] = useState(() => {
    const base = selectedKey ? fromDateKey(selectedKey) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const canGoPrev = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0) >= today;
  const canGoNext = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) <= maxDate;

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-lg text-content-dim transition-colors hover:bg-surface-sunken hover:text-content disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-serif text-sm font-semibold text-content">
          {viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          disabled={!canGoNext}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-lg text-content-dim transition-colors hover:bg-surface-sunken hover:text-content disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-semibold uppercase text-content-dim">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const key = toDateKey(day);
          const isPast = day < today;
          const isTooFar = day > maxDate;
          const isClosedWeekday = closedDays?.has(day.getDay()) ?? false;
          const disabled = isPast || isTooFar || isClosedWeekday;
          const isToday = key === toDateKey(today);
          const isSelected = key === selectedKey;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-sm transition-colors",
                isSelected
                  ? "bg-gold-gradient font-bold text-brand-950"
                  : disabled
                    ? "cursor-not-allowed text-content-dim/30 line-through"
                    : isToday
                      ? "border border-gold text-gold"
                      : "text-content hover:bg-gold/10"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Today" / "Tomorrow" / "16 Jul" for the compact pill display. */
function formatShortDate(date: Date): string {
  const today = qatarNow();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const key = toDateKey(date);
  if (key === toDateKey(today)) return "Today";
  if (key === toDateKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ------------------------------ Step 3 --------------------------------- */
function DetailsStep({
  defaultValues,
  onValid,
}: {
  defaultValues: GuestDetailsInput | null;
  onValid: (v: GuestDetailsInput | null) => void;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<GuestDetailsInput>({
    resolver: zodResolver(guestDetailsSchema),
    mode: "onChange",
    defaultValues: defaultValues ?? {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      specialRequests: "",
    },
  });

  // Selected menu items live here (with images, for the chip display) and
  // are synced into the form's plain specialRequests string (comma-joined
  // names) whenever they change — that string is all the DB actually stores.
  const [moodItems, setMoodItems] = useState<SelectedMoodItem[]>(() =>
    parseSelectedMoodItems(defaultValues?.specialRequests)
  );
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMoodItem(item: SelectedMoodItem) {
    setMoodItems((prev) => {
      const exists = prev.some((p) => p.key === item.key);
      const next = exists ? prev.filter((p) => p.key !== item.key) : [...prev, item];
      setValue("specialRequests", next.map((n) => n.name).join(", "), { shouldValidate: true });
      return next;
    });
  }

  function removeMoodItem(key: string) {
    setMoodItems((prev) => {
      const next = prev.filter((p) => p.key !== key);
      setValue("specialRequests", next.map((n) => n.name).join(", "), { shouldValidate: true });
      return next;
    });
  }

  // Lift valid values up so the wizard can enable Continue / submit.
  const values = watch();
  useEffect(() => {
    onValid(isValid ? (values as GuestDetailsInput) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, values.guestName, values.guestPhone, values.guestEmail, values.specialRequests]);

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<User className="h-5 w-5" />}
        title="Your Details"
        subtitle="We'll use these to confirm and manage your reservation."
      />

      <form className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" icon={<User className="h-4 w-4" />} error={errors.guestName?.message}>
          <input
            {...register("guestName")}
            placeholder="Khalid Ali"
            className="input-base"
            autoComplete="name"
          />
        </Field>

        <Field label="Phone (Qatar)" icon={<Phone className="h-4 w-4" />} error={errors.guestPhone?.message}>
          <input
            {...register("guestPhone")}
            placeholder="+974"
            className="input-base"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Email (optional)" icon={<Mail className="h-4 w-4" />} error={errors.guestEmail?.message}>
            <input
              {...register("guestEmail")}
              placeholder="you@example.com"
              className="input-base"
              inputMode="email"
              autoComplete="email"
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-muted">
            <span className="text-gold/70"><UtensilsCrossed className="h-4 w-4" /></span>
            What are you in the mood for today?
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="input-base flex items-center justify-between text-left"
          >
            <span className={moodItems.length ? "text-content" : "text-content-dim"}>
              {moodItems.length
                ? `${moodItems.length} item${moodItems.length === 1 ? "" : "s"} selected`
                : "Browse the menu — optional"}
            </span>
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-gold" />
          </button>

          {/* Selected items — shown as chips (thumbnail + name + remove) */}
          {moodItems.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {moodItems.map((item) => (
                <span
                  key={item.key}
                  className="flex items-center gap-2 rounded-full border border-surface-border bg-surface-sunken/40 py-1 pl-1 pr-3 text-xs text-content-muted"
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                  {item.name}
                  <span className="font-semibold text-gold">{item.price}</span>
                  <button
                    type="button"
                    onClick={() => removeMoodItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="text-content-dim transition-colors hover:text-status-cancelled"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>

      <MenuBrowserModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        selected={moodItems}
        onToggle={toggleMoodItem}
      />
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-muted">
        {icon && <span className="text-gold/70">{icon}</span>}
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-status-cancelled">{error}</span>}
    </label>
  );
}

/* ------------------------------ Step 4 --------------------------------- */
function ConfirmStep({
  location,
  partySize,
  dateKey,
  timeSlot,
  details,
}: {
  location: Location;
  partySize: number;
  dateKey: string;
  timeSlot: string;
  details: GuestDetailsInput;
}) {
  const rows = [
    { icon: <MapPin className="h-4 w-4" />, label: "Location", value: location.name },
    { icon: <Users className="h-4 w-4" />, label: "Guests", value: `${partySize}` },
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Date",
      value: formatLongDate(fromDateKey(dateKey)),
    },
    { icon: <Clock className="h-4 w-4" />, label: "Time", value: formatTime12h(timeSlot) },
    { icon: <User className="h-4 w-4" />, label: "Name", value: details.guestName },
    { icon: <Phone className="h-4 w-4" />, label: "Phone", value: normalizeQatarPhone(details.guestPhone) },
    ...(details.guestEmail
      ? [{ icon: <Mail className="h-4 w-4" />, label: "Email", value: details.guestEmail }]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="Review & Confirm"
        subtitle="Please check the details below before confirming your reservation."
      />

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        <dl className="divide-y divide-surface-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-4 px-5 py-3.5 odd:bg-surface-sunken/30">
              <dt className="flex w-32 shrink-0 items-center gap-2 text-sm text-content-dim">
                <span className="text-gold/70">{r.icon}</span>
                {r.label}
              </dt>
              <dd className="text-sm font-medium text-content">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {details.specialRequests && (
        <div className="mt-4 rounded-xl border border-surface-border bg-surface-sunken/30 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe text-content-dim">
            <UtensilsCrossed className="h-3.5 w-3.5" /> In the mood for
          </p>
          {(() => {
            const moodItems = parseSelectedMoodItems(details.specialRequests);
            if (moodItems.length === 0) {
              return <p className="mt-2 text-sm text-content-muted">{details.specialRequests}</p>;
            }
            return (
              <div className="mt-3 flex flex-wrap gap-3">
                {moodItems.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised py-1 pl-1 pr-3">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                    <span className="text-sm text-content-muted">{item.name}</span>
                    <span className="text-sm font-semibold text-gold">{item.price}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <p className="mt-5 text-center text-xs text-content-dim/70">
        A table will be assigned automatically to fit your party. Your reservation will be held as{" "}
        <span className="text-status-pending">Pending</span> until confirmed by our team.
      </p>
    </div>
  );
}

/* --------------------------- Success screen ---------------------------- */
function SuccessScreen({
  result,
  partySize,
  dateKey,
}: {
  result: BookingResult;
  partySize: number;
  dateKey: string;
}) {
  return (
    <div className="mx-auto max-w-2xl animate-scale-in text-center">
      <div className="card relative overflow-hidden px-6 py-12 sm:px-12">
        <div className="absolute inset-0 -z-10 bg-brand-radial" />
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-gold/10 text-gold animate-pulse-gold">
          <PartyPopper className="h-9 w-9" />
        </span>
        <h2 className="mt-6 font-serif text-3xl font-bold text-content">Reservation Confirmed</h2>
        <p className="mt-2 text-content-muted">
          Thank you, {result.guestName.split(" ")[0]}. We can&apos;t wait to host you.
        </p>

        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-gold/40 bg-gold/5 px-6 py-5">
          <p className="text-xs uppercase tracking-luxe text-content-dim">Booking Reference</p>
          <p className="mt-1 font-serif text-3xl font-bold tracking-widest text-gold">
            {result.reference}
          </p>
        </div>

        <dl className="mx-auto mt-8 grid max-w-md gap-3 text-left text-sm">
          <SummaryRow label="Location" value={result.location.name} />
          <SummaryRow label="Guests" value={`${partySize}`} />
          <SummaryRow label="Date" value={formatLongDate(fromDateKey(dateKey))} />
          <SummaryRow label="Time" value={formatTime12h(result.timeSlot)} />
        </dl>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost text-sm">
            Back to Home
          </Link>
          <Link href="/book" className="btn-gold text-sm" onClick={() => window.location.reload()}>
            Book Another Table
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-surface-border pb-2">
      <dt className="text-content-dim">{label}</dt>
      <dd className="font-medium text-content">{value}</dd>
    </div>
  );
}
