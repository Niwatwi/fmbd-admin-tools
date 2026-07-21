"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, LayoutDashboard, LogOut } from "lucide-react";
// Import จากตัวเชื่อมกลางของเรา
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-blue-600 border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="font-black text-white text-lg">FMBD ADMIN</h1>
          <div className="flex gap-4 text-sm font-bold text-white">
            <Link href="/" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/create-user" className="hover:text-white">
              Users
            </Link>
          </div>
        </div>

        {/* ตรงนี้คือปุ่ม Logout ครับ */}
        <button
          onClick={handleLogout} // <--- ต้องใส่ตัวนี้ให้ครบนะครับ
          className="text-white hover:text-red-600 transition-colors flex items-center gap-2"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </nav>
  );
}
