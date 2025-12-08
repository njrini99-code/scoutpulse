import { PageLoading } from '@/components/ui/PageLoading';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <PageLoading variant="branded" message="Loading onboarding..." />
    </div>
  );
}
