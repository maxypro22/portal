import { z } from "zod";
import {
  BOOKING_STATUSES,
  MAX_PARTY_SIZE,
  MIN_PARTY_SIZE,
  SECTIONS,
  TABLE_SHAPES,
} from "./constants";
import { QATAR_PHONE_REGEX } from "./utils";

/**
 * Qatar phone number — accepts the common display formats users actually type
 * (e.g. "+974 3XXX XXXX", "+974-3XXX-XXXX") by stripping spaces/dashes before
 * checking the strict +974[3567]XXXXXXX pattern. The placeholder text shows a
 * spaced format, so the validator must tolerate it or "Continue" silently
 * blocks on correctly-formatted numbers.
 */
const qatarPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => QATAR_PHONE_REGEX.test(v), {
    message: "Enter a valid Qatar number, e.g. +974 3XXXXXXX",
  });

// --- Public booking creation -------------------------------------------------
// No tableId here — a table is auto-assigned server-side (see pickAvailableTable)
// based on locationId/partySize/date/timeSlot, not chosen by the guest.
export const createBookingSchema = z.object({
  locationId: z.string().min(1, "Please select a location"),
  guestName: z.string().trim().min(2, "Please enter your full name").max(80),
  guestPhone: qatarPhoneSchema,
  guestEmail: z.string().trim().email("Enter a valid email address"),
  partySize: z
    .number()
    .int()
    .min(MIN_PARTY_SIZE, `Minimum ${MIN_PARTY_SIZE} guest`)
    .max(MAX_PARTY_SIZE, `Maximum ${MAX_PARTY_SIZE} guests`),
  // YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  // HH:mm
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  specialRequests: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// --- Guest-details step (client form) ---------------------------------------
export const guestDetailsSchema = z.object({
  guestName: createBookingSchema.shape.guestName,
  guestPhone: createBookingSchema.shape.guestPhone,
  guestEmail: createBookingSchema.shape.guestEmail,
  specialRequests: createBookingSchema.shape.specialRequests,
});
export type GuestDetailsInput = z.infer<typeof guestDetailsSchema>;

// --- Admin: update booking ---------------------------------------------------
export const updateBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  guestName: z.string().trim().min(2).max(80).optional(),
  guestPhone: qatarPhoneSchema.optional(),
  guestEmail: z.string().trim().email().optional(),
  partySize: z.number().int().min(MIN_PARTY_SIZE).max(MAX_PARTY_SIZE).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tableId: z.string().min(1).optional(),
  specialRequests: z.string().trim().max(500).nullable().optional(),
});
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// --- Admin: table CRUD -------------------------------------------------------
export const tableSchema = z.object({
  locationId: z.string().min(1),
  number: z.number().int().min(1).max(999),
  capacity: z.number().int().min(1).max(20),
  section: z.enum(SECTIONS),
  shape: z.enum(TABLE_SHAPES),
  posX: z.number().min(0).max(100),
  posY: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
});
export type TableInput = z.infer<typeof tableSchema>;

// --- Admin: location CRUD ----------------------------------------------------
export const locationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(4).max(240),
  phone: z.string().trim().min(6).max(24),
  imageUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
});
export type LocationInput = z.infer<typeof locationSchema>;

// --- Auth --------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  // trimmed defensively — a stray copy-paste space silently breaks bcrypt.compare
  password: z.string().trim().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
