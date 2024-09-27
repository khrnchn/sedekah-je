import { Header } from "@/components/ui/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
      {children}
    </>
  );
}
