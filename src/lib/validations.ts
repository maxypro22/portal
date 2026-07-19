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
 * Local Qatar mobile number — the guest types just the 8 digits (+974 is
 * shown as a placeholder only, not part of the value). Strips spaces/dashes
 * and a redundant "+974"/"00974" prefix if the guest types it anyway, checks
 * exactly 8 digits remain (no leading-digit restriction), then re-attaches
 * "+974" so the STORED/displayed value is always a full, dialable number —
 * only the form's input UX treats +974 as implicit, not the data itself.
 */
const qatarPhoneSchema = z
  .string()
  .trim()
  .transform((v) => {
    let digits = v.replace(/[^\d]/g, "");
    if (digits.startsWith("00974")) digits = digits.slice(5);
    else if (digits.startsWith("974") && digits.length > 8) digits = digits.slice(3);
    return digits;
  })
  .refine((v) => QATAR_PHONE_REGEX.test(v), {
    message: "Enter your 8-digit mobile number",
  })
  .transform((digits) => `+974${digits}`);

// --- Public booking creation -------------------------------------------------
// No tableId here — a table is auto-assigned server-side (see pickAvailableTable)
// based on locationId/partySize/date/timeSlot, not chosen by the guest.
export const createBookingSchema = z.object({
  locationId: z.string().min(1, "Please select a location"),
  guestName: z.string().trim().min(2, "Please enter your full name").max(80),
  guestPhone: qatarPhoneSchema,
  guestEmail: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
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
  guestEmail: z.string().trim().email().optional().or(z.literal("")),
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

// --- Admin: user (dashboard login accounts) management ----------------------
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Please enter a name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const changePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// --- Admin: booking notification emails --------------------------------------
export const notificationEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  label: z.string().trim().max(60).optional().or(z.literal("")),
});
export type NotificationEmailInput = z.infer<typeof notificationEmailSchema>;
