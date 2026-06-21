"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationEmail = sendApplicationEmail;
exports.sendTenantAutoReply = sendTenantAutoReply;
const resend_1 = require("resend");
const FROM = 'EMLAKIE Notifications <notifications@emlakie.com>';
async function sendApplicationEmail(data) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[email] RESEND_API_KEY not set — skipping landlord email');
        return;
    }
    const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    const listingUrl = `https://emlakie.com/rentals/${data.listingId}`;
    const formattedIncome = `$${data.income.toLocaleString()}`;
    const formattedPrice = `$${data.listingPrice.toLocaleString()}`;
    const scoreBar = data.aiScore != null ? `
    <tr>
      <td style="padding: 0 32px 28px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.05em;">AI Match Score</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="flex:1;background:#dcfce7;border-radius:99px;height:8px;">
              <div style="width:${data.aiScore}%;background:#16a34a;border-radius:99px;height:8px;"></div>
            </div>
            <span style="font-size:20px;font-weight:900;color:#15803d;">${data.aiScore}/100</span>
          </div>
          ${data.aiSummary ? `<p style="margin:10px 0 0;font-size:13px;color:#166534;line-height:1.5;">${data.aiSummary}</p>` : ''}
        </div>
      </td>
    </tr>` : '';
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Application</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px 24px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px;">EMLAKIE</p>
            <p style="margin:6px 0 0;font-size:13px;color:#bbf7d0;font-weight:500;">New Rental Inquiry</p>
          </td>
        </tr>

        <!-- Body card -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:0 0 8px;">

            <!-- Intro -->
            <tr>
              <td style="padding:28px 32px 20px;">
                <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
                  Hi <strong>${data.landlordName}</strong>,<br>
                  You have a new rental inquiry for:
                </p>
                <a href="${listingUrl}" style="display:block;margin-top:12px;padding:14px 18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;text-decoration:none;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#16a34a;">${data.listingTitle}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${data.listingAddress}, ${data.listingCity}, ${data.listingState} &nbsp;·&nbsp; ${formattedPrice}/mo</p>
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr><td style="padding:0 32px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

            <!-- Tenant info -->
            <tr>
              <td style="padding:24px 32px 20px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;">Applicant</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:44px;vertical-align:top;">
                      <div style="width:44px;height:44px;border-radius:22px;background:#dcfce7;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#16a34a;text-align:center;line-height:44px;">
                        ${data.tenantName.charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <p style="margin:0;font-size:17px;font-weight:800;color:#111827;">${data.tenantName}</p>
                      <p style="margin:3px 0 0;font-size:13px;color:#6b7280;">${data.tenantPhone}</p>
                      ${data.tenantEmail ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${data.tenantEmail}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Stats grid -->
            <tr>
              <td style="padding:0 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse:separate;border-spacing:8px;">
                  <tr>
                    <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;width:50%;">
                      <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Monthly Income</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#111827;">${formattedIncome}</p>
                    </td>
                    <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;width:50%;">
                      <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Income-to-Rent Ratio</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#111827;">${(data.income / data.listingPrice).toFixed(1)}×</p>
                    </td>
                  </tr>
                  ${data.creditScore ? `<tr>
                    <td colspan="2" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
                      <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Credit Score</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#111827;">${data.creditScore}</p>
                    </td>
                  </tr>` : ''}
                  ${data.moveIn ? `<tr>
                    <td colspan="2" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
                      <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Desired Move-in</p>
                      <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827;">${data.moveIn}</p>
                    </td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>

            <!-- AI score -->
            ${scoreBar}

            <!-- Message -->
            <tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;">Message from Applicant</p>
                <div style="background:#f9fafb;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;padding:14px 16px;">
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.65;">${data.message.replace(/\n/g, '<br>')}</p>
                </div>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:0 32px 32px;text-align:center;">
                <a href="${listingUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
                  View Application in App
                </a>
                <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;">
                  Reply directly to this email to contact ${data.tenantName}
                </p>
              </td>
            </tr>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              EMLAKIE · <a href="https://emlakie.com" style="color:#16a34a;text-decoration:none;">emlakie.com</a>
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">You received this because you have a listing on EMLAKIE.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
    try {
        await resend.emails.send({
            from: FROM,
            to: data.landlordEmail,
            replyTo: data.tenantPhone ? undefined : undefined,
            subject: `New Inquiry: ${data.tenantName} is interested in ${data.listingTitle}`,
            html,
        });
    }
    catch (err) {
        console.error('[email] Failed to send landlord notification:', err);
    }
}
async function sendTenantAutoReply(data) {
    if (!process.env.RESEND_API_KEY)
        return;
    const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    const listingUrl = `https://emlakie.com/rentals/${data.listingId}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your inquiry was received</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr>
          <td style="background:#16a34a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#fff;">EMLAKIE</p>
            <p style="margin:4px 0 0;font-size:13px;color:#bbf7d0;">Your inquiry was received</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 16px 16px;padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi <strong>${data.tenantName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${data.aiMessage}</p>
            <a href="${listingUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;margin-bottom:24px;">
              View Listing
            </a>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">${data.listingTitle}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${data.listingAddress}, ${data.listingCity}, ${data.listingState} · $${data.listingPrice.toLocaleString()}/mo</p>
            </div>
            <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
              This is an automated message from EMLAKIE. The landlord will follow up with you directly.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">EMLAKIE · <a href="https://emlakie.com" style="color:#16a34a;text-decoration:none;">emlakie.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    try {
        await resend.emails.send({
            from: 'EMLAKIE <notifications@emlakie.com>',
            to: data.tenantEmail,
            subject: `Your inquiry for "${data.listingTitle}" was received`,
            html,
        });
    }
    catch (err) {
        console.error('[email] Failed to send tenant auto-reply:', err);
    }
}
