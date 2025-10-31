"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  ShoppingBag,
  Sparkles,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Learn",
      url: "/dashboard/learn",
      icon: BookOpen,
    },
    {
      title: "Flashcards",
      url: "/dashboard/flashcards",
      icon: Sparkles,
      items: [
        {
          title: "Review",
          url: "/dashboard/flashcards/review",
        },
        {
          title: "Create",
          url: "/dashboard/flashcards/create",
        },
        {
          title: "Saved",
          url: "/dashboard/flashcards/saved",
        },
        {
          title: "Statistics",
          url: "/dashboard/flashcards/statistics",
        },
      ],
    },
    {
      title: "Shop",
      url: "/dashboard/shop",
      icon: ShoppingBag,
    },
    {
      title: "AI Unlimited",
      url: "/dashboard/ai-unlimited",
      icon: Bot,
      isSeparated: true,
      items: [
        {
          title: "AI Chatbot",
          url: "/dashboard/ai-unlimited/chatbot",
        },
        {
          title: "AI Voice chat",
          url: "/dashboard/ai-unlimited/voice-chat",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
