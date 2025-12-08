'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Upload,
  Video,
  X,
  Check,
  AlertCircle,
  Play,
  Film,
  Trash2,
  Eye,
  FileVideo,
  CloudUpload,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface VideoMetadata {
  title: string;
  description?: string;
  videoType: VideoType;
  recordedDate?: string;
  tags?: string[];
}

export type VideoType = 
  | 'game_highlight' 
  | 'practice' 
  | 'pitching' 
  | 'hitting' 
  | 'fielding' 
  | 'running' 
  | 'showcase' 
  | 'other';

export interface UploadedVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  metadata: VideoMetadata;
  size: number;
  duration?: number;
  uploadedAt: string;
}

interface VideoUploadProps {
  playerId: string;
  onUploadComplete?: (video: UploadedVideo) => void;
  onUploadError?: (error: Error) => void;
  maxSizeMB?: number;
  allowedFormats?: string[];
  className?: string;
}

type UploadStatus = 'idle' | 'selected' | 'uploading' | 'processing' | 'success' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_MAX_SIZE_MB = 100;
const DEFAULT_ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
const FORMAT_EXTENSIONS = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/avi': '.avi',
};

const VIDEO_TYPE_OPTIONS: { value: VideoType; label: string }[] = [
  { value: 'game_highlight', label: 'Game Highlight' },
  { value: 'practice', label: 'Practice' },
  { value: 'pitching', label: 'Pitching' },
  { value: 'hitting', label: 'Hitting' },
  { value: 'fielding', label: 'Fielding' },
  { value: 'running', label: 'Running/Speed' },
  { value: 'showcase', label: 'Showcase Event' },
  { value: 'other', label: 'Other' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate a thumbnail from a video file
 */
async function generateThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to 25% of video for thumbnail
      video.currentTime = video.duration * 0.25;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          resolve(blob);
        }, 'image/jpeg', 0.8);
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get video duration
 */
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };

    video.src = URL.createObjectURL(file);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function VideoUpload({
  playerId,
  onUploadComplete,
  onUploadError,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowedFormats = DEFAULT_ALLOWED_FORMATS,
  className,
}: VideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  
  // Metadata form state
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    videoType: 'game_highlight',
    recordedDate: new Date().toISOString().split('T')[0],
    tags: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [previewUrl, thumbnailUrl]);

  // ═══════════════════════════════════════════════════════════════════════════
  // File Validation
  // ═══════════════════════════════════════════════════════════════════════════

  const validateFile = useCallback((file: File): string | null => {
    // Check format
    if (!allowedFormats.includes(file.type)) {
      const allowedExts = allowedFormats
        .map(f => FORMAT_EXTENSIONS[f as keyof typeof FORMAT_EXTENSIONS] || f)
        .join(', ');
      return `Invalid format. Allowed formats: ${allowedExts}`;
    }

    // Check size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [allowedFormats, maxSizeMB]);

  // ═══════════════════════════════════════════════════════════════════════════
  // File Selection
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    setStatus('selected');
    
    // Set default title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setMetadata(prev => ({ ...prev, title: fileName }));

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Get duration
    const duration = await getVideoDuration(file);
    setVideoDuration(duration);

    // Generate thumbnail
    const thumbnail = await generateThumbnail(file);
    if (thumbnail) {
      setThumbnailUrl(URL.createObjectURL(thumbnail));
    }

    // Open metadata dialog
    setIsMetadataOpen(true);
  }, [validateFile]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag & Drop Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Upload Handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleUpload = async () => {
    if (!selectedFile || !metadata.title) {
      toast.error('Please provide a title for the video');
      return;
    }

    setStatus('uploading');
    setUploadProgress(0);
    setError(null);
    setIsMetadataOpen(false);

    const supabase = createClient();

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${playerId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Upload video to Supabase Storage
      const { data: videoData, error: videoError } = await supabase.storage
        .from('player-videos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) throw videoError;

      setUploadProgress(70);
      setStatus('processing');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('player-videos')
        .getPublicUrl(fileName);

      // Upload thumbnail if generated
      let thumbnailPublicUrl: string | undefined;
      if (thumbnailUrl) {
        const thumbnailBlob = await fetch(thumbnailUrl).then(r => r.blob());
        const thumbnailFileName = `${playerId}/thumbnails/${Date.now()}.jpg`;
        
        const { error: thumbError } = await supabase.storage
          .from('player-videos')
          .upload(thumbnailFileName, thumbnailBlob, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('player-videos')
            .getPublicUrl(thumbnailFileName);
          thumbnailPublicUrl = thumbUrlData.publicUrl;
        }
      }

      setUploadProgress(90);

      // Save video record to database
      const { data: videoRecord, error: dbError } = await supabase
        .from('player_videos')
        .insert({
          player_id: playerId,
          title: metadata.title,
          description: metadata.description,
          video_type: metadata.videoType,
          video_url: urlData.publicUrl,
          thumbnail_url: thumbnailPublicUrl,
          recorded_date: metadata.recordedDate,
          file_size: selectedFile.size,
          duration: videoDuration,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      setStatus('success');
      
      toast.success('Video uploaded successfully!');

      // Call completion callback
      onUploadComplete?.({
        id: videoRecord.id,
        url: urlData.publicUrl,
        thumbnailUrl: thumbnailPublicUrl,
        metadata,
        size: selectedFile.size,
        duration: videoDuration || undefined,
        uploadedAt: new Date().toISOString(),
      });

      // Reset after success
      setTimeout(() => {
        resetUpload();
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setStatus('error');
      onUploadError?.(err instanceof Error ? err : new Error(errorMessage));
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════════════════════

  const resetUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setThumbnailUrl(null);
    setUploadProgress(0);
    setVideoDuration(null);
    setError(null);
    setStatus('idle');
    setMetadata({
      title: '',
      description: '',
      videoType: 'game_highlight',
      recordedDate: new Date().toISOString().split('T')[0],
      tags: [],
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFormats.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Drop Zone */}
      {status === 'idle' && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer',
            'flex flex-col items-center justify-center gap-4 min-h-[240px]',
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50',
          )}
        >
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-emerald-100' : 'bg-slate-100'
          )}>
            <CloudUpload className={cn(
              'w-8 h-8 transition-colors',
              isDragging ? 'text-emerald-600' : 'text-slate-400'
            )} />
          </div>
          
          <div className="text-center">
            <p className="text-slate-800 font-medium">
              {isDragging ? 'Drop your video here' : 'Drag & drop your video here'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <span className="text-emerald-600 font-medium">browse files</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge variant="outline" className="text-[10px]">MP4</Badge>
            <Badge variant="outline" className="text-[10px]">MOV</Badge>
            <Badge variant="outline" className="text-[10px]">AVI</Badge>
            <span className="text-slate-300">•</span>
            <span>Max {maxSizeMB}MB</span>
          </div>
        </div>
      )}

      {/* Selected/Uploading/Success State */}
      {status !== 'idle' && selectedFile && (
        <div className="border border-slate-200 rounded-2xl p-4 bg-white">
          <div className="flex items-start gap-4">
            {/* Thumbnail Preview */}
            <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileVideo className="w-8 h-8 text-slate-300" />
                </div>
              )}
              {status === 'success' && (
                <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
              )}
              {status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/20 rounded animate-pulse" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800 truncate">
                    {metadata.title || selectedFile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    {videoDuration && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{formatDuration(videoDuration)}</span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {VIDEO_TYPE_OPTIONS.find(o => o.value === metadata.videoType)?.label}
                    </Badge>
                  </div>
                </div>
                
                {(status === 'selected' || status === 'error') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                    onClick={resetUpload}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {(status === 'uploading' || status === 'processing') && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">
                    {status === 'processing' ? 'Processing...' : `Uploading... ${uploadProgress}%`}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {status === 'success' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                  <Check className="w-4 h-4" />
                  <span>Upload complete!</span>
                </div>
              )}

              {/* Error Message */}
              {status === 'error' && error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions for selected state */}
              {status === 'selected' && (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setIsMetadataOpen(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                  {previewUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  )}
                </div>
              )}

              {/* Retry for error state */}
              {status === 'error' && (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Retry Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetUpload}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata Dialog */}
      <Dialog open={isMetadataOpen} onOpenChange={setIsMetadataOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Video Details</DialogTitle>
            <DialogDescription>
              Add information about your video before uploading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Showcase Pitching Highlights"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Video Type */}
            <div className="space-y-2">
              <Label>Video Type</Label>
              <Select
                value={metadata.videoType}
                onValueChange={(value: VideoType) => 
                  setMetadata(prev => ({ ...prev, videoType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recorded Date */}
            <div className="space-y-2">
              <Label htmlFor="recordedDate">Date Recorded</Label>
              <Input
                id="recordedDate"
                type="date"
                value={metadata.recordedDate}
                onChange={(e) => setMetadata(prev => ({ ...prev, recordedDate: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add details about this video..."
                rows={3}
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileVideo className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                    {videoDuration && ` • ${formatDuration(videoDuration)}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetadataOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!metadata.title}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Video Gallery Component (for displaying uploaded videos)
// ═══════════════════════════════════════════════════════════════════════════

interface VideoGalleryProps {
  videos: UploadedVideo[];
  onDelete?: (videoId: string) => void;
  onPlay?: (video: UploadedVideo) => void;
  isEditable?: boolean;
}

export function VideoGallery({ videos, onDelete, onPlay, isEditable = false }: VideoGalleryProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No videos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-slate-100">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.metadata.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-10 h-10 text-slate-300" />
              </div>
            )}
            
            {/* Play overlay */}
            <button
              onClick={() => onPlay?.(video)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-slate-800 ml-1" />
              </div>
            </button>

            {/* Duration badge */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-[10px] text-white font-medium">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h4 className="font-medium text-slate-800 truncate">{video.metadata.title}</h4>
            <div className="flex items-center justify-between mt-1">
              <Badge variant="outline" className="text-[10px] py-0">
                {VIDEO_TYPE_OPTIONS.find(o => o.value === video.metadata.videoType)?.label}
              </Badge>
              {isEditable && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VideoUpload;

