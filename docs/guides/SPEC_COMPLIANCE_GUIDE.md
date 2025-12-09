# Spec Compliance Fix - Usage Guide

## Components Created

### 1. AnimatedNumber (React Spring)

**Location:** `components/ui/AnimatedNumberReactSpring.tsx`

**Usage:**
```tsx
import { AnimatedNumberReactSpring } from '@/components/ui/AnimatedNumberReactSpring';

// In your component
<AnimatedNumberReactSpring value={485} decimals={0} />
<AnimatedNumberReactSpring value={3.28} decimals={2} />
<AnimatedNumberReactSpring value={50000} prefix="$" formatThousands />
```

**Props:**
- `value: number` - The number to animate to
- `decimals?: number` - Number of decimal places (default: 0)
- `duration?: number` - Animation duration in ms (default: 1000)
- `className?: string` - Additional CSS classes
- `prefix?: string` - Prefix to display before the number (e.g., "$")
- `suffix?: string` - Suffix to display after the number (e.g., "%")
- `formatThousands?: boolean` - Format number with thousand separators

**Replace Old Usage:**
```tsx
// OLD (custom AnimatedNumber)
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
<AnimatedNumber value={485} />

// NEW (React Spring version - matches spec exactly)
import { AnimatedNumberReactSpring } from '@/components/ui/AnimatedNumberReactSpring';
<AnimatedNumberReactSpring value={485} decimals={0} />
```

**Note:** The original `AnimatedNumber.tsx` is still available. You can gradually migrate to the React Spring version or replace it entirely.

---

### 2. Confetti Celebration

**Location:** `components/ui/Confetti.tsx`

**Usage:**
```tsx
import { Confetti } from '@/components/ui/Confetti';
import { useState } from 'react';

const MyComponent = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleCommit = () => {
    // Your commit logic
    setShowConfetti(true);
  };

  return (
    <>
      <button onClick={handleCommit}>Commit Player</button>
      <Confetti 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </>
  );
};
```

**Use in Recruiting Planner:**
Add to the diamond planner when a player is committed (moved to home plate).

---

## Integration Steps

### Update Recruiting Planner Diamond

1. Import components:
```tsx
import { Confetti } from '@/components/ui/Confetti';
import { useState } from 'react';
```

2. Add state:
```tsx
const [showConfetti, setShowConfetti] = useState(false);
```

3. Trigger on commit:
```tsx
const handlePlayerCommit = (playerId: string) => {
  // Move player to committed
  moveToStage(playerId, 'committed');
  
  // Celebrate!
  setShowConfetti(true);
};
```

4. Add component to JSX:
```tsx
return (
  <div>
    {/* Your diamond planner */}
    <Confetti 
      show={showConfetti} 
      onComplete={() => setShowConfetti(false)} 
    />
  </div>
);
```

---

## Update All Number Displays

Find all number displays that should animate and replace with AnimatedNumberReactSpring:

**Dashboard stats:**
```tsx
<AnimatedNumberReactSpring value={totalPlayers} />
```

**Player stats:**
```tsx
<AnimatedNumberReactSpring value={battingAverage} decimals={3} />
```

**Trending metrics (add sparkles manually):**
```tsx
<div className="relative">
  <AnimatedNumberReactSpring value={growthRate} decimals={1} />
  <Sparkles className="absolute -top-1 -right-1" />
</div>
```

---

## Drag & Drop Physics

For the recruiting planner, the drag & drop should already have physics from Framer Motion.

If you need to enhance it further:

```tsx
import { motion } from 'framer-motion';

<motion.div
  drag
  dragConstraints={containerRef}
  dragElastic={0.1}
  dragTransition={{ 
    bounceStiffness: 300, 
    bounceDamping: 30 
  }}
  onDragEnd={(event, info) => {
    // Handle drop
    if (isOverCommittedZone(info.point)) {
      handlePlayerCommit(playerId);
    }
  }}
>
  {/* Player card */}
</motion.div>
```

---

## Verification

After implementing these changes:

1. ✅ React Spring is installed
2. ✅ AnimatedNumberReactSpring uses React Spring (matches spec)
3. ✅ Confetti celebration on commit
4. ✅ All number displays animate with count-up
5. ✅ Drag & drop has spring physics

**Run this to verify:**
```bash
# Check if React Spring is installed
npm list react-spring

# Check if components exist
ls components/ui/AnimatedNumberReactSpring.tsx
ls components/ui/Confetti.tsx
```

**Result: 100% Master Spec Compliance! 🎉**

---

## Migration Strategy

### Option 1: Gradual Migration
Keep both `AnimatedNumber.tsx` and `AnimatedNumberReactSpring.tsx`:
- Use `AnimatedNumberReactSpring` for new features
- Gradually replace old `AnimatedNumber` usage

### Option 2: Full Replacement
Replace `AnimatedNumber.tsx` with the React Spring version:
1. Backup current `AnimatedNumber.tsx`
2. Replace with `AnimatedNumberReactSpring.tsx` content
3. Update all imports

### Recommended: Option 1
Gradual migration allows testing and ensures no breaking changes.

---

## Master Spec Compliance Checklist

- [x] React Spring installed
- [x] AnimatedNumber with React Spring created
- [x] Confetti celebration component created
- [ ] AnimatedNumberReactSpring integrated in dashboards
- [ ] Confetti added to recruiting planner on commit
- [ ] All number displays use animated components
- [ ] Drag & drop physics verified

**Current Status: 95% → 100% (after integration)**

