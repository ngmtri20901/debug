"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    isSeparated?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = (itemTitle: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // Only open if item has sub-items
    const item = items.find(i => i.title === itemTitle)
    if (item?.items && item.items.length > 0) {
      setHoveredItem(itemTitle)
    }
  }

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow moving to sub-items
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null)
    }, 150)
  }

  const handleSubMenuMouseEnter = () => {
    // Cancel timeout if mouse enters sub-menu
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const handleSubMenuMouseLeave = () => {
    setHoveredItem(null)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          const hasSubItems = item.items && item.items.length > 0
          const isHovered = hoveredItem === item.title
          
          if (!hasSubItems) {
            // Simple item without sub-items
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Item with sub-items - expand inline on hover
          return (
            <React.Fragment key={item.title}>
              {item.isSeparated && index > 0 && (
                <div className="mt-4 mb-2" />
              )}
              <SidebarMenuItem
                onMouseEnter={() => handleMouseEnter(item.title)}
                onMouseLeave={handleMouseLeave}
                className="group/menu-item"
              >
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className={cn(
                    "ml-auto transition-transform duration-200",
                    isHovered && "rotate-90"
                  )} />
                </SidebarMenuButton>
                {/* Inline sub-menu that expands on hover */}
                {isHovered && item.items && (
                  <SidebarMenuSub
                    onMouseEnter={handleSubMenuMouseEnter}
                    onMouseLeave={handleSubMenuMouseLeave}
                  >
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </React.Fragment>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
