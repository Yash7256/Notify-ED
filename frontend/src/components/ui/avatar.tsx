import * as React from "react";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, alt, ...props }, ref) => (
  <img
    ref={ref}
    alt={alt}
    className={cn("h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center bg-muted text-xs font-semibold uppercase text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback, AvatarImage };
