'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Upload, User, Users } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUploadComplete: (storageId: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  type: 'profile' | 'team';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  onDelete,
  type,
  size = 'md',
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(
    type === 'profile'
      ? api.userProfiles.generateProfileImageUploadUrl
      : api.teams.generateTeamImageUploadUrl
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading(true);

      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl({});

        // Upload file
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { storageId } = await response.json();

        // Call parent callback
        await onUploadComplete(storageId);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image. Please try again.');
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, onUploadComplete]
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    
    if (!confirm('Are you sure you want to remove this image?')) return;

    try {
      await onDelete();
      setPreviewUrl(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image. Please try again.');
    }
  }, [onDelete]);

  const displayUrl = previewUrl || currentImageUrl;
  const Icon = type === 'profile' ? User : Users;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-secondary/50 border-2 border-primary/20 group`}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={type === 'profile' ? 'Profile' : 'Team'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className={`${iconSizes[size]} text-muted-foreground`} />
          </div>
        )}

        {/* Overlay on hover */}
        {!disabled && (
          <div
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          {displayUrl ? 'Change' : 'Upload'}
        </Button>

        {displayUrl && onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={disabled || isUploading}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
