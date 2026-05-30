import nodemailer, { type Transporter } from "nodemailer";

/**
 * Mailer del api. Envía el correo de confirmación de reserva al cliente,
 * con un diseño que reusa la marca EMBER del sistema (wordmark naranja sobre
 * fondo crema, igual que el dashboard).
 *
 * Configuración por entorno (SMTP de Gmail con app password):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 * Si falta configuración, el envío se omite silenciosamente (la reserva se
 * crea igual; el correo es un efecto secundario que nunca debe romper el flujo).
 */

let cached: Transporter | null = null;
let resolved = false;

function getTransport(): Transporter | null {
  if (resolved) return cached;
  resolved = true;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn("[mailer] SMTP sin configurar — no se enviarán correos.");
    cached = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = TLS implícito; 587 = STARTTLS
    auth: { user, pass },
  });
  return cached;
}

/* ─── Formato de fecha en español (sin depender del locale del SO) ─── */
const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]} ${d} de ${MONTHS[m - 1]} de ${y}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ReservationEmailData {
  customerName: string;
  customerEmail: string | null;
  date: string;
  timeSlot: string;
  partySize: number;
  zoneName: string;
  tableLabel: string;
  occasion: string | null;
  restrictions: string[];
  mesero: string | null;
}

function reservationRows(r: ReservationEmailData): string {
  const rows: [string, string][] = [
    ["Fecha", formatDateLong(r.date)],
    ["Hora", `${r.timeSlot} · Turno cena`],
    ["Comensales", `${r.partySize} ${r.partySize === 1 ? "persona" : "personas"}`],
    ["Mesa", `${r.zoneName} · Mesa ${r.tableLabel}`],
  ];
  if (r.mesero) rows.push(["Mesero a cargo", r.mesero]);
  if (r.occasion) rows.push(["Ocasión", r.occasion]);
  if (r.restrictions.length > 0)
    rows.push(["Restricciones", r.restrictions.join(", ")]);

  return rows
    .map(
      ([label, value], i) => `
      <tr>
        <td style="padding:13px 0;border-bottom:${
          i === rows.length - 1 ? "none" : "1px solid #EDE6DC"
        };font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#6B4F3A;text-transform:uppercase;">${escapeHtml(
          label,
        )}</td>
        <td align="right" style="padding:13px 0;border-bottom:${
          i === rows.length - 1 ? "none" : "1px solid #EDE6DC"
        };font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1F1F1F;">${escapeHtml(
          value,
        )}</td>
      </tr>`,
    )
    .join("");
}

function reservationEmailHtml(r: ReservationEmailData): string {
  const firstName = r.customerName.trim().split(/\s+/)[0] || r.customerName;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FAF5EB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EB;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #EDE6DC;border-radius:18px;overflow:hidden;">

        <!-- Header con el wordmark EMBER -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #EDE6DC;background:#FFFFFF;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:3px;color:#C2410C;">EMBER</td>
            <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#1F1F1F;">Casa Olivar</td>
          </tr></table>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:36px 32px 8px 32px;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#7C8A6A;font-weight:700;">RESERVA CONFIRMADA</div>
          <h1 style="margin:14px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:#1F1F1F;">¡Lista, ${escapeHtml(
            firstName,
          )} ya tiene mesa!</h1>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#6B4F3A;">Te esperamos en Casa Olivar. Aquí están los detalles de tu reserva.</p>
        </td></tr>

        <!-- Detalles -->
        <tr><td style="padding:20px 32px 8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;border:1px solid #EDE6DC;border-radius:14px;padding:6px 18px;">
            ${reservationRows(r)}
          </table>
        </td></tr>

        <!-- Nota -->
        <tr><td style="padding:8px 32px 28px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBE7D6;border:1px solid #E8B07F;border-radius:12px;">
            <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.5;color:#7A2E14;">
              Si necesitas cambiar o cancelar tu reserva, responde a este correo o comunícate con el restaurante. ¡Gracias por elegirnos!
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 32px;border-top:1px solid #EDE6DC;background:#1F1F1F;text-align:center;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;letter-spacing:3px;color:#E67E22;">EMBER</div>
          <div style="margin-top:4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#A89D8E;">RESTAURANT OPERATING SYSTEM</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function reservationEmailText(r: ReservationEmailData): string {
  const firstName = r.customerName.trim().split(/\s+/)[0] || r.customerName;
  const lines = [
    `EMBER · Casa Olivar`,
    ``,
    `¡Lista, ${firstName} ya tiene mesa!`,
    `Tu reserva está confirmada.`,
    ``,
    `Fecha: ${formatDateLong(r.date)}`,
    `Hora: ${r.timeSlot}`,
    `Comensales: ${r.partySize}`,
    `Mesa: ${r.zoneName} · Mesa ${r.tableLabel}`,
  ];
  if (r.mesero) lines.push(`Mesero a cargo: ${r.mesero}`);
  if (r.occasion) lines.push(`Ocasión: ${r.occasion}`);
  if (r.restrictions.length > 0)
    lines.push(`Restricciones: ${r.restrictions.join(", ")}`);
  return lines.join("\n");
}

/** Envía el correo de confirmación al cliente. No lanza: registra y sigue. */
export async function sendReservationConfirmation(
  r: ReservationEmailData,
): Promise<void> {
  if (!r.customerEmail) return; // el cliente no dejó correo
  const transporter = getTransport();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: r.customerEmail,
      subject: "Tu reserva en Casa Olivar está confirmada · EMBER",
      text: reservationEmailText(r),
      html: reservationEmailHtml(r),
    });
    console.log(`[mailer] confirmación de reserva enviada a ${r.customerEmail}`);
  } catch (e) {
    console.error("[mailer] no se pudo enviar la confirmación:", e);
  }
}
