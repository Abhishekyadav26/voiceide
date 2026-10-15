// Adapted from Magic UI Animated Shiny Text
// (https://magicui.design/docs/components/animated-shiny-text).
// `bg-linear-*` (Tailwind v4) replaced with plain CSS. See .mb-shiny in app/globals.css.
import type { ComponentPropsWithoutRef, CSSProperties, FC } from 'react';
import { cn } from '@/lib/utils';

export interface ShinyTextProps extends ComponentPropsWithoutRef<'span'> {
  shimmerWidth?: number;
}

export const ShinyText: FC<ShinyTextProps> = ({ children, className, shimmerWidth = 100, ...props }) => {
  return (
    <span
      style={{ '--shiny-width': `${shimmerWidth}px` } as CSSProperties}
      className={cn('mb-shiny', className)}
      {...props}
    >
      {children}
    </span>
  );
};
