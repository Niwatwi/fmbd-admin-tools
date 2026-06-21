"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// เปลี่ยนจาก import เดิม เป็นบรรทัดนี้ครับ
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // สร้าง supabase client สำหรับฝั่ง Client (Browser)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login พลาด: " + error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-8">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
