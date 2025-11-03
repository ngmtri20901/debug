"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  ShoppingBag,
  Sparkles,
} from "lucide-react"

import { NavMain } from "@/shared/components/layout/dashboard/nav-main"
import { NavUser } from "@/shared/components/layout/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/shared/components/ui/sidebar"

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
      url: "/learn",
      icon: BookOpen,
    },
    {
      title: "Flashcards",
      url: "/flashcards",
      icon: Sparkles,
      items: [
        {
          title: "Review",
          url: "/flashcards/review",
        },
        {
          title: "Create",
          url: "/flashcards/create",
        },
        {
          title: "Saved",
          url: "/flashcards/saved",
        },
        {
          title: "Statistics",
          url: "/flashcards/statistics",
        },
      ],
    },
    {
      title: "Shop",
      url: "/shop",
      icon: ShoppingBag,
    },
    {
      title: "AI Unlimited",
      url: "/ai/chat",
      icon: Bot,
      isSeparated: true,
      items: [
        {
          title: "AI Chatbot",
          url: "/ai/chat",
        },
        {
          title: "AI Voice chat",
          url: "/ai/voice",
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
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
