"use client"

import dynamic from 'next/dynamic'
import { Fragment, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapMarker } from '@/components/map';

export default function CustomMap({ showAll, marker }: { showAll?: boolean, marker?: MapMarker }) {
    const LeafletMap = useMemo(() =>
        dynamic(() => import("@/components/map"), {
            loading: () => (
                <Card className="min-h-[240px] h-[240px] md:min-h-[240px] md:min-w-[965px]">
                    <Skeleton className="min-h-full min-w-full flex items-center justify-center">
                        <CardContent className="italic text-black/50 dark:text-white/50">
                            Peta sedang dinampan...
                        </CardContent>
                    </Skeleton>
                </Card>
            ),
            ssr: false,
        }),
        [],
    );

    if (showAll) {
        return <LeafletMap />
    }

    if (!marker) {
        return <Fragment />
    }    

    return (
        <LeafletMap center={marker.coords} zoom={16} marker={marker} />
    )
}