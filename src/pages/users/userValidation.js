import * as z from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Please select a role"),
  pinCode: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be between 4 and 6 digits")
    .optional()
    .or(z.literal("")),
});

export const userEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Please select a role"),
  pinCode: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be between 4 and 6 digits")
    .optional()
    .or(z.literal("")),
});