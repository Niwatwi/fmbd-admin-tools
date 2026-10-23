/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/lib/notifications";

interface PgStore {
  id: number;
  store_code: string;
  store_name: string;
  area: string;
  company_tag: string;
  is_active: boolean;
  created_at: string;
  mer_code: string | null;
  user: string | null;
  chanel: string | null;
  account: string | null;
  province: string | null;
  region: string | null;
  img_store: string | null;
  store_type: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface UserOption {
  username: string;
  display_name: string | null;
}

interface StoreForm {
  company_tag: string;
  is_active: boolean;
  mer_code: string;
  user: string;
}

interface StoreDirectoryEntry {
  id: number;
  area: string | null;
  chanel: string | null;
  account: string | null;
  store_name: string | null;
  store_code: string | null;
  province: string | null;
  region: string | null;
  img_store: string | null;
  store_type: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

const initialForm: StoreForm = {
  company_tag: "PG",
  is_active: true,
  mer_code: "",
  user: "",
};

export default function StoreSetupPage() {
  const [stores, setStores] = useState<PgStore[]>([]);
  const [storeDirectory, setStoreDirectory] = useState<StoreDirectoryEntry[]>(
    [],
  );
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedChanel, setSelectedChanel] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    const [pgStoresResult, directoryResult, usersResult] = await Promise.all([
      supabase
        .from("pg_stores")
        .select(
          "id, store_code, store_name, area, company_tag, is_active, created_at, mer_code, user, chanel, account, province, region, img_store, store_type, address, phone, latitude, longitude",
        )
        .order("id", { ascending: false }),
      supabase
        .from("stores")
        .select(
          "id, area, chanel, account, store_name, store_code, province, region, img_store, store_type, address, phone, latitude, longitude",
        )
        .order("area", { ascending: true }),
      supabase
        .from("user_profiles")
        .select("username, display_name")
        .order("display_name", { ascending: true }),
    ]);

    if (!usersResult.error) {
      setUserOptions((usersResult.data || []) as UserOption[]);
    }

    if (pgStoresResult.error) {
      await showError(
        "โหลดข้อมูลร้านค้าไม่สำเร็จ",
        pgStoresResult.error.message,
      );
    } else {
      setStores((pgStoresResult.data || []) as PgStore[]);
    }

    if (directoryResult.error) {
      await showError(
        "โหลดตัวเลือกร้านค้าไม่สำเร็จ",
        directoryResult.error.message,
      );
    } else {
      setStoreDirectory((directoryResult.data || []) as StoreDirectoryEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchStores();
  }, []);

  useEffect(() => {
    if (!storeImagePreview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(storeImagePreview);
  }, [storeImagePreview]);

  const areaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          storeDirectory
            .map((store) => store.area?.trim())
            .filter((area): area is string => Boolean(area)),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [storeDirectory],
  );

  const chanelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          storeDirectory
            .filter((store) => store.area === selectedArea)
            .map((store) => store.chanel?.trim())
            .filter((chanel): chanel is string => Boolean(chanel)),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [selectedArea, storeDirectory],
  );

  const accountOptions = useMemo(
    () =>
      Array.from(
        new Set(
          storeDirectory
            .filter(
              (store) =>
                store.area === selectedArea && store.chanel === selectedChanel,
            )
            .map((store) => store.account?.trim())
            .filter((account): account is string => Boolean(account)),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [selectedArea, selectedChanel, storeDirectory],
  );

  const availableStores = useMemo(
    () =>
      storeDirectory.filter(
        (store) =>
          store.area === selectedArea &&
          store.chanel === selectedChanel &&
          store.account === selectedAccount &&
          store.store_name &&
          store.store_code,
      ),
    [selectedAccount, selectedArea, selectedChanel, storeDirectory],
  );

  const selectedStore = availableStores.find(
    (store) => String(store.id) === selectedStoreId,
  );
  const editingStore = stores.find((store) => store.id === editingStoreId);

  const filteredStores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return stores;

    return stores.filter((store) =>
      [
        store.store_code,
        store.store_name,
        store.area,
        store.company_tag,
        store.user || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchTerm, stores]);

  const cancelEdit = () => {
    setEditingStoreId(null);
    setSelectedArea("");
    setSelectedChanel("");
    setSelectedAccount("");
    setSelectedStoreId("");
    setStoreImageFile(null);
    setStoreImagePreview(null);
    setForm(initialForm);
  };

  const beginEdit = (store: PgStore) => {
    const masterStore = storeDirectory.find(
      (entry) =>
        entry.store_code === store.store_code &&
        entry.store_name === store.store_name,
    );

    if (!masterStore?.area || !masterStore.chanel || !masterStore.account) {
      void showError(
        "ไม่พบข้อมูลร้านใน Master",
        "ไม่สามารถจับคู่ร้านนี้กับข้อมูลในตาราง stores ได้",
      );
      return;
    }

    setEditingStoreId(store.id);
    setSelectedArea(masterStore.area);
    setSelectedChanel(masterStore.chanel);
    setSelectedAccount(masterStore.account);
    setSelectedStoreId(String(masterStore.id));
    setStoreImageFile(null);
    setStoreImagePreview(store.img_store || masterStore.img_store);
    setForm({
      company_tag: store.company_tag,
      is_active: store.is_active,
      mer_code: store.mer_code || "",
      user: store.user || "",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !selectedStore?.area?.trim() ||
      !form.mer_code.trim() ||
      !form.user.trim()
    )
      return;

    // ร้านเดียวกันซ้ำได้ แต่ต้องไม่ซ้ำ User เดิม
    const duplicate = stores.some(
      (store) =>
        store.id !== editingStoreId &&
        store.store_code === selectedStore.store_code &&
        store.user === form.user.trim(),
    );
    if (duplicate) {
      await showError("ข้อมูลซ้ำ", "User นี้ถูกเพิ่มในร้านค้านี้แล้ว");
      return;
    }

    setSaving(true);
    let uploadedFilePath: string | null = null;
    let masterImageWasUpdated = false;
    let imageUrl = selectedStore.img_store;

    try {
      if (storeImageFile) {
        const extension = storeImageFile.name.split(".").pop() || "jpg";
        uploadedFilePath = `stores/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedFilePath, storeImageFile, {
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        imageUrl = supabase.storage
          .from("avatars")
          .getPublicUrl(uploadedFilePath).data.publicUrl;

        const { error: masterUpdateError } = await supabase
          .from("stores")
          .update({ img_store: imageUrl })
          .eq("id", selectedStore.id);
        if (masterUpdateError) throw masterUpdateError;
        masterImageWasUpdated = true;
      }

      const storeData = {
        store_code: selectedStore.store_code,
        store_name: selectedStore.store_name,
        area: selectedStore.area.trim(),
        company_tag: form.company_tag.trim(),
        is_active: form.is_active,
        mer_code: form.mer_code.trim(),
        user: form.user.trim(),
        chanel: selectedStore.chanel,
        account: selectedStore.account,
        province: selectedStore.province,
        region: selectedStore.region,
        img_store: imageUrl,
        store_type: selectedStore.store_type,
        address: selectedStore.address,
        phone: selectedStore.phone,
        latitude: selectedStore.latitude,
        longitude: selectedStore.longitude,
      };
      const saveResult = editingStoreId
        ? await supabase
            .from("pg_stores")
            .update(storeData)
            .eq("id", editingStoreId)
            .select(
              "id, store_code, store_name, area, company_tag, is_active, created_at, mer_code, user, chanel, account, province, region, img_store, store_type, address, phone, latitude, longitude",
            )
            .single()
        : await supabase
            .from("pg_stores")
            .insert(storeData)
            .select(
              "id, store_code, store_name, area, company_tag, is_active, created_at, mer_code, user, chanel, account, province, region, img_store, store_type, address, phone, latitude, longitude",
            )
            .single();

      if (saveResult.error) throw saveResult.error;

      const savedStore = saveResult.data as PgStore;
      setStores((currentStores) =>
        editingStoreId
          ? currentStores.map((store) =>
              store.id === editingStoreId ? savedStore : store,
            )
          : [savedStore, ...currentStores],
      );
      setStoreDirectory((currentStores) =>
        currentStores.map((store) =>
          store.id === selectedStore.id
            ? { ...store, img_store: imageUrl }
            : store,
        ),
      );
      cancelEdit();
      await showSuccess(
        editingStoreId
          ? "แก้ไขข้อมูลร้านค้าเรียบร้อยแล้ว"
          : "บันทึกร้านค้าเรียบร้อยแล้ว",
      );
    } catch (error) {
      const cleanupErrors: string[] = [];

      if (masterImageWasUpdated) {
        const { error: rollbackError } = await supabase
          .from("stores")
          .update({ img_store: selectedStore.img_store })
          .eq("id", selectedStore.id);
        if (rollbackError) cleanupErrors.push(rollbackError.message);
      }

      if (uploadedFilePath) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([uploadedFilePath]);
        if (removeError) cleanupErrors.push(removeError.message);
      }

      const message = error instanceof Error ? error.message : String(error);
      await showError(
        "บันทึกร้านค้าไม่สำเร็จ",
        cleanupErrors.length
          ? `${message} (ย้อนคืน/ลบไฟล์ไม่สำเร็จ: ${cleanupErrors.join(", ")})`
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Store size={21} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                ตั้งค่าร้านค้า
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                เพิ่มข้อมูลร้านค้าเข้าสู่ตาราง pg_stores
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchStores}
              disabled={loading}
              aria-label="โหลดรายการร้านค้าใหม่"
              title="โหลดรายการใหม่"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="border-y border-slate-200 bg-white px-5 py-6 sm:px-6"
        >
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">
              {editingStoreId ? "แก้ไขข้อมูลร้านค้า" : "ข้อมูลร้านค้าใหม่"}
            </h2>
            <span className="text-xs text-slate-400">
              {editingStoreId
                ? "ปรับข้อมูลและบันทึกทับรายการเดิม"
                : "เลือกร้านจากข้อมูลหลักก่อนบันทึก"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Area
              <select
                required
                value={selectedArea}
                onChange={(event) => {
                  setSelectedArea(event.target.value);
                  setSelectedChanel("");
                  setSelectedAccount("");
                  setSelectedStoreId("");
                  setStoreImageFile(null);
                  setStoreImagePreview(null);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">เลือก Area</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Chanel
              <select
                required
                value={selectedChanel}
                disabled={!selectedArea}
                onChange={(event) => {
                  setSelectedChanel(event.target.value);
                  setSelectedAccount("");
                  setSelectedStoreId("");
                  setStoreImageFile(null);
                  setStoreImagePreview(null);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">เลือก Chanel</option>
                {chanelOptions.map((chanel) => (
                  <option key={chanel} value={chanel}>
                    {chanel}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Account
              <select
                required
                value={selectedAccount}
                disabled={!selectedChanel}
                onChange={(event) => {
                  setSelectedAccount(event.target.value);
                  setSelectedStoreId("");
                  setStoreImageFile(null);
                  setStoreImagePreview(null);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">เลือก Account</option>
                {accountOptions.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              ร้านค้า
              <select
                required
                value={selectedStoreId}
                disabled={!selectedAccount}
                onChange={(event) => {
                  const storeId = event.target.value;
                  const store = availableStores.find(
                    (entry) => String(entry.id) === storeId,
                  );
                  setSelectedStoreId(storeId);
                  setStoreImageFile(null);
                  setStoreImagePreview(store?.img_store || null);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">เลือกร้านค้า</option>
                {availableStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name} ({store.store_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              User ผู้ดูแลร้าน
              <select
                required
                value={form.user}
                onChange={(event) =>
                  setForm({ ...form, user: event.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">เลือก User</option>
                {userOptions.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.display_name || user.username} ({user.username})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Mer Code สำหรับกลุ่มจัดรายการ
              <input
                required
                value={form.mer_code}
                onChange={(event) =>
                  setForm({ ...form, mer_code: event.target.value })
                }
                placeholder="กรอก Mer Code"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Company Tag
              <input
                required
                value={form.company_tag}
                onChange={(event) =>
                  setForm({ ...form, company_tag: event.target.value })
                }
                placeholder="เช่น PG"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="space-y-2 text-xs font-semibold text-slate-600 sm:col-span-2">
              รูปร้านค้า
              <div className="flex flex-wrap items-center gap-3">
                {storeImagePreview ? (
                  <img
                    src={storeImagePreview}
                    alt="ตัวอย่างรูปร้านค้า"
                    className="h-20 w-28 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <Store size={24} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <ImagePlus size={16} /> เลือกรูป
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!selectedStore || saving}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          void showError(
                            "ไฟล์ไม่ถูกต้อง",
                            "กรุณาเลือกไฟล์รูปภาพ",
                          );
                          event.target.value = "";
                          return;
                        }
                        setStoreImageFile(file);
                        setStoreImagePreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />
                  </label>
                  {storeImageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setStoreImageFile(null);
                        setStoreImagePreview(selectedStore?.img_store || null);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      <X size={14} /> ยกเลิกรูปใหม่
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-normal text-slate-400">
                รูปจะถูกอัปโหลดและบันทึกเป็น URL ในตารางทั้งสอง
              </p>
            </div>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              รหัสร้านค้า
              <input
                readOnly
                value={selectedStore?.store_code || ""}
                placeholder="เลือกข้อมูลร้านค้าก่อน"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-normal text-slate-600"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.checked })
                }
                className="h-4 w-4 accent-emerald-600"
              />
              เปิดใช้งานร้านค้านี้
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-3 lg:justify-end">
              <button
                type="submit"
                disabled={
                  saving ||
                  !selectedStore?.area?.trim() ||
                  !form.mer_code.trim() ||
                  !form.user
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : editingStoreId ? (
                  <Pencil size={16} />
                ) : (
                  <Plus size={17} />
                )}
                {saving
                  ? "กำลังบันทึก..."
                  : editingStoreId
                    ? "บันทึกการแก้ไข"
                    : "บันทึกร้านค้า"}
              </button>
              {editingStoreId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="ml-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </form>

        <section className="border-y border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                รายการร้านค้า
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                ทั้งหมด {filteredStores.length} ร้าน
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ค้นหารหัส ชื่อร้าน Area หรือบริษัท"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" /> กำลังโหลดร้านค้า...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">
              ไม่พบข้อมูลร้านค้า
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500">
                    <th className="px-5 py-3 sm:px-6">รหัสร้าน</th>
                    <th className="px-5 py-3">ชื่อร้าน</th>
                    <th className="px-5 py-3">Area</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Mer Code</th>
                    <th className="px-5 py-3">บริษัท</th>
                    <th className="px-5 py-3">สถานะ</th>
                    <th className="px-5 py-3 sm:px-6">วันที่เพิ่ม</th>
                    <th className="px-5 py-3 text-center">แก้ไข</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono font-semibold sm:px-6">
                        {store.store_code}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {store.store_name}
                      </td>
                      <td className="px-5 py-3">{store.area}</td>
                      <td className="px-5 py-3">{store.user}</td>
                      <td className="px-5 py-3">{store.mer_code}</td>
                      <td className="px-5 py-3">{store.company_tag}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            store.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {store.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 sm:px-6">
                        {new Date(store.created_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => beginEdit(store)}
                          aria-label={`แก้ไข ${store.store_name}`}
                          title="แก้ไขข้อมูลร้านค้า"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
