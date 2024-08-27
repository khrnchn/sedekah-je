import Link from "next/link";

export const Header = () => (
  <header className="text-center py-8">
    <Link href="/">
      <h1 className="text-3xl font-bold mb-2 text-green-600">SedekahJe</h1>
    </Link>
    <p className="text-lg mb-2">
      Senarai QR masjid/surau/institusi yang dikumpulkan oleh netizen di{" "}
      <Link href={"https://x.com"}>𝕏</Link>.
    </p>
  </header>
);
