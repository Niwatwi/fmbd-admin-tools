"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ArrowLeft,
  Save,
  Camera,
  Upload,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // States สำหรับระเบียบข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    customer_id: "",
    area: "",
    username: "",
    password_text: "",
    display_name: "",
    company_tag: "",
    email: "",
    phone: "",
    employee_id: "",
    employment_type: "",
    base_salary: "",
    is_active: true,
  });

  // States สำหรับระบบจัดการรูปภาพ
  const [imageFile, setImageFile] = useState<File | Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Refs สำหรับจับ Element กล้อง
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. ฟังก์ชันเปิดกล้องถ่ายภาพ
  const startCamera = async () => {
    setIsCameraActive(true);
    setImagePreview(null);
    setImageFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // ใช้ facingMode: "environment" ถ้าต้องการกล้องหลัง
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("ไม่สามารถเปิดกล้องได้:", err);
      alert("ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ กรุณาตรวจสอบสิทธิ์การอนุญาต");
      setIsCameraActive(false);
    }
  };

  // 2. ฟังก์ชันกดแชะ! ถ่ายภาพ
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // ตั้งค่าขนาดกว้างยาวของภาพตามสัดส่วนวิดีโอจริง
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        // วาดภาพจากวิดีโอลงใน Canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // แปลงภาพจาก Canvas เป็น Blob (Binary Large Object) เพื่อเตรียมอัพโหลด (ไม่ใช่ Base64)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setImageFile(blob);
              setImagePreview(URL.createObjectURL(blob)); // แสดงภาพพรีวิวบนหน้าจอ
              stopCamera();
            }
          },
          "image/jpeg",
          0.85,
        );
      }
    }
  };

  // 3. ฟังก์ชันปิดกล้อง
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // 4. ฟังก์ชันกรณีเลือกอัพโหลดรูปภาพจากคลังภาพ/เครื่องคอมพิวเตอร์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 5. ล้างรูปภาพที่เลือก
  const clearImage = () => {
    stopCamera();
    setImageFile(null);
    setImagePreview(null);
  };

  // 6. ฟังก์ชันเมื่อกดบันทึกข้อมูลพนักงานเข้าสู่ระบบ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = "";

      // ตรวจเช็คว่ามีการถ่ายรูปหรือเลือกรูปภาพไว้ไหม ถ้ามีให้ทำงานส่งเข้า Storage ก่อน
      if (imageFile) {
        // สร้างชื่อไฟล์แบบไม่ซ้ำกันป้องกันการทับซ้อน
        const fileExtension =
          imageFile instanceof File ? imageFile.name.split(".").pop() : "jpg";
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `profiles/${fileName}`;

        // ทำการ Upload ไปยัง Bucket ชื่อ 'avatars'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // ดึงลิงก์ Public URL ตรงมาจากฐานข้อมูลของไฟล์ที่เพิ่งอัพโหลดเสร็จ
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        finalImageUrl = publicUrl; // ตัวแปรนี้จะได้ค่าเป็นพวก https://... เท่านั้น ไม่ใช่ Base64
      }

      // นำชุดข้อมูลพร้อมลิงก์ภาพ URL ไปฝังลงในตารางหลัก user_profiles
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert([
          {
            ...formData,
            image_url: finalImageUrl, // เก็บในแบบ URL
          },
        ]);

      if (insertError) throw insertError;

      alert("บันทึกข้อมูลพนักงานและอัปโหลดรูปภาพสำเร็จ!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header แผงควบคุมด้านบน */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
              <UserPlus size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Create New User
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                เพิ่มข้อมูลพนักงานพร้อมระบุรูปภาพโปรไฟล์เข้าระบบกลาง
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-8"
        >
          {/* ส่วนการจัดการรูปภาพโปรไฟล์ (เปิดกล้อง / อัพโหลด) */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
              Employee Avatar Image
            </h2>

            <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
              {/* แสดงตัวแสดงผลสตรีมมิ่งกล้องสด */}
              {isCameraActive && (
                <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      <Camera size={14} /> กดถ่ายรูปภาพ
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      <X size={14} /> ปิดกล้อง
                    </button>
                  </div>
                </div>
              )}

              {/* ซ่อน Canvas ไว้ทำงานเบื้องหลังสำหรับการแปลงภาพ */}
              <canvas ref={canvasRef} className="hidden" />

              {/* แสดงผลตัวพรีวิวรูปภาพที่พร้อมถูกส่งไปเซิร์ฟเวอร์ */}
              {imagePreview && (
                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  >
                    <X size={18} /> ล้างรูปภาพ
                  </button>
                </div>
              )}

              {/* ปลอกปุ่มสั่งงานกรณีที่ยังไม่ได้เลือกรูปภาพใดๆ */}
              {!isCameraActive && !imagePreview && (
                <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-3">
                  <Camera size={32} />
                </div>
              )}

              {/* แผงควบคุมปุ่มเรียกใช้กล้อง/ไฟล์ภาพ */}
              {!isCameraActive && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <Camera size={14} />{" "}
                    {imagePreview ? "เปิดกล้องถ่ายใหม่" : "เปิดกล้องถ่ายภาพ"}
                  </button>

                  <label className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer transition flex items-center gap-1.5">
                    <Upload size={14} /> เลือกอัพโหลดไฟล์ภาพ
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: ข้อมูลบัญชีผู้ใช้งาน */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
              Account Authorization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Area (เขตพื้นที่)
                </label>
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                >
                  {[
                    "--- เลือกเขต ---",
                    "ADMIN",
                    "OFFICE",
                    "CUSTOMER",
                    "PG",
                    "PGTO01",
                    "PGBC01",
                    "PGBC02",
                    "PGBC03",
                    "PGBC04",
                    "PGBC05",
                    "PGBC06",
                    "PGBC07",
                    "PGBC08",
                    "PGBC09",
                    "PGBC10",
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
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Username (Area Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ระบุรหัสเขตพนักงาน"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Password Text
                </label>
                <input
                  type="text"
                  required
                  placeholder="กำหนดรหัสผ่านเข้าใช้งาน"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.password_text}
                  onChange={(e) =>
                    setFormData({ ...formData, password_text: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Email (สำหรับล็อกอิน)
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลส่วนตัวและตำแหน่ง */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
              Personal & Company Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Display Name (ชื่อพนักงาน)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ - นามสกุล"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Company Tag (เลือกหรือพิมพ์เองได้)
                </label>

                {/* ตัวเลือกหลักแบบ Dropdown */}
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  // ถ้าไม่ได้เลือกโหมดพิมพ์เอง ให้ใช้ค่าจาก formData แต่ถ้าเลือกโหมดพิมพ์เองให้ค้างค่าตัวเลือกไว้ที่พิมพ์เอง
                  value={
                    [
                      "ADMIN",
                      "CUSTOMER",
                      "OFFICE",
                      "KOE",
                      "MER",
                      "COMMANDO",
                      "BA",
                      "PG",
                      "PGTO01",
                      "PGBC01",
                      "PGBC02",
                      "PGBC03",
                      "PGBC04",
                      "PGBC05",
                      "PGBC06",
                      "PGBC07",
                      "PGBC08",
                      "PGBC09",
                      "PGBC10",
                    ].includes(formData.company_tag)
                      ? formData.company_tag
                      : "CUSTOM"
                  }
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      // ถ้าเลือก พิมพ์เอง ให้ล้างค่าช่องพิมพ์รอไว้
                      setFormData({ ...formData, company_tag: "" });
                    } else {
                      setFormData({ ...formData, company_tag: e.target.value });
                    }
                  }}
                >
                  {[
                    "ADMIN",
                    "CUSTOMER",
                    "OFFICE",
                    "KOE",
                    "MER",
                    "COMMANDO",
                    "BA",
                    "PG",
                    "PGTO01",
                    "PGBC01",
                    "PGBC02",
                    "PGBC03",
                    "PGBC04",
                    "PGBC05",
                    "PGBC06",
                    "PGBC07",
                    "PGBC08",
                    "PGBC09",
                    "PGBC10",
                  ].map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ อื่นๆ (พิมพ์ระบุเอง...)</option>
                </select>

                {/* ช่องพิมพ์จะปรากฏขึ้นมาอัตโนมัติเมื่อกดเลือก "อื่นๆ (พิมพ์ระบุเอง...)" */}
                {![
                  "ADMIN",
                  "CUSTOMER",
                  "OFFICE",
                  "KOE",
                  "MER",
                  "COMMANDO",
                  "BA",
                  "PG",
                  "PGTO01",
                  "PGBC01",
                  "PGBC02",
                  "PGBC03",
                  "PGBC04",
                  "PGBC05",
                  "PGBC06",
                  "PGBC07",
                  "PGBC08",
                  "PGBC09",
                  "PGBC10",
                ].includes(formData.company_tag) && (
                  <input
                    type="text"
                    required
                    placeholder="กรุณาพิมพ์ระบุแท็กใหม่ที่นี่"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition mt-3 animate-fadeIn"
                    value={formData.company_tag}
                    onChange={(e) =>
                      setFormData({ ...formData, company_tag: e.target.value })
                    }
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Customer ID (กรณีเป็นลูกค้า)
                </label>
                <input
                  type="text"
                  placeholder="ระบุรหัสลูกค้า (ถ้ามี)"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_id: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Phone (เบอร์โทรติดต่อ)
                </label>
                <input
                  type="text"
                  placeholder="ระบุเบอร์โทรศัพท์"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: ข้อมูลการเงินและการจ้างงาน */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
              Employment & Wages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  placeholder="รหัสพนักงาน"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  ประเภทการจ้าง
                </label>
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment_type: e.target.value,
                    })
                  }
                >
                  <option value="รายวัน">รายวัน</option>
                  <option value="รายเดือน">รายเดือน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Base Salary (ค่าแรง)
                </label>
                <input
                  type="text"
                  placeholder="ระบุฐานเงินเดือน/ค่าแรง"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.base_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, base_salary: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* ปุ่มส่งคำขอบันทึก */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-950 text-white font-bold rounded-2xl hover:bg-slate-800 active:scale-[0.99] focus:ring-4 focus:ring-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  กำลังจัดเก็บรูปภาพและบันทึกฐานข้อมูลข้อมูล...
                </>
              ) : (
                <>
                  <Save size={20} />
                  บันทึกข้อมูลและเปิดสิทธิ์การใช้งาน (Active)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
