import { Calendar, Edit, Gift, Library, Home, BookOpen } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { MilitaryLogo } from "./ui/ghost-logo"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Create Post", url: "/create-post", icon: Edit },
  { title: "Create Prompt", url: "/create-prompt", icon: BookOpen },
  { title: "Lead Magnet AI", url: "/lead-magnet", icon: Gift },
  { title: "Post Library", url: "/post-library", icon: Library },
  { title: "Content Calendar", url: "/content-calendar", icon: Calendar },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path

  return (
    <Sidebar className="w-64 border-r border-border">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <MilitaryLogo size="md" />
          <div>
            <h1 className="font-mono font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 tracking-wider">
              Ghost Protocol
            </h1>
            <p className="text-sm text-muted-foreground tracking-widest uppercase font-medium">
              LEAD MAGNET AI
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-400 uppercase tracking-wider text-sm font-bold">
            NAVIGATION MATRIX
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 w-full futuristic-border glow-hover text-base font-medium tracking-wide ${
                          isActive 
                            ? "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 font-medium border border-red-500/30" 
                            : "text-sidebar-foreground hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-300"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-red-400 scale-110 drop-shadow-glow' : ''}`} />
                          <span className="tracking-wide font-medium">{item.title}</span>
                          {isActive && item.title === 'Create Post' && (
                            <span className="w-2 h-2 bg-red-500 rounded-full ml-auto animate-pulse"></span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}