const nodeMailer = require('nodemailer')

exports.transporter = nodeMailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }


})

exports.generateOtpEmail = (userName, otpCode, expiryTime, appName, supportEmail) => {
    // HTML version
    const html = `
     <p>Hi ${userName},</p>
    <p>Your One-Time Password (OTP) for <strong>${appName}</strong> is:</p>
    <h2 style="color: #007bff;">${otpCode}</h2>
    <p>Valid for <strong>${expiryTime}</strong>. Do not share it.</p>
    <p>If you didn’t request this, contact <a href="mailto:support@${appName}.com">support</a>.</p>
  `;

    // Plain text version (for email clients that don't render HTML)
    const text = `
    Hi ${userName},
    \nYour OTP for ${appName} is ${otpCode} (expires in ${expiryTime}).
  `;

    return { html, text };
};

exports.generateWelcomeEmail = (userName, expiryTime, appName, supportEmail) => {
    // HTML version
    const html = `
     <p>Hi ${userName},</p>
    <p>Your One-Time Password (OTP) for <strong>${appName}</strong> is:</p>
    <h2 style="color: #007bff;">${otpCode}</h2>
    <p>Valid for <strong>${expiryTime}</strong>. Do not share it.</p>
    <p>If you didn’t request this, contact <a href="mailto:support@${appName}.com">support</a>.</p>
  `;

    // Plain text version (for email clients that don't render HTML)
    const text = `
    Hi ${userName},
    \nYour OTP for ${appName} is ${otpCode} (expires in ${expiryTime}).
  `;

    return { html, text };
};

exports.generateResetEmail = (userName, resetLink, expiryTime, appName, supportEmail) => {
    // HTML version
    const html = `
    <p>Hi ${userName},</p>
    <p>We received a request to reset your password for your <strong>${appName}</strong> account. Click below to proceed:</p>
    <a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    <p><small>Or paste this link into your browser:<br><code>${resetLink}</code></small></p>
    <p><strong>⚠️ This link expires in ${expiryTime}.</strong> If you didn’t request this, please <a href="mailto:${supportEmail}">contact support</a>.</p>
    <p>Thanks,<br>The ${appName} Team</p>
  `;

    // Plain text version (for email clients that don't render HTML)
    const text = `
    Hi ${userName},
    We received a request to reset your password for your ${appName} account. 
    To proceed, click this link (or copy-paste into your browser):
    ${resetLink}
    ⚠️ This link expires in ${expiryTime}.
    If you didn’t request this, contact support at ${supportEmail}.
    Thanks,
    The ${appName} Team
  `;

    return { html, text };
};


