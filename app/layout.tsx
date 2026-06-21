import "./globals.css"; // ต้องอยู่บรรทัดบนสุดครับ
import Navbar from "../components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">
        {/* นี่คือส่วนจัดการโครงสร้างหลัก */}
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
