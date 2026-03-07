import * as React from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean;
  vertical?: boolean;
  reverse?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  pauseOnHover = false,
  vertical = false,
  reverse = false,
  repeat = 2,
  children,
  ...props
}: MarqueeProps) {
  const content = React.Children.toArray(children);
  const loops = Array.from({ length: repeat }, (_, i) => i);
  const animationName = vertical ? "marquee-vertical" : "marquee";

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      {...props}
    >
      <div
        className={cn(
          "flex w-max gap-[var(--gap,1.5rem)]",
          vertical && "flex-col",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `${animationName} var(--duration, 20s) linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
        aria-hidden
      >
        {loops.map((loop) =>
          content.map((child, idx) => (
            <div key={`${loop}-${idx}`} className={vertical ? "w-full" : "inline-flex"}>
              {child}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
