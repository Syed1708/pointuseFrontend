import * as z from "zod";

// 1. Group permissions structurally by business categories
export const PERMISSION_GROUPS = {
  employees: [
    'employees:view', 
    'employees:create', 
    'employees:edit', 
    'employees:delete'
  ],
  schedules: [
    'schedules:view', 
    'schedules:create', 
    'schedules:edit', 
    'schedules:delete', 
    'schedules:publish'
  ],
  pointage: [
    'pointage:view', 
    'pointage:create'
  ]
};

// 2. Flatten all groups automatically to get the complete system-wide list
export const ALL_SYSTEM_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();

export const roleValidationSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  permissions: z.array(z.string()).min(1, "Please select at least one permission"),
});