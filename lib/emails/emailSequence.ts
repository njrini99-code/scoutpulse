// Email Sequence Management
// Handles sending follow-up emails (Welcome, Week 1 Tips, Success Stories)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import {
  getWelcomeEmail,
  getWeek1TipsEmail,
  getSuccessStoriesEmail,
} from './templates';

interface EmailSequenceData {
  userId: string;
  email: string;
  userName?: string;
  userRole?: 'player' | 'coach';
}

// Send welcome email after verification
export async function sendWelcomeEmail(data: EmailSequenceData): Promise<boolean> {
  try {
    const { email, userName, userRole } = data;
    const { subject, html } = getWelcomeEmail({ userName, userRole });

    // In production, use your email service (Resend, SendGrid, etc.)
    // For now, we'll log it
    console.log('[Email] Sending welcome email to:', email);
    console.log('[Email] Subject:', subject);
    
    // TODO: Integrate with email service
    // await sendEmailViaService({ to: email, subject, html });

    // Mark as sent in database
    const supabase = await createClient();
    await supabase
      .from('email_sequence')
      .insert({
        user_id: data.userId,
        email_type: 'welcome',
        sent_at: new Date().toISOString(),
      });

    return true;
  } catch (error) {
    console.error('[Email] Welcome email error:', error);
    return false;
  }
}

// Schedule Week 1 tips email (7 days after signup)
export async function scheduleWeek1TipsEmail(data: EmailSequenceData): Promise<boolean> {
  try {
    const { email, userName, userRole } = data;
    const sendDate = new Date();
    sendDate.setDate(sendDate.getDate() + 7); // 7 days from now

    // Store in database for scheduled sending
    const supabase = await createClient();
    await supabase
      .from('email_sequence')
      .insert({
        user_id: data.userId,
        email_type: 'week1_tips',
        scheduled_for: sendDate.toISOString(),
        email_data: { userName, userRole },
      });

    console.log('[Email] Week 1 tips email scheduled for:', sendDate);
    return true;
  } catch (error) {
    console.error('[Email] Schedule Week 1 tips error:', error);
    return false;
  }
}

// Send Week 1 tips email
export async function sendWeek1TipsEmail(data: EmailSequenceData): Promise<boolean> {
  try {
    const { email, userName, userRole } = data;
    const { subject, html } = getWeek1TipsEmail({ userName, userRole });

    console.log('[Email] Sending Week 1 tips email to:', email);
    
    // TODO: Integrate with email service
    // await sendEmailViaService({ to: email, subject, html });

    // Mark as sent
    const supabase = await createClient();
    await supabase
      .from('email_sequence')
      .update({ sent_at: new Date().toISOString() })
      .eq('user_id', data.userId)
      .eq('email_type', 'week1_tips');

    return true;
  } catch (error) {
    console.error('[Email] Week 1 tips email error:', error);
    return false;
  }
}

// Schedule Success Stories email (14 days after signup)
export async function scheduleSuccessStoriesEmail(data: EmailSequenceData): Promise<boolean> {
  try {
    const { email, userName, userRole } = data;
    const sendDate = new Date();
    sendDate.setDate(sendDate.getDate() + 14); // 14 days from now

    const supabase = await createClient();
    await supabase
      .from('email_sequence')
      .insert({
        user_id: data.userId,
        email_type: 'success_stories',
        scheduled_for: sendDate.toISOString(),
        email_data: { userName, userRole },
      });

    console.log('[Email] Success stories email scheduled for:', sendDate);
    return true;
  } catch (error) {
    console.error('[Email] Schedule success stories error:', error);
    return false;
  }
}

// Send Success Stories email
export async function sendSuccessStoriesEmail(data: EmailSequenceData): Promise<boolean> {
  try {
    const { email, userName, userRole } = data;
    const { subject, html } = getSuccessStoriesEmail({ userName, userRole });

    console.log('[Email] Sending success stories email to:', email);
    
    // TODO: Integrate with email service
    // await sendEmailViaService({ to: email, subject, html });

    // Mark as sent
    const supabase = await createClient();
    await supabase
      .from('email_sequence')
      .update({ sent_at: new Date().toISOString() })
      .eq('user_id', data.userId)
      .eq('email_type', 'success_stories');

    return true;
  } catch (error) {
    console.error('[Email] Success stories email error:', error);
    return false;
  }
}

// Initialize email sequence for new user
export async function initializeEmailSequence(data: EmailSequenceData): Promise<void> {
  // Send welcome email immediately
  await sendWelcomeEmail(data);

  // Schedule follow-up emails
  await scheduleWeek1TipsEmail(data);
  await scheduleSuccessStoriesEmail(data);
}

// Process scheduled emails (run via cron job or scheduled function)
export async function processScheduledEmails(): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Get emails scheduled for now or earlier that haven't been sent
  const { data: scheduledEmails, error } = await supabase
    .from('email_sequence')
    .select('*')
    .is('sent_at', null)
    .lte('scheduled_for', now);

  if (error) {
    console.error('[Email] Error fetching scheduled emails:', error);
    return;
  }

  if (!scheduledEmails || scheduledEmails.length === 0) {
    return;
  }

  // Process each scheduled email
  for (const emailRecord of scheduledEmails) {
    const { user_id, email_type, email_data } = emailRecord;

    // Get user info
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', user_id)
      .single();

    if (!user) continue;

    const emailData: EmailSequenceData = {
      userId: user_id,
      email: user.email,
      userName: email_data?.userName || user.full_name,
      userRole: email_data?.userRole || user.role,
    };

    // Send appropriate email
    switch (email_type) {
      case 'week1_tips':
        await sendWeek1TipsEmail(emailData);
        break;
      case 'success_stories':
        await sendSuccessStoriesEmail(emailData);
        break;
    }
  }
}
