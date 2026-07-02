"use client";
// 1. นำเข้าคอมโพเนนต์สำหรับลิงก์ข้ามหน้า
import Link from "next/link";

// 2. นำเข้าไอคอนทั้งหมดที่จำเป็นต้องใช้ในหน้านี้ (เพิ่ม ClipboardList สำหรับระบบคัดกรองรายงาน)
import {
  UserPlus,
  Users,
  LayoutGrid,
  Layers,
  Settings,
  ChevronRight,
  Banknote,
  ClipboardList,
} from "lucide-react";

export default function AdminDashboardHome() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        {/* หัวหน้าเว็บภาพรวม */}
        <header className="mb-12 flex items-center justify-between text-left">
          <div>
            <span className="text-xs font-extrabold text-blue-600 tracking-wider bg-blue-50 px-3 py-1.5 rounded-full uppercase">
              System Control Panel
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-3">
              FMBD Admin Tools
            </h1>
            <p className="text-slate-500 mt-1.5">
              ศูนย์ควบคุมและบริหารจัดการทุกระบบงานภายในเครือข่าย
            </p>
          </div>
          <div className="p-3 bg-white rounded-2xl border shadow-sm text-slate-400 hover:text-slate-600 cursor-pointer transition">
            <Settings size={22} />
          </div>
        </header>

        {/* ตารางเมนูฟังก์ชันงานของระบบ */}
        <div className="text-left">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutGrid size={16} /> Available Modules & Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ปุ่มที่ 1: หน้า Create User */}
            <Link
              href="/create-user"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Create New User
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ลงทะเบียน เพิ่มรายชื่อพนักงาน และจัดการตาราง user_profiles
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-blue-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 2: หน้า User Database & Control */}
            <Link
              href="/users"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 transition-transform group-hover:scale-105">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    User Database & Control
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ตรวจสอบรายชื่อพนักงานทั้งหมด ค้นหา กรองตามพื้นที่
                    และสลับเปิด/ปิดสถานะ
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-emerald-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 3: หน้าเอกสารใบปะหน้าค่าใช้จ่าย (Payroll Summary) */}
            <Link
              href="/payroll"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-orange-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 transition-transform group-hover:scale-105">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    Payroll & Expense Summary
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    จัดทำใบปะหน้าสรุปยอดค่าเดินทางพนักงานรายวัน
                    พร้อมระบบพิมพ์ออกกระดาษ
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-orange-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* 🟢 ปุ่มที่ 4 (เพิ่มใหม่): หน้าตรวจสอบเอกสารงานและโอทีพนักงาน (Call Visit Report) */}
            <Link
              href="/report"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-purple-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 transition-transform group-hover:scale-105">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Call Visit & Attendance Report
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ตรวจสอบการเข้าเยี่ยมสาขา เช็คพิกัด GPS รูปถ่าย
                    และอนุมัติค่าเดินทาง/โอทีรายวัน
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-purple-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ช่องสำหรับวางโปรเจกต์อื่นๆ เพิ่มเติมในอนาคต */}
            <div className="p-6 bg-white border border-slate-200/60 border-dashed rounded-3xl flex items-center gap-5 opacity-60 md:col-span-2">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-500">
                  Future Project Extensions
                </h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  ระบบเปรียบเทียบ Workplan (Plan vs Actual)
                  และส่วนขยายระบบงานอื่น ๆ ในอนาคต
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
