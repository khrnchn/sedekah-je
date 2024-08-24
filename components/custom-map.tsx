"use client"

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomMap({ location, zoom = 19, name }: { location?: number[], zoom?: number, name?: string }) {
    const Map = useMemo(() =>
        dynamic(() => import("@/components/map"), {
            loading: () => (
                <Card className="min-h-[240px] md:min-h-[240px] md:min-w-[965px]">
                    <Skeleton className="min-h-full min-w-full flex items-center justify-center">
                        <CardContent className="italic">
                            Peta sedang dinampan...
                        </CardContent>
                    </Skeleton>
                </Card>
            ),
            ssr: false,
        }),
        [],
    );

    if (!location && !name) {
        <Map />
    }

    return (
        <Map center={location} zoom={16} marker={{ name: name!, coords: location! }} />
    )
}