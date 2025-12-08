'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// @ts-ignore - jspdf types not available
import jsPDF from 'jspdf';

interface Player {
  id: string;
  name: string;
  position: string;
  stats: Record<string, any>;
  videoUrl?: string;
}

interface ComparisonMatrixProps {
  players: Player[];
  onRemove: (playerId: string) => void;
}

export function ComparisonMatrix({ players, onRemove }: ComparisonMatrixProps) {
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const [syncedPlayback, setSyncedPlayback] = useState(false);

  if (players.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Select players to compare</p>
      </div>
    );
  }

  const statKeys = ['era', 'batting_average', 'fastball_velocity', 'exit_velocity', 'pop_time', 'sixty_yard_time'];
  const allStats = new Set<string>();
  players.forEach(p => {
    Object.keys(p.stats || {}).forEach(key => allStats.add(key));
  });
  const displayStats = Array.from(allStats).filter(k => statKeys.includes(k) || k.includes('velocity') || k.includes('time'));

  const getBestValue = (statKey: string, higherIsBetter: boolean = false): string => {
    const values = players.map(p => {
      const val = p.stats?.[statKey];
      return val ? parseFloat(val) : null;
    }).filter(v => v !== null) as number[];

    if (values.length === 0) return '';
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    return best.toString();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Player Comparison Report', 14, 20);
    
    let y = 30;
    doc.setFontSize(12);
    players.forEach((player, idx) => {
      doc.text(`${idx + 1}. ${player.name} - ${player.position}`, 14, y);
      y += 7;
    });

    y += 10;
    doc.setFontSize(10);
    doc.text('Statistics Comparison', 14, y);
    y += 7;

    displayStats.forEach(stat => {
      const statName = stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      doc.text(`${statName}:`, 14, y);
      players.forEach((player, idx) => {
        const value = player.stats?.[stat] || 'N/A';
        doc.text(`${player.name}: ${value}`, 30 + (idx * 50), y);
      });
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('player-comparison.pdf');
  };

  const shareComparison = () => {
    const url = `${window.location.origin}/compare?players=${players.map(p => p.id).join(',')}`;
    navigator.clipboard.writeText(url);
    alert('Comparison link copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Player Comparison</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shareComparison}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Player Headers */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${players.length}, 1fr)` }}>
        <div></div>
        {players.map((player) => (
          <div key={player.id} className="relative">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.position}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemove(player.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Comparison */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-2 font-medium text-sm">Statistics</div>
        <div className="divide-y">
          {displayStats.map((stat) => {
            const statName = stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const higherIsBetter = stat.includes('velocity') || stat.includes('average');
            const bestValue = getBestValue(stat, higherIsBetter);
            
            return (
              <div key={stat} className="grid gap-4 p-3" style={{ gridTemplateColumns: `200px repeat(${players.length}, 1fr)` }}>
                <div className="font-medium text-sm">{statName}</div>
                {players.map((player) => {
                  const value = player.stats?.[stat] || 'N/A';
                  const isBest = value !== 'N/A' && value.toString() === bestValue;
                  
                  return (
                    <div
                      key={player.id}
                      className={cn(
                        "text-center p-2 rounded",
                        isBest && "bg-emerald-100 dark:bg-emerald-900/30 font-semibold"
                      )}
                    >
                      {value}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Comparison */}
      {players.some(p => p.videoUrl) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Videos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSyncedPlayback(!syncedPlayback)}
            >
              {syncedPlayback ? 'Unsync' : 'Sync Playback'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              player.videoUrl && (
                <div key={player.id} className="space-y-2">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={player.videoUrl}
                      className="w-full h-full"
                      controls
                      onPlay={() => setPlayingVideos(prev => ({ ...prev, [player.id]: true }))}
                      onPause={() => setPlayingVideos(prev => ({ ...prev, [player.id]: false }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">{player.name}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
