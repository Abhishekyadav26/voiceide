// Adapted from Magic UI Marquee (https://magicui.design/docs/components/marquee).
// Tailwind v4-only syntax (`gap-(--gap)`) replaced with plain CSS vars so it
// works on this repo's Tailwind v3 setup. See .mb-marquee* in app/globals.css.
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  duration?: string;
  gap?: string;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  duration = '40s',
  gap = '1rem',
  ...props
}: MarqueeProps): JSX.Element {
  return (
    <div
      {...props}
      className={cn('mb-marquee', vertical && 'mb-marquee-vertical', pauseOnHover && 'mb-marquee-pause', className)}
      style={{ '--mb-duration': duration, '--mb-gap': gap } as CSSProperties}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="mb-marquee-track"
            style={reverse ? { animationDirection: 'reverse' } : undefined}
            aria-hidden={i > 0}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
