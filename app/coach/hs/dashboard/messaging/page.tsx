'use client';

import { useState } from 'react';
import { useCurrentCoach } from '@/lib/hooks/useCurrentCoach';
import { useCurrentHighSchoolOrg } from '@/lib/hooks/useCurrentHighSchoolOrg';
import { Card } from '@/components/ui/card';
import { HsConversationList } from '@/components/coach/hs/Messaging/hs-conversation-list';
import { HsConversationView } from '@/components/coach/hs/Messaging/hs-conversation-view';

export default function HsCoachMessagingPage() {
  const { coachProfile, isLoading: loadingCoach } = useCurrentCoach();
  const { org, isLoading: loadingOrg } = useCurrentHighSchoolOrg(coachProfile?.id);
  const [activeConversationId, setActiveConversationId] = useState<string>();

  if (loadingCoach || loadingOrg) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!coachProfile || !org) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
        <p className="text-sm text-slate-300">No high school organization linked yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <HsConversationList
        coachProfileId={coachProfile.id}
        orgId={org.id}
        onSelect={setActiveConversationId}
      />
      <HsConversationView conversationId={activeConversationId} coachProfileId={coachProfile.id} />
    </div>
  );
}
