import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

export function formatNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("en").format(Number(value ?? 0));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}
