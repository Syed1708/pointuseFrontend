import * as z from "zod";

// 🛑 FIXED: This is the unified schema being exported as "userFormSchema" [3]
export const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  
  // Password is only required on creation, so it is optional here [3]
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
    
  role: z.string().optional(), // Optional so it doesn't fail in the Employees module
  
  // Preprocesses strings, numbers, and empty fields cleanly [3]
  contractHours: z.preprocess(
    (val) => (val === "" || val === undefined ? 35 : Number(val)), 
    z.number().min(1, "Must be at least 1 hour")
  ),
  
  pinCode: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be between 4 and 6 digits")
    .optional()
    .or(z.literal("")),
});