import React from "react";
import { CardTitle } from "@/components/ui/card";
import { Clock, Calendar, UserCircle } from "lucide-react";

export const Hello = () => {
  const getGreeting = () => {
    const hour = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "numeric",
      hour12: false,
    });
    const hourInt = parseInt(hour, 10);
    if (hourInt < 12) return "Good morning";
    if (hourInt < 17) return "Good afternoon";
    return "Good evening";
  };

  const getDateDisplay = () => {
    return new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTimeDisplay = () => {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="pb-2">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left">
          <CardTitle className="text-2xl font-bold">
            {getGreeting()}, {"Khairin"}
          </CardTitle>
          <div className="flex flex-col md:flex-row items-center mt-2 text-sm text-muted-foreground">
            <div className="flex items-center mb-1 md:mb-0">
              <Clock className="w-4 h-4 mr-2" />
              <span>{getTimeDisplay()}</span>
            </div>
            <div className="flex items-center mb-1 md:mb-0 md:ml-4">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{getDateDisplay()}</span>
            </div>
            <div className="flex items-center md:ml-4">
              <UserCircle className="w-4 h-4 mr-2" />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
