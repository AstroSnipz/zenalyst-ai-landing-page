
import * as React from "react"
import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

type SidebarState = "expanded" | "collapsed"

interface SidebarContextType {
  state: SidebarState
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultState?: SidebarState
}

export function SidebarProvider({ 
  children, 
  defaultState = "expanded" 
}: SidebarProviderProps) {
  const [state, setState] = useState<SidebarState>(defaultState)

  const toggleSidebar = () => {
    setState(prev => prev === "expanded" ? "collapsed" : "expanded")
  }

  return (
    <SidebarContext.Provider value={{ state, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full w-full flex-col", className)}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

export { Sidebar }
