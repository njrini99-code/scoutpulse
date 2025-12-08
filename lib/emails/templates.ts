// Email Templates for ScoutPulse
// All templates are mobile-responsive and use ScoutPulse branding
// ═══════════════════════════════════════════════════════════════════════════

import { baseEmailTemplate } from './baseTemplate';

export interface EmailTemplateData {
  userName?: string;
  verificationLink?: string;
  email?: string;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export function getVerificationEmail(data: EmailTemplateData): { subject: string; html: string } {
  const { userName = 'there', verificationLink = '#' } = data;

  const html = baseEmailTemplate({
    title: 'Verify Your Email Address',
    content: `
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
            Welcome to ScoutPulse! 🎉
          </h1>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ${userName},
          </p>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Thanks for signing up! Please verify your email address to get started with ScoutPulse.
          </p>
          
          <!-- Verify Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center">
                <a href="${verificationLink}" 
                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                          min-width: 200px; text-align: center;">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>

          <!-- Backup Link -->
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #10b981; font-size: 12px; word-break: break-all; margin: 10px 0 30px 0;">
            ${verificationLink}
          </p>

          <!-- Spam Instructions -->
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); 
                      border-radius: 12px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">
              📧 Can't find this email?
            </p>
            <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Check your spam or junk folder</li>
              <li>Look for emails from "ScoutPulse"</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </td>
      </tr>
    `,
  });

  return {
    subject: 'Verify Your ScoutPulse Email Address',
    html,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export function getWelcomeEmail(data: EmailTemplateData): { subject: string; html: string } {
  const { userName = 'there', userRole = 'player' } = data;
  const isPlayer = userRole === 'player';
  const dashboardLink = isPlayer ? '/player' : '/coach';

  const html = baseEmailTemplate({
    title: 'Welcome to ScoutPulse!',
    content: `
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
            Welcome to ScoutPulse! 🎉
          </h1>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ${userName},
          </p>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Your email has been verified! You're all set to start using ScoutPulse.
          </p>

          <!-- Next Steps -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); 
                      border-radius: 12px; padding: 30px; margin: 30px 0; text-align: left;">
            <h2 style="color: #10b981; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
              🚀 Next Steps
            </h2>
            ${isPlayer ? `
              <ol style="color: #94a3b8; font-size: 16px; line-height: 2; margin: 0; padding-left: 20px;">
                <li>Complete your player profile with stats and highlights</li>
                <li>Upload your best game footage and photos</li>
                <li>Connect with coaches and start building relationships</li>
                <li>Track your recruiting journey and milestones</li>
              </ol>
            ` : `
              <ol style="color: #94a3b8; font-size: 16px; line-height: 2; margin: 0; padding-left: 20px;">
                <li>Set up your program profile and preferences</li>
                <li>Start discovering talented players</li>
                <li>Build your watchlist and track prospects</li>
                <li>Connect with players and their families</li>
              </ol>
            `}
          </div>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}${dashboardLink}" 
                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                          min-width: 200px; text-align: center;">
                  Go to Dashboard
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            Need help getting started? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}/support" 
            style="color: #10b981; text-decoration: none;">Visit our support center</a>.
          </p>
        </td>
      </tr>
    `,
  });

  return {
    subject: 'Welcome to ScoutPulse! 🎉',
    html,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEK 1 TIPS EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export function getWeek1TipsEmail(data: EmailTemplateData): { subject: string; html: string } {
  const { userName = 'there', userRole = 'player' } = data;
  const isPlayer = userRole === 'player';

  const html = baseEmailTemplate({
    title: 'Your First Week on ScoutPulse',
    content: `
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
            Week 1 Tips 📚
          </h1>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ${userName},
          </p>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            You've been on ScoutPulse for a week! Here are some tips to help you get the most out of the platform:
          </p>

          <!-- Tips -->
          <div style="text-align: left; margin: 30px 0;">
            ${isPlayer ? `
              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  💡 Tip #1: Complete Your Profile
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  Players with complete profiles get 3x more views from coaches. Add your stats, achievements, and academic info.
                </p>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  🎥 Tip #2: Upload Quality Video
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  Coaches watch videos first. Upload your best game highlights and make sure they're well-lit and clear.
                </p>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  📧 Tip #3: Respond to Messages
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  When coaches reach out, respond within 24 hours. Quick responses show professionalism and interest.
                </p>
              </div>
            ` : `
              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  🔍 Tip #1: Use Advanced Filters
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  Filter players by position, location, grad year, and stats to find exactly what you're looking for.
                </p>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  ⭐ Tip #2: Build Your Watchlist
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  Save promising players to your watchlist to track their progress and get notified of updates.
                </p>
              </div>

              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; 
                          border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                  💬 Tip #3: Personalize Your Messages
                </h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                  Use our message templates but personalize them. Players appreciate coaches who show genuine interest.
                </p>
              </div>
            `}
          </div>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}/${isPlayer ? 'player' : 'coach'}" 
                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                          min-width: 200px; text-align: center;">
                  Continue Building Your Profile
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `,
  });

  return {
    subject: 'Week 1 Tips: Get the Most Out of ScoutPulse',
    html,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS STORIES EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export function getSuccessStoriesEmail(data: EmailTemplateData): { subject: string; html: string } {
  const { userName = 'there', userRole = 'player' } = data;
  const isPlayer = userRole === 'player';

  const html = baseEmailTemplate({
    title: 'Success Stories from ScoutPulse',
    content: `
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
            Real Success Stories 🌟
          </h1>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ${userName},
          </p>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Here are some inspiring stories from players and coaches who found success on ScoutPulse:
          </p>

          <!-- Success Story 1 -->
          <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: left;">
            <div style="color: #10b981; font-size: 48px; margin: 0 0 15px 0;">"</div>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0; font-style: italic;">
              ${isPlayer ? 
                'I was discovered by a Division I coach through ScoutPulse. After uploading my highlights and completing my profile, I received messages from 5 different programs. Now I\'m committed to my dream school!' :
                'ScoutPulse helped me find three incredible players for my program. The video analysis tools and player profiles made it easy to evaluate talent. All three are now key contributors to our team.'
              }
            </p>
            <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0;">
              ${isPlayer ? '— Jake M., Class of 2024' : '— Coach Sarah T., State University'}
            </p>
          </div>

          <!-- Success Story 2 -->
          <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: left;">
            <div style="color: #10b981; font-size: 48px; margin: 0 0 15px 0;">"</div>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0; font-style: italic;">
              ${isPlayer ?
                'The platform made it so easy to showcase my skills. I connected with coaches from JUCO programs and found the perfect fit for my academic and athletic goals.' :
                'As a high school coach, I use ScoutPulse to help my players get noticed. Three of my seniors received scholarship offers after I helped them create standout profiles.'
              }
            </p>
            <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0;">
              ${isPlayer ? '— Marcus R., JUCO Transfer' : '— Coach Mike D., High School'}
            </p>
          </div>

          <!-- CTA -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); 
                      border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #10b981; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
              Your Success Story Starts Here
            </h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${isPlayer ? 
                'Keep building your profile and engaging with coaches. Your opportunity is coming!' :
                'Keep discovering talent and building relationships. The next star player is waiting to be found!'
              }
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'}/${isPlayer ? 'player' : 'coach'}" 
                     style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                            min-width: 200px; text-align: center;">
                    Continue Your Journey
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    `,
  });

  return {
    subject: '🌟 Success Stories from ScoutPulse',
    html,
  };
}
