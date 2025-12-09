# PWA Implementation Guide

This document describes the Progressive Web App (PWA) features implemented in ScoutPulse.

## Features Implemented

### 1. PWA Manifest
- **Location**: `/public/manifest.json`
- **Features**:
  - App name, short name, and description
  - Icons for all required sizes (72x72 to 512x512)
  - Theme color and background color
  - Display mode: standalone
  - App shortcuts (Dashboard, Messages, Players)
  - Share target configuration
  - Screenshots for app stores

### 2. Service Worker
- **Location**: `/public/sw.js`
- **Features**:
  - Offline caching with network-first strategy
  - Static asset caching
  - Runtime caching for API requests
  - Push notification handling
  - Background sync support
  - Automatic cache cleanup

### 3. Push Notifications
- **Location**: `/lib/pwa/pushNotifications.ts`
- **Features**:
  - Request notification permission
  - Subscribe/unsubscribe to push notifications
  - Save subscriptions to Supabase
  - Support for VAPID keys
  - Notification click handling

### 4. Add to Home Screen
- **Location**: `/components/pwa/AddToHomeScreen.tsx`
- **Features**:
  - Automatic prompt for Android/Chrome
  - iOS-specific installation instructions
  - Dismissible with localStorage persistence
  - Beautiful UI with ScoutPulse branding

### 5. Touch Target Optimization
- **Location**: `/lib/pwa/touchTargets.ts`
- **Features**:
  - Minimum 44x44px touch targets (iOS/Android standard)
  - Utility functions for buttons, inputs, and links
  - Touch device detection
  - Device type detection (mobile/tablet/desktop)

### 6. Swipe Gestures
- **Location**: `/components/pwa/SwipeGestures.tsx`
- **Features**:
  - Swipe left, right, up, down detection
  - Configurable threshold (default 50px)
  - React component wrapper
  - Custom hook for gesture handling

### 7. Mobile Testing Utilities
- **Location**: `/lib/pwa/mobileTesting.ts`
- **Features**:
  - Device size presets (iPhone, iPad, Android, Desktop)
  - Touch target size validation
  - Viewport size detection
  - Testing report generation

## Usage

### Service Worker Registration
The service worker is automatically registered via `PWAProvider` in the root layout.

### Push Notifications
```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { subscribe, unsubscribe, isSubscribed } = usePushNotifications();
  
  return (
    <button onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'Disable' : 'Enable'} Notifications
    </button>
  );
}
```

### Swipe Gestures
```tsx
import { SwipeGestures } from '@/components/pwa/SwipeGestures';

function MyComponent() {
  return (
    <SwipeGestures
      onSwipeLeft={() => console.log('Swiped left')}
      onSwipeRight={() => console.log('Swiped right')}
    >
      <div>Your content here</div>
    </SwipeGestures>
  );
}
```

### Touch-Optimized Components
```tsx
import { TouchOptimizedButton } from '@/components/pwa/TouchOptimizedButton';

function MyComponent() {
  return (
    <TouchOptimizedButton variant="primary" size="lg">
      Click Me
    </TouchOptimizedButton>
  );
}
```

## Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

## Database Setup

Create a `push_subscriptions` table in Supabase:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Testing

### Mobile Testing
```tsx
import { logMobileTestingReport } from '@/lib/pwa/mobileTesting';

// In your component
useEffect(() => {
  logMobileTestingReport();
}, []);
```

### Device Sizes
Test on various device sizes:
- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- iPhone 14 Pro Max (430x932)
- iPad (768x1024)
- Desktop (1920x1080)

## Icons Required

Create the following icons in `/public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

All icons should be square PNGs with the ScoutPulse logo.

## Offline Support

The service worker caches:
- Static assets (HTML, CSS, JS)
- API responses (with network-first strategy)
- Images and fonts
- Offline fallback page

## Browser Support

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android & Desktop)
- ✅ Samsung Internet

## Next Steps

1. Generate VAPID keys for push notifications
2. Create PWA icons in all required sizes
3. Test on real devices
4. Submit to app stores (if desired)
5. Monitor service worker performance
6. Set up push notification server endpoint
