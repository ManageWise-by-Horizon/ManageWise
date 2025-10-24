"use client"

import { forwardRef } from "react"

interface HydrationSafeDivProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

// Componente que evita warnings de hidratación para divs que pueden ser afectados por extensiones del navegador
export const HydrationSafeDiv = forwardRef<HTMLDivElement, HydrationSafeDivProps>(
  ({ children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        suppressHydrationWarning={true}
        {...props}
      >
        {children}
      </div>
    )
  }
)

HydrationSafeDiv.displayName = "HydrationSafeDiv"