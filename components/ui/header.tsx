import Link from "next/link";

export const Header = () => (
  <div className="text-center">
    <h2 className="text-3xl font-bold mb-2 text-green-600">SedekahJe</h2>
    <p className="text-lg">
      Senarai QR masjid/surau/institusi yang dikumpulkan oleh netizen di <Link href={"https://x.com"}>𝕏</Link>.
    </p>
  </div>
);
