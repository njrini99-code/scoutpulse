import { supabase } from '../lib/supabase';

export const kpiSync = {
  async syncFromLeads() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (!leads) return { synced: 0 };

      let synced = 0;

      for (const lead of leads) {
        if (lead.osv_completed === 'Yes' || lead.osv_completed === 'true') {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('event_type', 'osv_completed')
            .maybeSingle();

          if (!existing) {
            await supabase.from('activities').insert({
              user_id: user.id,
              lead_id: lead.id,
              business_name: lead.business_name,
              event_type: 'osv_completed',
              notes: 'Synced from leads table'
            });
            synced++;
          }
        }

        if (lead.np_set === 'Yes' || lead.np_set === 'true') {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('event_type', 'np_set')
            .maybeSingle();

          if (!existing) {
            await supabase.from('activities').insert({
              user_id: user.id,
              lead_id: lead.id,
              business_name: lead.business_name,
              event_type: 'np_set',
              notes: 'Synced from leads table'
            });
            synced++;
          }
        }

        if (lead.deal_stage === 'Closed Won' || lead.deal_stage === 'closed') {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('event_type', 'closed')
            .maybeSingle();

          if (!existing) {
            const dealValue = parseFloat(lead.deal_value) || 0;
            await supabase.from('activities').insert({
              user_id: user.id,
              lead_id: lead.id,
              business_name: lead.business_name,
              event_type: 'closed',
              revenue: dealValue,
              notes: 'Synced from leads table'
            });
            synced++;
          }
        }
      }

      const { data: followUps } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('user_id', user.id);

      if (followUps) {
        for (const followUp of followUps) {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('lead_id', followUp.lead_id)
            .eq('event_type', 'follow_up_created')
            .eq('created_at', followUp.created_at)
            .maybeSingle();

          if (!existing) {
            await supabase.from('activities').insert({
              user_id: user.id,
              lead_id: followUp.lead_id,
              business_name: followUp.business_name,
              event_type: 'follow_up_created',
              notes: followUp.notes || 'Follow-up scheduled'
            });
            synced++;
          }
        }
      }

      await supabase.rpc('refresh_kpi_stats');

      return { synced };
    } catch (error) {
      console.error('Error syncing KPIs:', error);
      throw error;
    }
  },

  async logActivity(
    leadId: string,
    businessName: string,
    eventType: 'osv_completed' | 'np_set' | 'closed' | 'email_sent' | 'follow_up_created' | 'phone_call' | 'meeting_scheduled',
    options?: {
      revenue?: number;
      distanceMiles?: number;
      notes?: string;
    }
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('activities').insert({
        user_id: user.id,
        lead_id: leadId,
        business_name: businessName,
        event_type: eventType,
        revenue: options?.revenue || 0,
        distance_miles: options?.distanceMiles || 0,
        notes: options?.notes || null
      }).select().single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },

  async getWeeklyStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('v_kpi_dashboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart.toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      throw error;
    }
  },

  async syncKPIs() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-kpi`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ syncType: 'current_user' })
        }
      );

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to sync KPIs');
      }

      return result;
    } catch (error) {
      console.error('Error syncing KPIs:', error);
      throw error;
    }
  }
};
