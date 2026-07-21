"use client";
// 1. นำเข้าคอมโพเนนต์สำหรับลิงก์ข้ามหน้า
import Link from "next/link";

// 2. นำเข้าไอคอนทั้งหมดที่จำเป็นต้องใช้ในหน้านี้ (เพิ่ม ExternalLink และ Sparkles สำหรับโปรเจกต์ Push Girl)
import {
  UserPlus,
  Users,
  LayoutGrid,
  Layers,
  Settings,
  ChevronRight,
  Banknote,
  ClipboardList,
  CalendarDays,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardHome() {
  return (
    <div className="min-h-screen bg-orange-300 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        {/* หัวหน้าเว็บภาพรวม */}
        <header className="mb-12 flex items-center justify-between text-left">
          <div>
            <span className="text-xs font-extrabold text-white tracking-wider bg-blue-700 px-3 py-1.5 rounded-full uppercase">
              System Control Panel
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-3">
              FMBD Admin Tools
            </h1>
            <p className="text-red-600 mt-1.5">
              ศูนย์ควบคุมและบริหารจัดการทุกระบบงานภายในเครือข่าย
            </p>
          </div>
          <div className="p-3 bg-white rounded-2xl border shadow-xs text-slate-400 hover:text-slate-600 cursor-pointer transition">
            <Settings size={22} />
          </div>
        </header>

        {/* ตารางเมนูฟังก์ชันงานของระบบ */}
        <div className="text-left">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutGrid size={16} /> Available Modules & Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 🔴 ปุ่มที่ 1 (ใหม่): RVI PUSH GIRL PROJECTS */}
            <a
              href="https://fmbd-push-girl-tools.vercel.app/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-rose-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between col-span-1 md:col-span-2 bg-gradient-to-r from-white via-white to-rose-50/30"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 transition-transform group-hover:scale-105">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                      RVI PUSH GIRL PROJECTS
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                      EXTERNAL APP
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ศูนย์ควบคุมพนักงาน PG: การลงเวลา, สรุปเงินเดือน/ค่าแรงรายวัน
                    และระบบจัดการ Target รายสาขา
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-rose-500 transition-colors pl-4 flex items-center gap-1 font-bold text-xs">
                <span>เปิดแอป</span>
                <ExternalLink size={18} />
              </div>
            </a>

            {/* ปุ่มที่ 2: หน้า Create User */}
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

            {/* ปุ่มที่ 3: หน้า User Database & Control */}
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

            {/* ปุ่มที่ 4: หน้าเอกสารใบปะหน้าค่าใช้จ่าย (Payroll Summary) */}
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

            {/* ปุ่มที่ 5: หน้าตรวจสอบเอกสารงานและโอทีพนักงาน (Call Visit Report) */}
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

            {/* ปุ่มที่ 6: หน้าอัปโหลด Work Plan ประจำสัปดาห์ */}
            <Link
              href="/work-plan"
              className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-md shadow-slate-200/40 hover:shadow-xl hover:border-sky-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 transition-transform group-hover:scale-105">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Bulk Work Plan Importer
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    อัปโหลดไฟล์แผนงานปฏิบัติงานหลักพนักงาน (.csv)
                    เพื่อกระจายข้อมูลตารางงานให้คู่ค้า
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-sky-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
