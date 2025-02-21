'use client'

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Moon, Sun, Clock, Calendar } from 'lucide-react'

const RamadanCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isRamadan, setIsRamadan] = useState(false)

  useEffect(() => {
    const ramadanStartDate = new Date("March 2, 2025 00:00:00").getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const timeDifference = ramadanStartDate - now

      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
        const hours = Math.floor(
          (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        )
        const minutes = Math.floor(
          (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
        )
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000)

        setTimeRemaining({ days, hours, minutes, seconds })
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsRamadan(true)
      }
    }

    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-800 text-white shadow-lg p-4 sm:p-6">
      <div className="absolute inset-0 opacity-30 ramadhan-bg">
      </div>
      <CardHeader className="relative p-2 sm:p-6">
        <CardTitle className="flex items-center justify-center gap-2 text-center text-lg sm:text-3xl font-bold">
          <Moon className="h-5 w-5 sm:h-8 sm:w-8" />
          <span>Ramadhan Berbaki Lagi</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-col items-center gap-2 sm:gap-6 p-2 sm:p-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "Hari", value: timeRemaining.days, icon: Calendar },
            { label: "Jam", value: timeRemaining.hours, icon: Clock },
            { label: "Minit", value: timeRemaining.minutes, icon: Clock },
            { label: "Saat", value: timeRemaining.seconds, icon: Clock },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="mb-1 sm:mb-2 rounded-full bg-white/20 p-1.5 sm:p-3">
                <item.icon className="h-3 w-3 sm:h-6 sm:w-6" />
              </div>
              <span className="text-lg sm:text-3xl font-bold">{item.value}</span>
              <span className="text-[10px] sm:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
        {/* <div className="mt-1 sm:mt-4 text-center text-sm sm:text-lg font-semibold">
          {isRamadan ? "Selamat Menyambut Bulan Ramadhan" : "Menuju Bulan Ramadhan"}
        </div> */}
      </CardContent>
    </Card>
  )
}

const Star = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
)

export default RamadanCountdown

