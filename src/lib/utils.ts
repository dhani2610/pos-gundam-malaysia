import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number or numeric string into Malaysian Ringgit (RM) with thousand separators.
 * Example: 1425.5 -> "RM 1,425.50"
 */
export function formatRM(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "RM 0.00";
  return (
    "RM " +
    num.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Formats a number with thousand separators (no currency prefix) for inputs/displays.
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals = 2
): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-MY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats an integer or decimal input string with live thousand separators as user types
 */
export function formatCurrencyInput(raw: string | number): string {
  if (raw === "" || raw === null || raw === undefined) return "";
  const str = String(raw).replace(/[^0-9.]/g, "");
  if (!str) return "";
  const parts = str.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    return `${intPart}.${parts[1].slice(0, 2)}`;
  }
  return intPart;
}

export function parseCurrencyInput(formatted: string | number): number {
  if (typeof formatted === "number") return formatted;
  const cleaned = String(formatted || "").replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
