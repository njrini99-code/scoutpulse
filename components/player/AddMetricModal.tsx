'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ruler, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddMetricModalProps {
  playerId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const COMMON_METRICS = [
  { label: 'Fastball Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Exit Velocity', type: 'velocity', unit: 'mph' },
  { label: '60-Yard Dash', type: 'speed', unit: 'sec' },
  { label: 'Pop Time', type: 'speed', unit: 'sec' },
  { label: 'Infield Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Outfield Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Changeup Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Slider Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Curveball Velocity', type: 'velocity', unit: 'mph' },
  { label: 'Vertical Jump', type: 'other', unit: 'in' },
];

export function AddMetricModal({ playerId, onSuccess, trigger }: AddMetricModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    metric_label: '',
    metric_value: '',
    metric_type: 'velocity',
    context: '',
    verified_date: '',
  });

  const handleQuickSelect = (metric: typeof COMMON_METRICS[0]) => {
    setFormData({
      ...formData,
      metric_label: metric.label,
      metric_type: metric.type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.metric_label || !formData.metric_value) {
      toast.error('Please fill in label and value');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('player_metrics')
        .insert({
          player_id: playerId,
          metric_label: formData.metric_label,
          metric_value: formData.metric_value,
          metric_type: formData.metric_type,
          context: formData.context || null,
          verified_date: formData.verified_date || null,
        });

      if (error) {
        toast.error('Failed to add metric');
        console.error(error);
        return;
      }

      toast.success('Metric added!');
      setOpen(false);
      setFormData({ metric_label: '', metric_value: '', metric_type: 'velocity', context: '', verified_date: '' });
      onSuccess?.();
    } catch (error) {
      console.error('Error adding metric:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Measurable
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-500" />
            Add Measurable
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-slate-500">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_METRICS.slice(0, 6).map((metric) => (
                <button
                  key={metric.label}
                  type="button"
                  onClick={() => handleQuickSelect(metric)}
                  aria-label={`Select ${metric.label} metric`}
                  aria-pressed={formData.metric_label === metric.label}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    formData.metric_label === metric.label
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metric Name *</Label>
            <Input
              value={formData.metric_label}
              onChange={(e) => setFormData({ ...formData, metric_label: e.target.value })}
              placeholder="e.g., Fastball Velocity"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Value *</Label>
              <Input
                value={formData.metric_value}
                onChange={(e) => setFormData({ ...formData, metric_value: e.target.value })}
                placeholder="e.g., 89 mph"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.metric_type} onValueChange={(v) => setFormData({ ...formData, metric_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="velocity">Velocity</SelectItem>
                  <SelectItem value="speed">Speed/Time</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Where Measured (Optional)</Label>
            <Input
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder="e.g., Perfect Game Showcase, East Cobb"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Date Verified (Optional)</Label>
            <Input
              type="date"
              value={formData.verified_date}
              onChange={(e) => setFormData({ ...formData, verified_date: e.target.value })}
            />
            <p className="text-xs text-slate-500">Add date if officially verified at an event</p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Metric'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

