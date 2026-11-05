const nodemailer = require('nodemailer');

// Target recipient requested by the user
const DEFAULT_RECIPIENT = process.env.DEFAULT_EMAIL_RECIPIENT || 'sibineshwarans@gmail.com';

/**
 * Creates and returns an active nodemailer transporter.
 * If SMTP_USER & SMTP_PASS are configured in .env (e.g., Gmail App Password),
 * it routes through live SMTP. Otherwise, it initializes an Ethereal test inbox.
 */
let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    // Live SMTP configured (e.g., Gmail with App Password)
    console.log(`[EmailService] Using Live SMTP with sender: ${smtpUser}`);
    cachedTransporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    return cachedTransporter;
  }

  // Fallback: Generate real Ethereal SMTP test account
  try {
    const testAccountPromise = nodemailer.createTestAccount();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal setup timed out')), 2500));
    const testAccount = await Promise.race([testAccountPromise, timeoutPromise]);
    console.log(`[EmailService] Ethereal test SMTP account created: ${testAccount.user}`);
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not connect to Ethereal, using mock transport:', err.message);
    return null;
  }
}

/**
 * Generates the Official Judicial Summons HTML template
 */
function generateSummonsHtml({
  fromEmail = 'court.registry.salem@tn.gov.in',
  recipientEmail = '',
  summonsNumber,
  caseNumber,
  caseTitle,
  witnessName,
  witnessDesignation,
  stationOrHospital,
  scheduledDate,
  mode = 'Virtual VC',
  vcLink,
  notes = ''
}) {
  const targetEmail = recipientEmail || 'deponent@court.gov.in';

  const formattedDate = new Date(scheduledDate).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Official Court Summons - ${summonsNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; color: #ffffff; padding: 28px 24px; text-align: center; }
        .badge { display: inline-block; background: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px; }
        .title { font-size: 22px; font-weight: 800; margin: 0 0 6px 0; }
        .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
        .content { padding: 28px 24px; }
        .notice-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 8px; font-size: 14px; color: #1e40af; margin-bottom: 24px; line-height: 1.5; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .details-table td { padding: 10px 12px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; }
        .details-table td.label { font-weight: 600; color: #64748b; width: 38%; }
        .details-table td.val { font-weight: 700; color: #0f172a; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn-vc { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .footer { background: #f8fafc; padding: 20px 24px; font-size: 11.5px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        .qr-ref { font-family: monospace; font-size: 12px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; color: #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">Official e-Summons & VC Notice</div>
          <h1 class="title">TAMIL NADU DISTRICT & SESSIONS COURT</h1>
          <p class="subtitle">Interoperable Criminal Justice System (ICJS) • e-Courts Mission Mode</p>
        </div>

        <div class="content">
          <div class="notice-box">
            <strong>OFFICIAL COURT SUMMONS UNDER SEC. 61 / 62 CrPC:</strong><br/>
            You are hereby formally summoned to appear and give evidence / produce records in the matter cited below.
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Summons Reference:</td>
              <td class="val"><span class="qr-ref">${summonsNumber}</span></td>
            </tr>
            <tr>
              <td class="label">Case Docket:</td>
              <td class="val">${caseNumber}</td>
            </tr>
            <tr>
              <td class="label">Case Title:</td>
              <td class="val">${caseTitle}</td>
            </tr>
            <tr>
              <td class="label">Summoned Witness:</td>
              <td class="val">${witnessName} (${witnessDesignation})</td>
            </tr>
            <tr>
              <td class="label">Department / Station:</td>
              <td class="val">${stationOrHospital || 'Govt Department'}</td>
            </tr>
            <tr>
              <td class="label">Hearing Schedule:</td>
              <td class="val" style="color: #dc2626;">${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Mode of Appearance:</td>
              <td class="val">${mode}</td>
            </tr>
            ${notes ? `<tr><td class="label">Specific Directions:</td><td class="val">${notes}</td></tr>` : ''}
          </table>

          <div class="btn-container">
            <a href="${vcLink}" class="btn-vc" target="_blank">
              🎥 Enter Virtual Courtroom (VC Session)
            </a>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
              Direct video conference joining link. No extra app download required.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>
            This is an authenticated legal communication issued through the AI-Powered Judicial Portal.<br/>
            Delivered directly to designated recipient: <strong>${targetEmail}</strong><br/>
            Tamil Nadu State Judicial Academy & e-Committee, Supreme Court of India.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send an Official Judicial Summons email
 */
async function sendSummonsEmail(options) {
  const targetEmail = options.recipientEmail || options.toEmail || 'deponent@court.gov.in';
  const senderEmail = options.fromEmail || process.env.SMTP_USER || 'court.registry.salem@tn.gov.in';
  const subject = `⚖️ [LEGAL SUMMONS] Case ${options.caseNumber} - Appearance on ${new Date(options.scheduledDate).toLocaleDateString('en-IN')}`;
  const htmlContent = generateSummonsHtml({ ...options, recipientEmail: targetEmail, fromEmail: senderEmail });

  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[EmailService] Simulated dispatch from ${senderEmail} to ${targetEmail} (Subject: ${subject})`);
      return { success: true, simulated: true, recipient: targetEmail, sender: senderEmail };
    }

    const mailFrom = process.env.SMTP_USER
      ? `"District Court Registry (ICJS)" <${process.env.SMTP_USER}>`
      : `"District Court Registry" <${senderEmail}>`;

    const mailOptions = {
      from: mailFrom,
      to: targetEmail,
      replyTo: senderEmail,
      subject: subject,
      html: htmlContent
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP send timed out')), 3000));
    const info = await Promise.race([sendPromise, timeoutPromise]);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`\n================= [EMAIL SUMMONS DISPATCHED] =================`);
    console.log(`To:          ${targetEmail}`);
    console.log(`Subject:     ${subject}`);
    console.log(`MessageId:   ${info.messageId}`);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    }
    console.log(`==============================================================\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
      recipient: targetEmail
    };
  } catch (err) {
    console.error('[EmailService] Failed to send summons email:', err.message);
    return {
      success: false,
      error: err.message,
      recipient: targetEmail
    };
  }
}

module.exports = {
  sendSummonsEmail,
  generateSummonsHtml,
  DEFAULT_RECIPIENT
};

