import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import Modal from "../../components/Modal";
import { employeeEditSchema } from "./employeeValidation";

export default function EmployeeEditModal({ isOpen, onClose, employee }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeEditSchema),
  });

  useEffect(() => {
    if (employee) {
      setValue("name", employee.name);
      setValue("email", employee.email);
      setValue('contractHours', String(employee.contractHours || 35));
      const isOldHash = employee.pinCode && employee.pinCode.startsWith("$");
      setValue("pinCode", isOldHash ? "" : employee.pinCode || "");
    }
  }, [employee, setValue]);

  const editEmployeeMutation = useMutation({
    mutationFn: async (updatedData) => {
      await api.put(`/users/${employee._id}`, updatedData); // Updates via the general user edit route
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee details updated.");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update details.");
    },
  });

  const onSubmit = (data) => editEmployeeMutation.mutate(data);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Employee: ${employee?.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Full Name
          </label>
          <input
            {...register("name")}
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
                <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Weekly Contract Hours
          </label>
          <div className="mt-1">
            {/* 🛑 Add this input field */}
            <input
              {...register("contractHours")}
              type="text"
              placeholder="e.g. 35"
              className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
            />
          </div>
          {errors.contractHours && (
            <p className="mt-1 text-xs text-red-500">
              {errors.contractHours.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Update Pin Code (Optional)
          </label>
          <input
            {...register("pinCode")}
            type="text"
            placeholder="Leave empty to keep current PIN"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
          />
          {errors.pinCode && (
            <p className="mt-1 text-xs text-red-500">
              {errors.pinCode.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 transition-all"
        >
          {isSubmitting ? "Saving..." : "Update Details"}
        </button>
      </form>
    </Modal>
  );
}
