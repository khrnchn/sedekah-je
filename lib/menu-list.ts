import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname.includes("/dashboard"),
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "",
          label: "Institutions",
          active: pathname.includes("/dashboard/institutions"),
          icon: SquarePen,
          submenus: [
            {
              href: "/dashboard/institutions",
              label: "All Institutions",
              active: pathname === "/dashboard/institutions"
            },
            {
              href: "/dashboard/institutions/create",
              label: "New Institution",
              active: pathname === "/dashboard/institutions/create"
            }
          ]
        },
        {
          href: "/dashboard/categories",
          label: "Categories",
          active: pathname.includes("/dashboard/categories"),
          icon: Bookmark,
          submenus: []
        },
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/dashboard/users",
          label: "Users",
          active: pathname.includes("/dashboard/users"),
          icon: Users,
          submenus: []
        },
        {
          href: "/dashboard/account",
          label: "Account",
          active: pathname.includes("/dashboard/account"),
          icon: Settings,
          submenus: []
        }
      ]
    }
  ];
}
