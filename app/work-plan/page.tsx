/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import {
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface ActualWorkPlan {
  employee_type: string;
  area: string;
  area_code: string;
  full_name: string;
  tel: string;
  plan_date: string;
  time_in: string;
  time_out: string;
  store_code: string;
  store_name: string;
  province: string;
  store_loxley: string;
  store_kewpie: string;
  store_focus_kewpie: string;
}

export default function ActualWorkPlanImport() {
  const [plans, setPlans] = useState<ActualWorkPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      const result: ActualWorkPlan[] = [];

      // เริ่มอ่านแถวที่ 2 เป็นต้นไป (ข้ามหัวข้อ Header ตาราง)
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;

        const cols = currentLine.split(",");

        // 🟢 ⚡ ปรับปรุงตามไฟล์ใหม่ที่มีจำนวน 26 คอลัมน์ (Index 0 ถึง 25)
        if (cols.length >= 25) {
          const rawYear = cols[7]?.trim();
          const rawMonth = cols[8]?.trim();
          const rawDate = cols[9]?.trim();

          // ดักกรองแถวว่างท้ายไฟล์ Excel
          if (
            !rawYear ||
            !rawMonth ||
            !rawDate ||
            isNaN(Number(rawYear)) ||
            isNaN(Number(rawMonth)) ||
            isNaN(Number(rawDate))
          ) {
            continue;
          }

          // รวมร่างวันที่เป็นฟอร์แมต YYYY-MM-DD
          const month = rawMonth.padStart(2, "0");
          const date = rawDate.padStart(2, "0");
          const formattedDate = `${rawYear}-${month}-${date}`;

          result.push({
            employee_type: cols[0]?.trim() || "",
            area: cols[1]?.trim() || "",
            area_code: cols[2]?.trim() || "",
            full_name: cols[4]?.trim() || "",
            tel: cols[5]?.trim() || "",
            plan_date: formattedDate,
            time_in: cols[12]?.trim() || "", // 🟢 ปรับดัชนีเป็นช่อง Plan In (คอลัมน์ 13 ใน Excel)
            time_out: cols[13]?.trim() || "", // 🟢 ปรับดัชนีเป็นช่อง Plan Out (คอลัมน์ 14 ใน Excel)
            store_code: cols[18]?.trim() || "", // Store Code BI
            store_name: cols[19]?.trim() || "", // Store Name
            province: cols[20]?.trim() || "", // Province
            store_loxley: cols[23]?.trim() || "", // 🟢 ปรับดัชนีค่าย Loxley มาอยู่ที่คอลัมน์ 24
            store_kewpie: cols[24]?.trim() || "", // 🟢 ปรับดัชนีค่าย Kewpie มาอยู่ที่คอลัมน์ 25
            store_focus_kewpie: cols[25]?.trim() || "", // 🟢 ปรับดัชนีค่าย Focus Kewpie มาอยู่ที่คอลัมน์ 26
          });
        }
      }
      setPlans(result);
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleUploadToSupabase = async () => {
    if (plans.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("actual_work_plans").insert(plans);
      if (error) throw error;

      Swal.fire({
        title: "อัปโหลดสำเร็จ!",
        text: `ระบบทำการซิงค์ตารางแผนงานเวอร์ชันใหม่จำนวน ${plans.length} แถวเรียบร้อยครับ`,
        icon: "success",
      });

      setPlans([]);
      setFileName("");
    } catch (err: any) {
      console.error("Upload failure:", err.message);
      Swal.fire(
        "บันทึกไม่สำเร็จ",
        "กรุณาตรวจสอบโครงสร้างตารางหลังบ้านใน Supabase อีกครั้งครับ",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen text-slate-800 text-left font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={20} />
            ระบบประมวลผลผู้นำเข้าแผนปฏิบัติงานพนักงาน (PC / MER / BA Plan
            Importer)
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            เครื่องมืออ่านและจำแนกแผนการวิ่งสาขาจากระบบกลางออโต้เพื่อกระจายตารางงานไปให้ลูกค้ารายค่ายตรวจสอบ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col items-center justify-center text-center relative hover:bg-slate-100/50 transition-all">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">
              {fileName
                ? `ไฟล์ที่เลือก: ${fileName}`
                : "เลือกไฟล์ตารางแผนงานหลักของบริษัท สกุล .csv ที่นี่"}
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div>
            <button
              onClick={handleUploadToSupabase}
              disabled={loading || plans.length === 0}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              ยิงแผนงานขึ้นระบบกลางอนุมัติ
            </button>
          </div>
        </div>

        {plans.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
              <span className="flex items-center gap-1">
                <AlertTriangle size={14} />{" "}
                ตรวจสอบความถูกต้องของโครงสร้างตารางใหม่ด้านล่างนี้ก่อนกดยืนยันครับพี่นิวัต
              </span>
              <span>จำนวนรวม {plans.length} รายการ</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300 max-h-80 overflow-y-auto">
              <table className="w-full border-collapse text-[10px] text-slate-900 bg-white">
                <thead className="sticky top-0 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-center">
                  <tr>
                    <th className="p-2 w-12">สายงาน</th>
                    <th className="p-2 w-10">เขต</th>
                    <th className="p-2 w-16">Area Code</th>
                    <th className="p-2 text-left">ชื่อ-นามสกุลพนักงาน</th>
                    <th className="p-2 font-mono">วันที่ปะหน้า</th>
                    <th className="p-2">เวลาปฏิบัติงาน</th>
                    <th className="p-2 text-left">รหัสสาขาและชื่อสถานที่</th>
                    <th className="p-2">Loxley</th>
                    <th className="p-2">Kewpie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {plans.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="p-2 text-center font-bold text-slate-500">
                        {row.employee_type}
                      </td>
                      <td className="p-2 text-center font-mono">{row.area}</td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-600">
                        {row.area_code}
                      </td>
                      <td className="p-2 text-left font-bold text-slate-950">
                        {row.full_name}
                      </td>
                      <td className="p-2 text-center font-mono text-blue-700 font-bold">
                        {row.plan_date}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-600">
                        {row.time_in} - {row.time_out}
                      </td>
                      <td className="p-2 text-left">
                        <span className="font-mono text-slate-400 mr-1">
                          [{row.store_code}]
                        </span>
                        <b className="text-slate-800">{row.store_name}</b> (
                        {row.province})
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500">
                        {row.store_loxley || "-"}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500">
                        {row.store_kewpie || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
