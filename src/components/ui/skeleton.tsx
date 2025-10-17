/**
 * Skeleton Component
 *
 * Loading placeholder component with pulse animation for indicating content loading states.
 * Based on shadcn/ui component library.
 */

import { cn } from "@/lib/utils/index"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
