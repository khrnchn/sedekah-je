import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const FAQ = () => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-gradient-to-br from-blue-500 to-blue-300 border border-blue-400 rounded-full hover:from-blue-700 hover:to-blue-500 transition-colors duration-300"
                >
                    <HelpCircle className="h-5 w-5" />
                    <span className="hidden sm:inline ml-2">Soalan Lazim</span>
                    <span className="sm:hidden">FAQ</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Soalan Lazim</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
                    <div>
                        <h3 className="font-semibold">Saya ada beberapa QR. Bagaimana cara untuk saya menyumbang?</h3>
                        <p className="mt-2">Anda boleh menekan butang Muatnaik QR di bahagian bawah laman web.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Adakah platform ini mempunyai kaitan dengan mana-mana organisasi atau pihak ketiga?</h3>
                        <p className="mt-2">Tidak, platform ini sepenuhnya bebas dan merupakan sebuah projek sumber terbuka. Ia tidak mempunyai kaitan dengan mana-mana organisasi, perniagaan, atau individu.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Bagaimana saya tahu derma saya terus sampai kepada penerima yang dimaksudkan?</h3>
                        <p className="mt-2">Kod QR yang disediakan adalah untuk derma secara langsung. Tiada perantara, dan 100% derma akan sampai kepada penerima yang dimaksudkan.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Adakah platform ini mengambil sebarang yuran atau komisen daripada derma?</h3>
                        <p className="mt-2">Tidak, kami tidak mengambil sebarang yuran atau komisen.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Adakah selamat untuk membuat derma melalui platform ini?</h3>
                        <p className="mt-2">Ya, platform ini hanya menyediakan senarai QR. Kod QR ditapis dan disahkan sebelum diterbitkan di laman web.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Siapakah yang menguruskan platform ini?</h3>
                        <p className="mt-2">Platform ini dikendalikan oleh komuniti tech yang kebanyakannya dari X. Anda boleh melihat senarai penyumbang di <a href="https://github.com/khrnchn/sedekah-je/graphs/contributors" className="text-blue-500 hover:underline">sini</a>.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Apa yang perlu saya lakukan jika terdapat isu dengan derma atau kod QR?</h3>
                        <p className="mt-2">Anda boleh menghubungi <a href="mailto:khrnchnv@gmail.com" className="text-blue-500 hover:underline">khairin</a> untuk melaporkan sebarang isu atau kemukakan cadangan.</p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default FAQ