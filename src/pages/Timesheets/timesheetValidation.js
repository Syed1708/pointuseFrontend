
import * as z from "zod";

export const timesheetFormSchema = z.object({
  employeeId: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  shiftType: z.enum(['midi', 'soir', 'double', 'repos', 'conge']).default('midi'),
  
  // Shift 1 (used for Midi, Soir, or Shift 1 of Double)
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Format requis: HH:MM").optional().or(z.literal("")),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Format requis: HH:MM").optional().or(z.literal("")),
  breakMinutes: z.preprocess((val) => Number(val || 0), z.number().min(0)),

  // 🛑 NEW: Shift 2 (only used when Double is selected) [3]
  checkInTime2: z.string().regex(/^\d{2}:\d{2}$/, "Format requis: HH:MM").optional().or(z.literal("")),
  checkOutTime2: z.string().regex(/^\d{2}:\d{2}$/, "Format requis: HH:MM").optional().or(z.literal("")),
  breakMinutes2: z.preprocess((val) => Number(val || 0), z.number().min(0)),
});