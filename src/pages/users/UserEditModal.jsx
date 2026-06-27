import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import Modal from "../../components/Modal";
import { userEditSchema } from "./userValidation";

export default function UserEditModal({ isOpen, onClose, user, roles }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userEditSchema),
  });

  // Pre-populate input fields whenever the targeted 'user' prop changes [2]
  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("role", user.role?._id || "");
      setValue('contractHours', String(user.contractHours || 35));
      // 🧠 Smart Check: If the stored PIN starts with '$' (legacy hash), leave it blank to skip it [1].
      // Otherwise, pre-fill the original plain-text PIN (e.g. "1234")!
      const isOldHash = user.pinCode && user.pinCode.startsWith("$");
      setValue("pinCode", isOldHash ? "" : user.pinCode || "");
    }
  }, [user, setValue]);

  // Mutation: Edit User
  const editUserMutation = useMutation({
    mutationFn: async (updatedData) => {
      await api.put(`/users/${user._id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Refreshes directory table
      toast.success("Employee details updated.");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update details.");
    },
  });

  const onSubmit = (data) => editUserMutation.mutate(data);

  // 🧠 Extract the array safely [3]
  const rolesList = Array.isArray(roles) ? roles : roles.docs || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Employee: ${user?.name}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Full Name
          </label>
          <input
            {...register("name")}
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Assign Role
          </label>
          <select
            {...register("role")}
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800  dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none bg-wh
          ite  transition-colors"
          >
            <option value="">Select a role...</option>
            {rolesList.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>
        {/* Inside UserAddModal.jsx (right before the PIN code section) */}
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
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Update Pin Code (Optional)
          </label>
          <input
            {...register("pinCode")}
            type="text"
            placeholder="Leave empty to keep current PIN"
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
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
          className="w-full rounded-lg bg-zinc-900 p-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400 transition"
        >
          {isSubmitting ? "Saving..." : "Update Details"}
        </button>
      </form>
    </Modal>
  );
}
