import localFont from "next/font/local";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const sarabun = localFont({
  src: [
    { path: "./fonts/Sarabun-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Sarabun-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Sarabun-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata = {
  title: "RiverSafe · เฝ้าระวังสารหนูแม่น้ำกก",
  description: "ต้นแบบเว็บแอป: แผนที่แม่น้ำ แชต AI และข่าวสรุป เรื่องสารหนูในแม่น้ำกก สาย รวก และโขง",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
      </body>
    </html>
  );
}
