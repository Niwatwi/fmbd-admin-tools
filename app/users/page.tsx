"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: number;
  display_name: string;
  username: string;
  email: string;
  area: string;
  company_tag: string;
  employment_type: string;
  image_url: string;
  is_active: boolean;
}

export default function UserListPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");

  // 1. ดึงข้อมูลพนักงานทั้งหมดจาก Supabase
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("ดึงข้อมูลไม่สำเร็จ: " + error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. ฟังก์ชันเปิด-ปิด สถานะพนักงาน (Toggle Active)
  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      alert("อัปเดตสถานะไม่สำเร็จ: " + error.message);
    } else {
      // อัปเดต State ในหน้าจอทันที ไม่ต้องโหลดหน้าใหม่
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, is_active: !currentStatus } : u,
        ),
      );
    }
  };

  // 3. ฟังก์ชันลบพนักงานออกจากระบบ
  const deleteUser = async (id: number, name: string) => {
    if (confirm(`คุณแน่ใจใช่ไหมที่จะลบข้อมูลของ "${name}" ออกจากระบบถาวร?`)) {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", id);

      if (error) {
        alert("ลบข้อมูลไม่สำเร็จ: " + error.message);
      } else {
        setUsers(users.filter((u) => u.id !== id));
        alert("ลบข้อมูลเรียบร้อยแล้ว");
      }
    }
  };

  // 4. การกรองข้อมูล (Filter & Search Logic)
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === "ALL" || user.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* ส่วนหัวของหน้าจอ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              User Database
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              ตรวจสอบ ควบคุมสถานะ และจัดการรายชื่อข้อมูลพนักงานทั้งหมดในระบบ
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchUsers}
              className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:text-slate-900 transition"
            >
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* แผงควบคุมการค้นหาและกรอง (Search & Filters Bar) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3.5 top-3.5 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ หรือ Area Code..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48 relative">
            <Filter
              className="absolute left-3.5 top-3.5 text-slate-400"
              size={16}
            />
            <select
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-700 transition appearance-none"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="ALL">ทุกพื้นที่ (All Areas)</option>
              {[
                "ADMIN",
                "OFFICE",
                "CUSTOMER",
                "BGTO01",
                "BGBC01",
                "BGBC02",
                "BGBC03",
                "BGBC04",
                "BGBC05",
                "BGBC06",
                "BGBC07",
                "BGBC08",
                "BGBC09",
                "BGBC10",
                "K01",
                "K02",
                "K03",
                "K04",
                "K05",
                "K06",
                "K07",
                "K08",
                "K09",
                "K10",
              ].map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ตารางรายชื่อพนักงาน (Responsive Table Component) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={28} />
              กำลังโหลดข้อมูลจากฐานข้อมูล...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium">
              ❌ ไม่พบข้อมูลรายชื่อพนักงานที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">พนักงาน (Avatar & Profile)</th>
                    <th className="py-4 px-6">Area / Username</th>
                    <th className="py-4 px-6">ประเภท / สังกัด</th>
                    <th className="py-4 px-6 text-center">สถานะใช้งาน</th>
                    <th className="py-4 px-6 text-center">จัดการข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* ข้อมูลรูปและชื่อ */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-slate-100 border overflow-hidden flex-shrink-0">
                          {user.image_url ? (
                            <img
                              src={user.image_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-200">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {user.display_name}
                          </div>
                          <div className="text-slate-400 text-xs font-normal mt-0.5">
                            {user.email}
                          </div>
                        </div>
                      </td>

                      {/* พื้นที่และรหัส */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                          {user.area}
                        </span>
                        <div className="text-slate-400 text-xs mt-1">
                          Code: {user.username}
                        </div>
                      </td>

                      {/* สังกัดบริษัท */}
                      <td className="py-4 px-6">
                        <div className="text-slate-900 font-semibold">
                          {user.company_tag}
                        </div>
                        <div className="text-slate-400 text-xs font-normal mt-0.5">
                          {user.employment_type}
                        </div>
                      </td>

                      {/* สวิตช์สลับสถานะเปิด-ปิด */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleStatus(user.id, user.is_active)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                            user.is_active
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          }`}
                        >
                          {user.is_active ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserX size={14} />
                          )}
                          {user.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* ปุ่มกดแก้ไข และ ลบข้อมูล */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* ปุ่มแก้ไข (วิ่งไปหน้า Edit ตาม ID พนักงาน) */}
                          <Link
                            href={`/users/edit/${user.id}`}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex"
                          >
                            <Pencil size={16} />
                          </Link>

                          {/* ปุ่มลบเดิม */}
                          <button
                            onClick={() =>
                              deleteUser(user.id, user.display_name)
                            }
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors inline-flex"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
