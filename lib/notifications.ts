"use client";

import Swal, { type SweetAlertOptions } from "sweetalert2";

const defaults: SweetAlertOptions = {
  confirmButtonText: "ตกลง",
  confirmButtonColor: "#2563eb",
  cancelButtonColor: "#64748b",
  heightAuto: false,
};

export function showNotification(options: SweetAlertOptions) {
  return Swal.fire({ ...defaults, ...options } as SweetAlertOptions);
}

export function showSuccess(title: string, text?: string) {
  return showNotification({ icon: "success", title, text });
}

export function showError(title: string, text?: string) {
  return showNotification({ icon: "error", title, text });
}

export function showWarning(title: string, text?: string) {
  return showNotification({ icon: "warning", title, text });
}

export function confirmAction(
  title: string,
  text: string,
  confirmButtonText: string,
) {
  return showNotification({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    focusCancel: true,
  });
}

export function showSuccessToast(title: string) {
  return showNotification({
    icon: "success",
    title,
    position: "top-end",
    toast: true,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  });
}
