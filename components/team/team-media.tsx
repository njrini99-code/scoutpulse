'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import type { TeamMedia as TeamMediaType } from '@/lib/queries/team';
import type { TeamPageMode } from './team-page-shell';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { addTeamMedia, deleteTeamMedia } from '@/lib/queries/team';
import { toast } from 'sonner';

interface TeamMediaProps {
  teamId: string;
  media: TeamMediaType[];
  mode: TeamPageMode;
  onUpdate?: () => void;
}

export function TeamMedia({ teamId, media, mode, onUpdate }: TeamMediaProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    media_type: 'photo' as TeamMediaType['media_type'],
    title: '',
    description: '',
    url: '',
  });
  const isOwner = mode === 'owner';

  const handleAddMedia = async () => {
    if (!formData.url) {
      toast.error('Media URL is required');
      return;
    }

    const success = await addTeamMedia(teamId, formData);
    if (success) {
      toast.success('Media added');
      setIsAdding(false);
      setFormData({
        media_type: 'photo',
        title: '',
        description: '',
        url: '',
      });
      onUpdate?.();
    } else {
      toast.error('Failed to add media');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const success = await deleteTeamMedia(mediaId);
    if (success) {
      toast.success('Media deleted');
      onUpdate?.();
    } else {
      toast.error('Failed to delete media');
    }
  };

  const photos = media.filter((m) => m.media_type === 'photo');
  const videos = media.filter((m) => m.media_type === 'video');

  return (
    <Card className="bg-[#111315] border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Media & Highlights</CardTitle>
          {isOwner && (
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#0B0D0F] border-white/10">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111315] border-white/10">
                <DialogHeader>
                  <DialogTitle>Add Media</DialogTitle>
                  <DialogDescription>
                    Add photos or videos to showcase your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    value={formData.media_type}
                    onValueChange={(v) => setFormData({ ...formData, media_type: v as any })}
                  >
                    <SelectTrigger className="bg-[#0B0D0F] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111315] border-white/10">
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Media URL"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="bg-[#0B0D0F] border-white/10"
                  />

                  <Input
                    placeholder="Title (optional)"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-[#0B0D0F] border-white/10"
                  />

                  <Textarea
                    placeholder="Description (optional)"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#0B0D0F] border-white/10"
                    rows={3}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMedia}>Add Media</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No media uploaded yet
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Photos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-[#0B0D0F] border border-white/5 group"
                    >
                      <img
                        src={item.url}
                        alt={item.title || 'Team photo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {item.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-white text-sm font-medium">{item.title}</p>
                        </div>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                          onClick={() => handleDeleteMedia(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-[#0B0D0F] border border-white/5 group"
                    >
                      <iframe
                        src={item.url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {item.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-white text-sm font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-slate-300 text-xs mt-1">{item.description}</p>
                          )}
                        </div>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                          onClick={() => handleDeleteMedia(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
