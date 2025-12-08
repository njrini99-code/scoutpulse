'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Circle, Sparkles, TrendingUp, Video, FileText, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CompletionItem {
  id: string;
  label: string;
  points: number;
  completed: boolean;
  actionUrl: string;
  icon: React.ReactNode;
}

export function ProfileCompletionCoach() {
  const [completion, setCompletion] = useState(0);
  const [items, setItems] = useState<CompletionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    calculateCompletion();
  }, []);

  const calculateCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: player } = await supabase
        .from('players')
        .select('*, stats:player_stats(*), videos:player_videos(*)')
        .eq('user_id', user.id)
        .single();

      if (!player) return;

      const completionItems: CompletionItem[] = [
        {
          id: 'basic-info',
          label: 'Basic Information',
          points: 15,
          completed: !!(player.first_name && player.last_name && player.position && player.graduation_year),
          actionUrl: '/player/settings',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'bio',
          label: 'Personal Bio',
          points: 10,
          completed: !!(player.bio && player.bio.length > 50),
          actionUrl: '/player/settings',
          icon: <FileText className="w-4 h-4" />
        },
        {
          id: 'stats',
          label: 'Performance Stats',
          points: 20,
          completed: !!(player.stats && Array.isArray(player.stats) && player.stats.length > 0),
          actionUrl: '/player/performance',
          icon: <BarChart3 className="w-4 h-4" />
        },
        {
          id: 'video',
          label: 'Highlight Video',
          points: 25,
          completed: !!(player.videos && Array.isArray(player.videos) && player.videos.length > 0),
          actionUrl: '/player/dashboard',
          icon: <Video className="w-4 h-4" />
        },
        {
          id: 'photos',
          label: 'Profile Photos',
          points: 10,
          completed: !!(player.avatar_url || player.profile_image_url),
          actionUrl: '/player/settings',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'contact',
          label: 'Contact Information',
          points: 10,
          completed: !!(player.email || player.phone),
          actionUrl: '/player/settings',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'academics',
          label: 'Academic Info',
          points: 10,
          completed: !!(player.gpa || player.sat_score || player.act_score),
          actionUrl: '/player/settings',
          icon: <FileText className="w-4 h-4" />
        }
      ];

      const completedPoints = completionItems
        .filter(item => item.completed)
        .reduce((sum, item) => sum + item.points, 0);
      
      const totalPoints = completionItems.reduce((sum, item) => sum + item.points, 0);
      const percentage = Math.round((completedPoints / totalPoints) * 100);

      setCompletion(percentage);
      setItems(completionItems);
      setLoading(false);

      // Celebrate at milestones
      if (percentage === 100) {
        // Could trigger confetti animation here
      }
    } catch (error) {
      console.error('Error calculating completion:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const incompleteItems = items.filter(item => !item.completed);
  const nextItem = incompleteItems[0];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold">Profile Completion</h3>
        </div>
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {completion}%
        </div>
      </div>

      <Progress value={completion} className="h-3 mb-4" />

      {completion < 100 ? (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              Complete your profile to attract more coaches!
            </p>
            {nextItem && (
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  {nextItem.icon}
                  <span className="font-medium">{nextItem.label}</span>
                  <span className="ml-auto text-sm text-emerald-600 dark:text-emerald-400">
                    +{nextItem.points}%
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(nextItem.actionUrl)}
                  className="w-full"
                >
                  Complete {nextItem.label}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Checklist:</p>
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded-lg transition-colors",
                  item.completed
                    ? "bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-white/30 dark:bg-slate-800/30"
                )}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={cn(item.completed && "line-through opacity-60")}>
                  {item.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.points}pts
                </span>
              </div>
            ))}
          </div>

          {completion >= 75 && (
            <div className="mt-4 p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Great progress! Players with complete profiles get 3x more views.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
            Profile Complete! 🎉
          </p>
          <p className="text-sm text-muted-foreground">
            Your profile is fully optimized for maximum visibility.
          </p>
        </div>
      )}
    </div>
  );
}
