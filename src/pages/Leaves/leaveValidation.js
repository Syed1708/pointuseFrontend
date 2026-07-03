import * as z from "zod";

export const leaveRequestSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    
    // 🛑 motiv dropdown enum selection [3]
    reason: z.enum(['vacances', 'maladie', 'sans_solde', 'personnel', 'autre'], {
      errorMap: () => ({ message: "Please select a valid reason" })
    }),
    
    // 🛑 Optional Note (Max 200 characters) [3]
    note: z.string().max(200, "Note must be under 200 characters").optional().or(z.literal("")),
  })
  // Timezone-safe date cross-browser verification
  .refine((data) => new Date(data.endDate.replace(/-/g, '/')) >= new Date(data.startDate.replace(/-/g, '/')), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });