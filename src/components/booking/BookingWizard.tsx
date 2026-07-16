"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Minus,
  Plus,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Armchair,
  Clock,
  PartyPopper,
} from "lucide-react";
import { FloorPlan, type FloorTable } from "./FloorPlan";
import { TableGrid } from "./TableGrid";
import { WizardProgress } from "./WizardProgress";
import { Skeleton, EmptyState, ImagePlaceholder } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { guestDetailsSchema, type GuestDetailsInput } from "@/lib/validations";
import {
  MAX_PARTY_SIZE,
  MIN_PARTY_SIZE,
  SECTION_META,
  type Section,
} from "@/lib/constants";
import {
  cn,
  formatTime12h,
  formatLongDate,
  fromDateKey,
  normalizeQatarPhone,
  seatLabel,
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
type Slot = { time: string; past: boolean; available: boolean };
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
  { id: 2, label: "Table" },
  { id: 3, label: "Guests" },
  { id: 4, label: "Date & Time" },
  { id: 5, label: "Details" },
  { id: 6, label: "Confirm" },
];

export function BookingWizard() {
  const [step, setStep] = useState(1);

  // Selections
  const [location, setLocation] = useState<Location | null>(null);
  const [table, setTable] = useState<FloorTable | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [details, setDetails] = useState<GuestDetailsInput | null>(null);

  // Result
  const [result, setResult] = useState<BookingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goNext = () => setStep((s) => Math.min(6, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Reset downstream selections when an upstream choice changes.
  const handleSelectLocation = (loc: Location) => {
    if (loc.id !== location?.id) {
      setTable(null);
      setDateKey(null);
      setTimeSlot(null);
    }
    setLocation(loc);
  };
  const handleSelectTable = (t: FloorTable) => {
    setTable(t);
    // Keep party size within the new table capacity.
    setPartySize((p) => Math.min(p, t.capacity));
    setTimeSlot(null);
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!location;
      case 2:
        return !!table;
      case 3:
        return partySize >= MIN_PARTY_SIZE && !!table && partySize <= table.capacity;
      case 4:
        return !!dateKey && !!timeSlot;
      case 5:
        return !!details;
      default:
        return true;
    }
  }, [step, location, table, partySize, dateKey, timeSlot, details]);

  async function submitBooking() {
    if (!location || !table || !dateKey || !timeSlot || !details) return;
    setSubmitting(true);
    try {
      const booking = await apiFetch<BookingResult>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          locationId: location.id,
          tableId: table.id,
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

  // Success screen replaces the wizard entirely.
  if (result) return <SuccessScreen result={result} partySize={partySize} />;

  return (
    <div className="mx-auto max-w-4xl pb-24 lg:pb-0">
      <WizardProgress steps={STEPS} current={step} />

      <div className="card mt-10 p-6 sm:p-8 lg:p-10">
        {step === 1 && (
          <LocationStep selected={location} onSelect={handleSelectLocation} />
        )}
        {step === 2 && location && (
          <TableStep
            location={location}
            selected={table}
            partySize={partySize}
            onSelect={handleSelectTable}
          />
        )}
        {step === 3 && table && (
          <PartyStep table={table} partySize={partySize} onChange={setPartySize} />
        )}
        {step === 4 && location && table && (
          <DateTimeStep
            location={location}
            table={table}
            dateKey={dateKey}
            timeSlot={timeSlot}
            onPickDate={(d) => {
              setDateKey(d);
              setTimeSlot(null);
            }}
            onPickTime={setTimeSlot}
          />
        )}
        {step === 5 && (
          <DetailsStep defaultValues={details} onValid={setDetails} />
        )}
        {step === 6 && location && table && dateKey && timeSlot && details && (
          <ConfirmStep
            location={location}
            table={table}
            partySize={partySize}
            dateKey={dateKey}
            timeSlot={timeSlot}
            details={details}
          />
        )}
      </div>

      {/* Footer navigation — fixed bottom bar on phones, inline on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-brand-600/40 bg-brand-950/95 px-4 py-3 backdrop-blur-md lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="btn-ghost px-5 py-2.5 text-sm disabled:invisible"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < 6 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="btn-gold flex-1 justify-center px-6 py-2.5 text-sm lg:flex-none"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitBooking}
            disabled={submitting}
            className="btn-gold flex-1 justify-center px-6 py-2.5 text-sm lg:flex-none"
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
        <h2 className="font-serif text-2xl font-bold text-cream">{title}</h2>
        <p className="mt-1 text-sm text-cream-dim">{subtitle}</p>
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

      {!locations && !error && (
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {locations && (
        <div className="grid gap-5 sm:grid-cols-2">
          {locations.map((loc) => {
            const active = selected?.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelect(loc)}
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1",
                  active
                    ? "border-gold shadow-gold"
                    : "border-brand-600/50 hover:border-gold/50"
                )}
              >
                <ImagePlaceholder
                  label={loc.name}
                  className="h-36 w-full shrink-0"
                  icon={<MapPin className="h-7 w-7" />}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg font-semibold text-cream">
                      {loc.name}
                    </h3>
                    {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" />}
                  </div>
                  <p className="mt-2 flex items-start gap-2 text-sm text-cream-dim">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                    {loc.address}
                  </p>
                  {loc._count && (
                    <p className="mt-auto pt-3 text-xs text-cream-dim/70">
                      {loc._count.tables} tables available
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Step 2 --------------------------------- */
function TableStep({
  location,
  selected,
  partySize,
  onSelect,
}: {
  location: Location;
  selected: FloorTable | null;
  partySize: number;
  onSelect: (t: FloorTable) => void;
}) {
  const [tables, setTables] = useState<FloorTable[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTables(null);
    apiFetch<FloorTable[]>(`/api/tables?locationId=${location.id}`)
      .then(setTables)
      .catch((e) => setError(e.message));
  }, [location.id]);

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<Armchair className="h-5 w-5" />}
        title="Select Your Table"
        subtitle="Pick a table from the Main Hall, Terrace, or VIP booths."
      />

      {error && <EmptyState title="Couldn't load the tables" description={error} />}
      {!tables && !error && (
        <>
          <Skeleton className="hidden floorplan-canvas w-full rounded-2xl sm:block" />
          <div className="grid grid-cols-4 gap-2.5 sm:hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
            ))}
          </div>
        </>
      )}

      {tables && (
        <>
          {/* Visual floor plan — larger screens */}
          <div className="hidden sm:block">
            <FloorPlan
              tables={tables}
              selectedTableId={selected?.id}
              onSelect={onSelect}
              mode="select"
            />
          </div>

          {/* Sectioned tappable grid — phones */}
          <div className="sm:hidden">
            <TableGrid
              tables={tables}
              selectedTableId={selected?.id}
              partySize={partySize}
              onSelect={onSelect}
            />
          </div>

          {selected && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-cream">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              Selected <span className="font-semibold text-gold">Table {selected.number}</span> ·{" "}
              {seatLabel(selected.capacity)} ·{" "}
              {SECTION_META[selected.section as Section]?.label ?? selected.section}
              {partySize > selected.capacity && (
                <span className="text-status-cancelled"> — too small for {partySize} guests</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------ Step 3 --------------------------------- */
function PartyStep({
  table,
  partySize,
  onChange,
}: {
  table: FloorTable;
  partySize: number;
  onChange: (n: number) => void;
}) {
  const max = Math.min(MAX_PARTY_SIZE, table.capacity);
  const dec = () => onChange(Math.max(MIN_PARTY_SIZE, partySize - 1));
  const inc = () => onChange(Math.min(max, partySize + 1));

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<Users className="h-5 w-5" />}
        title="How Many Guests?"
        subtitle={`Table ${table.number} seats up to ${table.capacity}. Choose your party size.`}
      />

      <div className="flex flex-col items-center gap-8 py-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={dec}
            disabled={partySize <= MIN_PARTY_SIZE}
            aria-label="Decrease guests"
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:opacity-40"
          >
            <Minus className="h-5 w-5" />
          </button>

          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-gold bg-gold/5 shadow-gold">
            <span className="font-serif text-5xl font-bold text-gold">{partySize}</span>
            <span className="text-[11px] uppercase tracking-luxe text-cream-dim">
              {partySize === 1 ? "Guest" : "Guests"}
            </span>
          </div>

          <button
            type="button"
            onClick={inc}
            disabled={partySize >= max}
            aria-label="Increase guests"
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: max }).map((_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={cn(
                  "h-10 w-10 rounded-lg border text-sm font-semibold transition-all",
                  partySize === n
                    ? "border-gold bg-gold-gradient text-brand-950"
                    : "border-brand-600 text-cream-muted hover:border-gold/50"
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        {max < MAX_PARTY_SIZE && (
          <p className="text-xs text-cream-dim">
            Need a larger party? Go back and pick a VIP booth or 6-seater.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Step 4 --------------------------------- */
function DateTimeStep({
  location,
  table,
  dateKey,
  timeSlot,
  onPickDate,
  onPickTime,
}: {
  location: Location;
  table: FloorTable;
  dateKey: string | null;
  timeSlot: string | null;
  onPickDate: (d: string) => void;
  onPickTime: (t: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the next 21 selectable days.
  const days = useMemo(() => {
    const list: { key: string; date: Date }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push({ key: toDateKey(d), date: d });
    }
    return list;
  }, []);

  const loadSlots = useCallback(
    async (key: string) => {
      setLoadingSlots(true);
      setError(null);
      try {
        const data = await apiFetch<{ slots: Slot[] }>(
          `/api/availability?locationId=${location.id}&date=${key}&tableId=${table.id}`
        );
        setSlots(data.slots);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load times");
      } finally {
        setLoadingSlots(false);
      }
    },
    [location.id, table.id]
  );

  useEffect(() => {
    if (dateKey) loadSlots(dateKey);
    else setSlots(null);
  }, [dateKey, loadSlots]);

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<CalendarDays className="h-5 w-5" />}
        title="Pick a Date & Time"
        subtitle={`Reservations run for 2 hours. Availability shown for Table ${table.number}.`}
      />

      {/* Date strip */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-luxe text-cream-dim">Date</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map(({ key, date }) => {
            const active = dateKey === key;
            const isToday = key === toDateKey(new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPickDate(key)}
                className={cn(
                  "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl border-2 px-3 py-2.5 transition-all",
                  active
                    ? "border-gold bg-gold-gradient text-brand-950"
                    : "border-brand-600/60 text-cream-muted hover:border-gold/50"
                )}
              >
                <span className="text-[10px] font-semibold uppercase">
                  {date.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span className="font-serif text-lg font-bold leading-none">
                  {date.getDate()}
                </span>
                <span className="text-[9px] uppercase">
                  {isToday ? "Today" : date.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe text-cream-dim">
          <Clock className="h-3.5 w-3.5" /> Time
        </p>

        {!dateKey && (
          <p className="rounded-xl border border-dashed border-brand-600/60 bg-brand-950/30 px-4 py-8 text-center text-sm text-cream-dim">
            Select a date to see available times.
          </p>
        )}

        {dateKey && (loadingSlots || slots === null) && (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        )}

        {error && <EmptyState title="Couldn't load times" description={error} />}

        {dateKey && !loadingSlots && slots && slots.length === 0 && (
          <EmptyState
            title="Closed on this day"
            description="Please choose another date within our working hours."
          />
        )}

        {dateKey && !loadingSlots && slots && slots.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {slots.map((slot) => {
                const disabled = !slot.available;
                const active = timeSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPickTime(slot.time)}
                    className={cn(
                      "rounded-lg border-2 px-2 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "border-gold bg-gold-gradient text-brand-950"
                        : disabled
                          ? "cursor-not-allowed border-brand-700 bg-brand-900/40 text-cream-dim/40 line-through"
                          : "border-brand-600/60 text-cream-muted hover:border-gold/60 hover:text-cream"
                    )}
                  >
                    {formatTime12h(slot.time)}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-cream-dim/70">
              Struck-through times are already booked or have passed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Step 5 --------------------------------- */
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
    formState: { errors, isValid },
  } = useForm<GuestDetailsInput>({
    resolver: zodResolver(guestDetailsSchema),
    mode: "onChange",
    defaultValues: defaultValues ?? {
      guestName: "",
      guestPhone: "+974",
      guestEmail: "",
      specialRequests: "",
    },
  });

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
            placeholder="e.g. Khalid Al-Marri"
            className="input-base"
            autoComplete="name"
          />
        </Field>

        <Field label="Phone (Qatar)" icon={<Phone className="h-4 w-4" />} error={errors.guestPhone?.message}>
          <input
            {...register("guestPhone")}
            placeholder="+974 3XXX XXXX"
            className="input-base"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Email" icon={<Mail className="h-4 w-4" />} error={errors.guestEmail?.message}>
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
          <Field
            label="Special Requests (optional)"
            icon={<MessageSquare className="h-4 w-4" />}
            error={errors.specialRequests?.message}
          >
            <textarea
              {...register("specialRequests")}
              rows={3}
              placeholder="Allergies, celebrations, seating preferences…"
              className="input-base resize-none"
            />
          </Field>
        </div>
      </form>
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
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-muted">
        {icon && <span className="text-gold/70">{icon}</span>}
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-status-cancelled">{error}</span>}
    </label>
  );
}

/* ------------------------------ Step 6 --------------------------------- */
function ConfirmStep({
  location,
  table,
  partySize,
  dateKey,
  timeSlot,
  details,
}: {
  location: Location;
  table: FloorTable;
  partySize: number;
  dateKey: string;
  timeSlot: string;
  details: GuestDetailsInput;
}) {
  const rows = [
    { icon: <MapPin className="h-4 w-4" />, label: "Location", value: location.name },
    {
      icon: <Armchair className="h-4 w-4" />,
      label: "Table",
      value: `Table ${table.number} · ${SECTION_META[table.section as Section]?.label ?? table.section} · ${seatLabel(table.capacity)}`,
    },
    { icon: <Users className="h-4 w-4" />, label: "Guests", value: `${partySize}` },
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Date",
      value: formatLongDate(fromDateKey(dateKey)),
    },
    { icon: <Clock className="h-4 w-4" />, label: "Time", value: `${formatTime12h(timeSlot)} (2 hrs)` },
    { icon: <User className="h-4 w-4" />, label: "Name", value: details.guestName },
    { icon: <Phone className="h-4 w-4" />, label: "Phone", value: normalizeQatarPhone(details.guestPhone) },
    { icon: <Mail className="h-4 w-4" />, label: "Email", value: details.guestEmail },
  ];

  return (
    <div className="animate-fade-in">
      <StepHeader
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="Review & Confirm"
        subtitle="Please check the details below before confirming your reservation."
      />

      <div className="overflow-hidden rounded-2xl border border-brand-600/50">
        <dl className="divide-y divide-brand-600/40">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-4 px-5 py-3.5 odd:bg-brand-950/30">
              <dt className="flex w-32 shrink-0 items-center gap-2 text-sm text-cream-dim">
                <span className="text-gold/70">{r.icon}</span>
                {r.label}
              </dt>
              <dd className="text-sm font-medium text-cream">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {details.specialRequests && (
        <div className="mt-4 rounded-xl border border-brand-600/40 bg-brand-950/30 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe text-cream-dim">
            <MessageSquare className="h-3.5 w-3.5" /> Special Requests
          </p>
          <p className="mt-2 text-sm text-cream-muted">{details.specialRequests}</p>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-cream-dim/70">
        Your reservation will be held as <span className="text-status-pending">Pending</span> until
        confirmed by our team.
      </p>
    </div>
  );
}

/* --------------------------- Success screen ---------------------------- */
function SuccessScreen({
  result,
  partySize,
}: {
  result: BookingResult;
  partySize: number;
}) {
  return (
    <div className="mx-auto max-w-2xl animate-scale-in text-center">
      <div className="card relative overflow-hidden px-6 py-12 sm:px-12">
        <div className="absolute inset-0 -z-10 bg-brand-radial" />
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-gold/10 text-gold animate-pulse-gold">
          <PartyPopper className="h-9 w-9" />
        </span>
        <h2 className="mt-6 font-serif text-3xl font-bold text-cream">Reservation Confirmed</h2>
        <p className="mt-2 text-cream-muted">
          Thank you, {result.guestName.split(" ")[0]}. We can&apos;t wait to host you.
        </p>

        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-gold/40 bg-gold/5 px-6 py-5">
          <p className="text-xs uppercase tracking-luxe text-cream-dim">Booking Reference</p>
          <p className="mt-1 font-serif text-3xl font-bold tracking-widest text-gold">
            {result.reference}
          </p>
        </div>

        <dl className="mx-auto mt-8 grid max-w-md gap-3 text-left text-sm">
          <SummaryRow label="Location" value={result.location.name} />
          <SummaryRow label="Table" value={`Table ${result.table.number} · ${seatLabel(result.table.capacity)}`} />
          <SummaryRow label="Guests" value={`${partySize}`} />
          <SummaryRow label="Date" value={formatLongDate(fromDateKey(result.date))} />
          <SummaryRow label="Time" value={`${formatTime12h(result.timeSlot)} (2 hrs)`} />
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
    <div className="flex items-center justify-between gap-4 border-b border-brand-600/30 pb-2">
      <dt className="text-cream-dim">{label}</dt>
      <dd className="font-medium text-cream">{value}</dd>
    </div>
  );
}
