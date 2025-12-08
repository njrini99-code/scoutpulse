// Base Email Template
// Mobile-responsive HTML email template with ScoutPulse branding
// ═══════════════════════════════════════════════════════════════════════════

interface BaseTemplateOptions {
  title: string;
  content: string;
  footerText?: string;
}

export function baseEmailTemplate({ title, content, footerText }: BaseTemplateOptions): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 20px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px 12px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                border-radius: 16px; display: inline-block; margin-bottom: 15px; 
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      <div style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 64px; text-align: center;">
                        SP
                      </div>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">
                      ScoutPulse
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0 0;">
                      Modern Baseball Recruiting
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background: #1e293b; border-radius: 0 0 12px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${content}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                ${footerText || 'This email was sent by ScoutPulse. If you have any questions, please contact our support team.'}
              </p>
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}" 
                   style="color: #10b981; text-decoration: none; margin: 0 10px;">Visit ScoutPulse</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}/support" 
                   style="color: #10b981; text-decoration: none; margin: 0 10px;">Support</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}/settings" 
                   style="color: #10b981; text-decoration: none; margin: 0 10px;">Settings</a>
              </p>
              <p style="color: #475569; font-size: 11px; line-height: 1.6; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ScoutPulse. All rights reserved.<br>
                You're receiving this email because you signed up for ScoutPulse.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
