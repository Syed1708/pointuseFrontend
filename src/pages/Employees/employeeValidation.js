import * as z from "zod";

export const employeeCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // 🛑 UPGRADED: Handles numbers, strings, and empty inputs safely [3]
  contractHours: z.preprocess(
    (val) => (val === "" || val === undefined ? 35 : Number(val)),
    z.number().min(1, "Must be at least 1 hour"),
  ),
pinCode: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional().or(z.literal("")),
});

export const employeeEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  // 🛑 UPGRADED: Handles numbers, strings, and empty inputs safely [3]
  contractHours: z.preprocess(
    (val) => (val === "" || val === undefined ? 35 : Number(val)),
    z.number().min(1, "Must be at least 1 hour"),
  ),
  pinCode: z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
    .optional()
    .or(z.literal("")),
});
