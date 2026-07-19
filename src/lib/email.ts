import { Resend } from "resend";
import { prisma } from "./prisma";
import { BRAND } from "./constants";
import { formatTime12h } from "./utils";

// RESEND_API_KEY must be set for emails to actually send — see
// prisma/add-notification-emails.sql's header comment and README setup notes
// for how to get one. Without it, booking creation still succeeds; emails
// are just skipped (logged, not thrown) so a missing/misconfigured key never
// breaks the booking flow itself.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend requires the "from" address's domain to be verified in your Resend
// account. Until steaktown.qa is verified there, RESEND_FROM_EMAIL can be
// left unset and this falls back to Resend's shared test sender, which works
// immediately with no domain setup (see resend.com/docs — onboarding@resend.dev).
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Steak Town <onboarding@resend.dev>";

type BookingEmailData = {
  reference: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  partySize: number;
  date: Date; // calendar day, local components are what matter (see schema note)
  timeSlot: string; // "HH:mm"
  specialRequests: string | null;
  location: { name: string; address: string };
};

function buildEmailHtml(b: BookingEmailData): string {
  const dateLabel = b.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = formatTime12h(b.timeSlot);

  const rows = [
    ["Reference", b.reference],
    ["Location", `${b.location.name} — ${b.location.address}`],
    ["Date", dateLabel],
    ["Time", timeLabel],
    ["Guests", String(b.partySize)],
    ["Name", b.guestName],
    ["Phone", b.guestPhone],
    ...(b.specialRequests ? [["Requested items", b.specialRequests]] : []),
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 16px;color:#a99f92;font-size:13px;border-bottom:1px solid #3a2f2f;white-space:nowrap;">${label}</td>
          <td style="padding:10px 16px;color:#f5efe6;font-size:14px;font-weight:600;border-bottom:1px solid #3a2f2f;">${value}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#2d2424;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2d2424;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#241d1d;border-radius:16px;overflow:hidden;border:1px solid #4a3c3c;">
            <tr>
              <td style="padding:32px 24px 16px;text-align:center;">
                <div style="color:#e0b357;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${BRAND.name}</div>
                <div style="color:#f5efe6;font-size:22px;font-weight:bold;">Reservation Confirmed</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #4a3c3c;border-radius:12px;">
                  ${rowsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 32px;text-align:center;color:#a99f92;font-size:12px;line-height:1.6;">
                Your table will be assigned automatically to fit your party.<br />
                Questions? Call ${BRAND.phones[0]}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends a booking-confirmation email to the guest (if they gave an email —
 * it's optional) and a separate notification email to every address
 * configured in /admin/emails (restaurant owner/staff). Never throws — a
 * missing API key or a delivery failure is logged and swallowed so it can
 * never break booking creation itself.
 */
export async function sendBookingConfirmationEmails(booking: BookingEmailData): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping booking confirmation email.");
    return;
  }

  const html = buildEmailHtml(booking);
  const sends: Promise<unknown>[] = [];

  if (booking.guestEmail) {
    sends.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: booking.guestEmail,
        subject: `Reservation Confirmed — ${booking.reference}`,
        html,
      })
    );
  }

  const owners = await prisma.notificationEmail.findMany({ select: { email: true } });
  if (owners.length > 0) {
    sends.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: owners.map((o) => o.email),
        subject: `New Booking — ${booking.reference}`,
        html,
      })
    );
  }

  const results = await Promise.allSettled(sends);
  for (const r of results) {
    if (r.status === "rejected") console.error("[email] Failed to send booking email:", r.reason);
  }
}
