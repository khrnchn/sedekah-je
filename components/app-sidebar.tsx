"use client"

import {
  Building2, 
  Users, 
  Trophy, 
  User, 
  HomeIcon, 
  ChurchIcon, 
  LandmarkIcon, 
  BuildingIcon, 
  ListIcon, 
  PlusCircleIcon,
  ClipboardList, 
} from 'lucide-react';
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
import { NavProjects } from './nav-projects';

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
      logo: Users,
      plan: "Admin",
    },
    {
      name: "Admins",
      logo: User,
      plan: "Startup",
    },
    {
      name: "Public",
      logo: Users,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Institutions",
      url: "/institutions",
      icon: Building2,
      isActive: true,
      items: [
        {
          title: "Mosque",
          url: "#",
          icon: ChurchIcon,
        },
        {
          title: "Surau",
          url: "#",
          icon: LandmarkIcon,
        },
        {
          title: "Others",
          url: "#",
          icon: BuildingIcon,
        },
      ],
    },
    {
      title: "Categories",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "View all categories",
          url: "#",
          icon: ListIcon,
        },
        {
          title: "Create category",
          url: "#",
          icon: PlusCircleIcon,
        },
      ],
    },
    {
      title: "Leaderboard",
      url: "#",
      icon: Trophy,
    },
  ],
};

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
