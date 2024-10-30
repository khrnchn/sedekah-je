import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <>
            <div className='flex flex-col items-center justify-center'>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    404 not found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                    looking lost? the mosque is right behind you. follow me{' '}
                    <Link href="/" className="relative inline-block group">
                        <span className="text-primary font-semibold transition-colors duration-200 group-hover:text-primary/80 ">
                            home
                        </span>
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100"></span>
                    </Link>
                </p>
                <Image
                    src="/man-getting-lost.png"
                    alt='A man looking lost on the way to the mosque.'
                    width={400}
                    height={400}
                />
            </div >
        </>
    )
}