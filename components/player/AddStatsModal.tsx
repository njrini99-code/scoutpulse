'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddStatsModalProps {
  playerId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function AddStatsModal({ playerId, onSuccess, trigger, open: controlledOpen, onClose }: AddStatsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };
  const [saving, setSaving] = useState(false);
  const [statType, setStatType] = useState<'hitting' | 'pitching'>('hitting');
  
  const [formData, setFormData] = useState({
    stat_date: new Date().toISOString().split('T')[0],
    game_type: 'game',
    level: '',
    // Hitting
    at_bats: '',
    hits: '',
    doubles: '',
    triples: '',
    home_runs: '',
    rbis: '',
    runs: '',
    walks: '',
    strikeouts: '',
    stolen_bases: '',
    // Pitching
    innings_pitched: '',
    strikeouts_pitched: '',
    walks_allowed: '',
    hits_allowed: '',
    earned_runs: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const supabase = createClient();
      
      const insertData: any = {
        player_id: playerId,
        stat_date: formData.stat_date,
        game_type: formData.game_type,
        level: formData.level || null,
        source: 'manual',
      };

      if (statType === 'hitting') {
        insertData.at_bats = formData.at_bats ? parseInt(formData.at_bats) : 0;
        insertData.hits = formData.hits ? parseInt(formData.hits) : 0;
        insertData.doubles = formData.doubles ? parseInt(formData.doubles) : 0;
        insertData.triples = formData.triples ? parseInt(formData.triples) : 0;
        insertData.home_runs = formData.home_runs ? parseInt(formData.home_runs) : 0;
        insertData.rbis = formData.rbis ? parseInt(formData.rbis) : 0;
        insertData.runs = formData.runs ? parseInt(formData.runs) : 0;
        insertData.walks = formData.walks ? parseInt(formData.walks) : 0;
        insertData.strikeouts = formData.strikeouts ? parseInt(formData.strikeouts) : 0;
        insertData.stolen_bases = formData.stolen_bases ? parseInt(formData.stolen_bases) : 0;
        // Calculate batting avg
        if (insertData.at_bats > 0) {
          insertData.batting_avg = insertData.hits / insertData.at_bats;
        }
      } else {
        insertData.innings_pitched = formData.innings_pitched ? parseFloat(formData.innings_pitched) : 0;
        insertData.strikeouts_pitched = formData.strikeouts_pitched ? parseInt(formData.strikeouts_pitched) : 0;
        insertData.walks_allowed = formData.walks_allowed ? parseInt(formData.walks_allowed) : 0;
        insertData.hits_allowed = formData.hits_allowed ? parseInt(formData.hits_allowed) : 0;
        insertData.earned_runs = formData.earned_runs ? parseInt(formData.earned_runs) : 0;
        // Calculate ERA
        if (insertData.innings_pitched > 0) {
          insertData.era = (insertData.earned_runs / insertData.innings_pitched) * 9;
        }
      }

      const { error } = await supabase
        .from('player_stats')
        .insert(insertData);

      if (error) {
        toast.error('Failed to add stats');
        console.error(error);
        return;
      }

      toast.success('Stats added successfully!');
      handleClose();
      // Reset form
      setFormData({
        stat_date: new Date().toISOString().split('T')[0],
        game_type: 'game',
        level: '',
        at_bats: '', hits: '', doubles: '', triples: '', home_runs: '',
        rbis: '', runs: '', walks: '', strikeouts: '', stolen_bases: '',
        innings_pitched: '', strikeouts_pitched: '', walks_allowed: '', hits_allowed: '', earned_runs: '',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error adding stats:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Add Stats
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Add Game Stats
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.stat_date}
                onChange={(e) => setFormData({ ...formData, stat_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Game Type</Label>
              <Select value={formData.game_type} onValueChange={(v) => setFormData({ ...formData, game_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game">Regular Game</SelectItem>
                  <SelectItem value="scrimmage">Scrimmage</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="showcase">Showcase</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={statType} onValueChange={(v) => setStatType(v as 'hitting' | 'pitching')}>
            <TabsList className="w-full">
              <TabsTrigger value="hitting" className="flex-1">Hitting</TabsTrigger>
              <TabsTrigger value="pitching" className="flex-1">Pitching</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hitting" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">AB</Label>
                  <Input
                    type="number"
                    value={formData.at_bats}
                    onChange={(e) => setFormData({ ...formData, at_bats: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hits</Label>
                  <Input
                    type="number"
                    value={formData.hits}
                    onChange={(e) => setFormData({ ...formData, hits: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">2B</Label>
                  <Input
                    type="number"
                    value={formData.doubles}
                    onChange={(e) => setFormData({ ...formData, doubles: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">3B</Label>
                  <Input
                    type="number"
                    value={formData.triples}
                    onChange={(e) => setFormData({ ...formData, triples: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">HR</Label>
                  <Input
                    type="number"
                    value={formData.home_runs}
                    onChange={(e) => setFormData({ ...formData, home_runs: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">RBI</Label>
                  <Input
                    type="number"
                    value={formData.rbis}
                    onChange={(e) => setFormData({ ...formData, rbis: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Runs</Label>
                  <Input
                    type="number"
                    value={formData.runs}
                    onChange={(e) => setFormData({ ...formData, runs: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">BB</Label>
                  <Input
                    type="number"
                    value={formData.walks}
                    onChange={(e) => setFormData({ ...formData, walks: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">K</Label>
                  <Input
                    type="number"
                    value={formData.strikeouts}
                    onChange={(e) => setFormData({ ...formData, strikeouts: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SB</Label>
                  <Input
                    type="number"
                    value={formData.stolen_bases}
                    onChange={(e) => setFormData({ ...formData, stolen_bases: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pitching" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">IP</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.innings_pitched}
                    onChange={(e) => setFormData({ ...formData, innings_pitched: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">K</Label>
                  <Input
                    type="number"
                    value={formData.strikeouts_pitched}
                    onChange={(e) => setFormData({ ...formData, strikeouts_pitched: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">BB</Label>
                  <Input
                    type="number"
                    value={formData.walks_allowed}
                    onChange={(e) => setFormData({ ...formData, walks_allowed: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hits</Label>
                  <Input
                    type="number"
                    value={formData.hits_allowed}
                    onChange={(e) => setFormData({ ...formData, hits_allowed: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ER</Label>
                  <Input
                    type="number"
                    value={formData.earned_runs}
                    onChange={(e) => setFormData({ ...formData, earned_runs: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Stats'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

