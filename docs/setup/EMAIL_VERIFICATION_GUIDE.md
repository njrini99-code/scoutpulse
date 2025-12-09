# Email Verification & Follow-up Sequence Guide

This document describes the email verification system and follow-up email sequence implemented in ScoutPulse.

## Features

### 1. Email Verification Page
- **Location**: `/app/auth/verify-email/page.tsx`
- **Features**:
  - Beautiful ScoutPulse-branded design
  - Clear "Verify Email" button
  - Backup verification link display
  - Instructions for finding email in spam
  - Resend verification email functionality
  - Multiple states: pending, verifying, verified, error
  - Mobile-responsive design

### 2. Email Templates
All email templates are mobile-responsive and use ScoutPulse branding:

#### Verification Email
- **Template**: `getVerificationEmail()` in `/lib/emails/templates.ts`
- **Features**:
  - Prominent "Verify Email Address" button
  - Backup verification link
  - Spam folder instructions
  - 24-hour expiration notice

#### Welcome Email
- **Template**: `getWelcomeEmail()` in `/lib/emails/templates.ts`
- **Sent**: Immediately after email verification
- **Features**:
  - Personalized greeting
  - Next steps based on user role (player/coach)
  - Dashboard CTA button
  - Support link

#### Week 1 Tips Email
- **Template**: `getWeek1TipsEmail()` in `/lib/emails/templates.ts`
- **Sent**: 7 days after signup
- **Features**:
  - Role-specific tips (player vs coach)
  - Actionable advice
  - Profile completion CTA

#### Success Stories Email
- **Template**: `getSuccessStoriesEmail()` in `/lib/emails/templates.ts`
- **Sent**: 14 days after signup
- **Features**:
  - Real success stories
  - Role-specific testimonials
  - Motivation to continue using platform

### 3. Base Email Template
- **Location**: `/lib/emails/baseTemplate.ts`
- **Features**:
  - Mobile-responsive HTML structure
  - ScoutPulse branding (logo, colors)
  - Dark theme matching app design
  - Footer with links and unsubscribe info
  - Outlook compatibility

### 4. Email Sequence Management
- **Location**: `/lib/emails/emailSequence.ts`
- **Features**:
  - Automatic welcome email after verification
  - Scheduled Week 1 tips (7 days)
  - Scheduled Success Stories (14 days)
  - Database tracking of sent emails
  - Process scheduled emails function

### 5. API Routes
- **Resend Verification**: `/app/api/auth/resend-verification/route.ts`
  - POST endpoint to resend verification emails
  - Validates email address
  - Uses Supabase auth resend

## Database Setup

Run the migration to create the `email_sequence` table:

```sql
-- See: supabase/migrations/create_email_sequence_table.sql
```

The table tracks:
- User ID
- Email type (welcome, week1_tips, success_stories)
- Scheduled send date
- Actual send date
- Email data (userName, userRole, etc.)

## Usage

### Sending Verification Email
Supabase automatically sends verification emails on signup. The email uses the template from `getVerificationEmail()`.

### Resending Verification Email
```typescript
// From the verification page
const response = await fetch('/api/auth/resend-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' }),
});
```

### Initializing Email Sequence
```typescript
import { initializeEmailSequence } from '@/lib/emails/emailSequence';

await initializeEmailSequence({
  userId: user.id,
  email: user.email,
  userName: user.full_name,
  userRole: user.role,
});
```

### Processing Scheduled Emails
Set up a cron job or scheduled function to run:
```typescript
import { processScheduledEmails } from '@/lib/emails/emailSequence';

// Run daily
await processScheduledEmails();
```

## Email Service Integration

Currently, email templates are generated but not sent. To send emails:

1. **Choose an email service** (Resend, SendGrid, AWS SES, etc.)
2. **Create a send function** in `/lib/emails/sendEmail.ts`:
```typescript
export async function sendEmailViaService({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  // Integrate with your email service
  // Example with Resend:
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ScoutPulse <notifications@scoutpulse.app>',
      to,
      subject,
      html,
    }),
  });
  
  return response.ok;
}
```

3. **Update email sequence functions** to call `sendEmailViaService()`

## Customization

### Modify Email Templates
Edit templates in `/lib/emails/templates.ts`:
- Change colors, fonts, spacing
- Add/remove sections
- Customize content based on user role

### Change Email Timing
Edit `/lib/emails/emailSequence.ts`:
- Week 1 tips: Change `sendDate.setDate(sendDate.getDate() + 7)`
- Success Stories: Change `sendDate.setDate(sendDate.getDate() + 14)`

### Add New Email Types
1. Create template function in `templates.ts`
2. Add to `email_type` CHECK constraint in migration
3. Add send function in `emailSequence.ts`
4. Schedule in `initializeEmailSequence()`

## Testing

### Test Verification Email
1. Sign up with a test email
2. Check inbox for verification email
3. Click verification link
4. Verify redirect to dashboard

### Test Resend
1. Go to `/auth/verify-email`
2. Click "Resend Verification Email"
3. Check inbox for new email

### Test Email Templates
```typescript
import { getVerificationEmail } from '@/lib/emails/templates';

const { subject, html } = getVerificationEmail({
  userName: 'Test User',
  verificationLink: 'https://example.com/verify?token=abc123',
});

// Save HTML to file to preview
console.log(html);
```

## Mobile Responsiveness

All email templates are mobile-responsive:
- Max width: 600px
- Responsive padding and spacing
- Touch-friendly button sizes (min 44x44px)
- Readable font sizes (16px+)
- Stacked layout on mobile

## Branding

Email templates use ScoutPulse branding:
- **Colors**: Emerald green (#10b981) gradient
- **Logo**: "SP" in rounded square
- **Font**: System font stack
- **Theme**: Dark (matches app)

## Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://scoutpulse.app
RESEND_API_KEY=your_resend_api_key  # If using Resend
```

## Next Steps

1. Set up email service (Resend, SendGrid, etc.)
2. Integrate `sendEmailViaService()` function
3. Set up cron job for `processScheduledEmails()`
4. Test all email templates
5. Monitor email delivery rates
6. A/B test email content
