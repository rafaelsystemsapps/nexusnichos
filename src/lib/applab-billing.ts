import { differenceInCalendarDays } from "date-fns";

export type BillingStatus = "em_dia" | "atrasado";

export interface BillingLike {
  due_date?: string | null;
  next_payment?: string | null;
  monthly_value?: number | string | null;
}

export function computeBillingStatus(billing?: BillingLike | null): BillingStatus {
  if (!billing?.due_date) return "em_dia";
  const due = new Date(billing.due_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime() ? "atrasado" : "em_dia";
}

export function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  const target = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(target, today);
}

export function billingDueLabel(date?: string | null): string | null {
  const d = daysUntil(date);
  if (d === null) return null;
  if (d === 0) return "vence hoje";
  if (d > 0) return `vence em ${d} dia${d === 1 ? "" : "s"}`;
  const abs = Math.abs(d);
  return `vencido há ${abs} dia${abs === 1 ? "" : "s"}`;
}
