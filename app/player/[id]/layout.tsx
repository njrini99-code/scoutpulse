import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// Dynamic Metadata for Player Profile
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    const { data: player } = await supabase
      .from('players')
      .select('full_name, primary_position, grad_year, high_school_name, city, state, avatar_url, about')
      .eq('id', id)
      .single();

    if (!player) {
      return {
        title: 'Player Not Found',
        description: 'This player profile could not be found.',
      };
    }

    const title = `${player.full_name} | ${player.primary_position || 'Player'} - Class of ${player.grad_year || 'N/A'}`;
    const location = [player.city, player.state].filter(Boolean).join(', ');
    const description = player.about 
      ? player.about.slice(0, 155) + (player.about.length > 155 ? '...' : '')
      : `${player.full_name} is a ${player.primary_position || 'baseball player'} from ${location || 'the United States'}. Class of ${player.grad_year || 'N/A'}. View their profile, stats, and highlights on ScoutPulse.`;

    const ogImage = player.avatar_url || '/og-player-default.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        images: [
          {
            url: ogImage,
            width: 400,
            height: 400,
            alt: `${player.full_name} - ${player.primary_position || 'Player'}`,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    // Log error but don't block metadata generation
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating player metadata:', error);
    }
    return {
      title: 'Player Profile | ScoutPulse',
      description: 'View player profile, stats, and highlights on ScoutPulse.',
    };
  }
}

export default function PlayerProfileLayout({ children }: Props) {
  return children;
}
