'use client'

import { Card, CardContent } from "@/components/ui/card"
import Lottie from "lottie-react"
import mosqueAnimation from '@/lottie/mosque-animation.json'

export default function ComingSoon() {
    return (
        <Card className="flex flex-col items-center justify-center p-6 min-h-[50vh] md:min-h-[40vh]">
            <CardContent className="flex flex-col items-center text-center">
                <div className="w-64 h-auto mb-4">
                    <Lottie
                        animationData={mosqueAnimation}
                        loop={true}
                        aria-hidden="true"
                    />
                </div>
                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                <p className="text-muted-foreground">
                    We're working on something exciting! Check back later for updates.
                </p>
            </CardContent>
        </Card>
    )
}