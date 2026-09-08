import { APP_NAME, CITY, HOST_EMAIL, appUrl } from "./constants";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type Fact = { label: string; value: string };

export type Mail = {
  to: string | string[];
  subject: string;
  /** Short line shown in the inbox preview. */
  preheader?: string;
  heading: string;
  intro?: string;
  facts?: Fact[];
  paragraphs?: string[];
  cta?: { label: string; url: string };
  tone?: "neutral" | "good" | "warn";
  replyTo?: string;
};

const PALETTE = {
  paper: "#f6f1e7",
  card: "#fffdf8",
  ink: "#16130f",
  muted: "#6f675c",
  rule: "#e2dbcc",
  orange: "#c4472b",
  bay: "#1f4039",
  sun: "#b07d18",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function accentFor(tone: Mail["tone"]): string {
  return tone === "good"
    ? PALETTE.bay
    : tone === "warn"
      ? PALETTE.orange
      : PALETTE.ink;
}

function renderHtml(mail: Mail): string {
  const accent = accentFor(mail.tone);
  const serif = "Iowan Old Style, Palatino, Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

  const facts = (mail.facts ?? [])
    .map(
      (f) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid ${PALETTE.rule};font:400 12px/1.4 ${sans};letter-spacing:.08em;text-transform:uppercase;color:${PALETTE.muted};width:38%;vertical-align:top;">${esc(f.label)}</td>
          <td style="padding:9px 0;border-bottom:1px solid ${PALETTE.rule};font:400 15px/1.5 ${sans};color:${PALETTE.ink};vertical-align:top;">${esc(f.value).replace(/\n/g, "<br>")}</td>
        </tr>`,
    )
    .join("");

  const paragraphs = (mail.paragraphs ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font:400 15px/1.65 ${sans};color:${PALETTE.ink};">${esc(p)}</p>`,
    )
    .join("");

  const cta = mail.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
         <tr><td style="background:${PALETTE.orange};border-radius:2px;">
           <a href="${esc(mail.cta.url)}" style="display:inline-block;padding:13px 26px;font:600 14px/1 ${sans};letter-spacing:.03em;color:#fffdf8;text-decoration:none;">${esc(mail.cta.label)}</a>
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(mail.subject)}</title></head>
<body style="margin:0;padding:0;background:${PALETTE.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(mail.preheader ?? mail.intro ?? "")}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PALETTE.card};border:1px solid ${PALETTE.rule};">
        <tr><td style="padding:26px 32px 0;">
          <p style="margin:0;font:400 11px/1 ${sans};letter-spacing:.22em;text-transform:uppercase;color:${PALETTE.muted};">${esc(APP_NAME)} &nbsp;·&nbsp; ${esc(CITY)}</p>
        </td></tr>
        <tr><td style="padding:14px 32px 0;">
          <h1 style="margin:0 0 6px;font:400 30px/1.15 ${serif};color:${accent};letter-spacing:-.01em;">${esc(mail.heading)}</h1>
          ${mail.intro ? `<p style="margin:0 0 18px;font:400 16px/1.6 ${sans};color:${PALETTE.muted};">${esc(mail.intro)}</p>` : ""}
        </td></tr>
        ${facts ? `<tr><td style="padding:6px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${PALETTE.rule};">${facts}</table></td></tr>` : ""}
        ${paragraphs || cta ? `<tr><td style="padding:20px 32px 0;">${paragraphs}${cta}</td></tr>` : ""}
        <tr><td style="padding:26px 32px 26px;">
          <p style="margin:18px 0 0;padding-top:16px;border-top:1px solid ${PALETTE.rule};font:400 12px/1.6 ${sans};color:${PALETTE.muted};">
            You are receiving this because you have an account on ${esc(APP_NAME)}, the private booking page for visits to ${esc(CITY)}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(mail: Mail): string {
  const lines = [mail.heading.toUpperCase(), ""];
  if (mail.intro) lines.push(mail.intro, "");
  for (const f of mail.facts ?? []) lines.push(`${f.label}: ${f.value}`);
  if (mail.facts?.length) lines.push("");
  for (const p of mail.paragraphs ?? []) lines.push(p, "");
  if (mail.cta) lines.push(`${mail.cta.label}: ${mail.cta.url}`, "");
  return lines.join("\n");
}

/**
 * Fire-and-forget: a bounced notification must never undo the booking that
 * triggered it. Failures are logged and swallowed.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const configured = process.env.EMAIL_FROM?.trim();
  const from = configured || `${APP_NAME} <onboarding@resend.dev>`;
  const to = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(Boolean);
  if (!to.length) return false;

  if (!key) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped "${mail.subject}" to ${to.join(", ")}`,
    );
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: mail.subject,
        html: renderHtml(mail),
        text: renderText(mail),
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] resend rejected:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}

export function hostMail(mail: Omit<Mail, "to">) {
  return sendMail({ ...mail, to: HOST_EMAIL });
}

export const link = appUrl;
