import Link from "next/link";
import Image from "next/image";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { ModeToggle } from "../ui/mode-toggle";

export function CompanyHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <div className="flex flex-row justify-between">
            <div>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  <Image
                    src={"/masjid.svg"}
                    alt="company-logo"
                    width={32}
                    height={32}
                  />
                </div>
              </Link>
            </div>

            <div className="flex flex-col items-end">
              <ModeToggle />
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
