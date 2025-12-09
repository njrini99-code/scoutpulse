import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants are kept calm and consistent; legacy names map to modern intent variants.
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        subtle: 'bg-muted text-foreground hover:bg-muted/80',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        danger: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm hover:from-blue-600 hover:to-cyan-500',
        success:
          'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm hover:from-emerald-600 hover:to-green-500',
        glassPrimary: "backdrop-blur-xl bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 border border-white/20 shadow-lg shadow-emerald-500/30 text-white rounded-lg px-6 py-3 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300",
        glassSecondary: "backdrop-blur-xl bg-white/10 border border-white/20 text-white rounded-lg px-6 py-3 hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-300",
        glassGhost: "backdrop-blur-xl bg-transparent border border-white/10 text-white/90 rounded-lg px-6 py-3 hover:bg-white/5 hover:border-white/20 transition-all duration-300",
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-4 text-sm',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'F',
        location: 'button.tsx:Button',
        message: 'Button component rendering',
        data: { variant, size, asChild, hasOnClick: !!props.onClick, className: className?.substring(0, 50) },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion agent log

    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={asChild ? undefined : ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
