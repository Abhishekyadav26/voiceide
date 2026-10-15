// Adapted from Magic UI Shimmer Button (https://magicui.design/docs/components/shimmer-button).
// Container-query units (`cqh`, `@container-[size]`) replaced with a plain
// oversized rotating layer so no extra Tailwind plugin is needed.
// See .mb-shimmer-* in app/globals.css.
import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#5eead4',
      shimmerSize = '0.06em',
      shimmerDuration = '3s',
      borderRadius = '0.5rem',
      background = 'rgba(10,10,13,1)',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as CSSProperties
        }
        className={cn('mb-shimmer-btn group', className)}
        {...props}
      >
        <div className="mb-shimmer-spark-wrap" aria-hidden>
          <div className="mb-shimmer-spark" aria-hidden />
        </div>
        <span className="mb-shimmer-content">{children}</span>
        <div className="mb-shimmer-backdrop" aria-hidden />
        <div className="mb-shimmer-highlight" aria-hidden />
      </button>
    );
  },
);

ShimmerButton.displayName = 'ShimmerButton';
