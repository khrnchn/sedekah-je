"use client"

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  SquareTerminal
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "khairin",
    email: "khairin13chan@gmail.com",
    avatar: "/masjid.svg",
  },
  teams: [
    {
      name: "SedekahJe",
      logo: GalleryVerticalEnd,
      plan: "Admin",
    },
    {
      name: "Admins",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Public",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Institutions",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Mosque",
          url: "#",
        },
        {
          title: "Surau",
          url: "#",
        },
        {
          title: "Others",
          url: "#",
        },
      ],
    },
    {
      title: "Categories",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "View all categories",
          url: "#",
        },
        {
          title: "Create category",
          url: "#",
        },
      ],
    },
    {
      title: "Leaderboard",
      url: "#",
      icon: BookOpen,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
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
