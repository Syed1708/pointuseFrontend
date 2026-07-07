import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { FiCheck, FiX, FiClock, FiCalendar, FiSend, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";
import { leaveRequestSchema } from "./leaveValidation";
import { leaveService } from '../../services/leaveService'; 
import { swapService } from '../../services/swapService'; 


const formatCalendarDate = (dateStr) => {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

export default function LeavesDashboard() {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const isManagerOrAdmin = ["admin", "manager"].includes(user?.role?.name);

  // Fetch employee's own requests OR admin's full requests list
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["leaves", isManagerOrAdmin ? "admin" : "my"],
    // queryFn: async () => {
    //   const endpoint = isManagerOrAdmin
    //     ? "/leaves/admin/list"
    //     : "/leaves/my-requests";
    //   const res = await api.get(endpoint);
    //   return res.data;
    // },
    queryFn: () => isManagerOrAdmin ? leaveService.getAdminList() : leaveService.getMyRequests() // Clean service calls [3]
  
  });

  // Inside LeavesDashboard.jsx (Add this new fetch query next to leaves query):

  const { data: swaps = [], isLoading: isSwapsLoading } = useQuery({
    queryKey: ["swaps", isManagerOrAdmin ? "admin" : "my"],
    // queryFn: async () => {
    //   const endpoint = isManagerOrAdmin
    //     ? "/swaps/admin/list"
    //     : "/swaps/my-swaps";
    //   const res = await api.get(endpoint);
    //   return res.data;
    // },

     queryFn: () => isManagerOrAdmin ? swapService.getAdminList() : swapService.getMySwaps()

  });

  // Submit Request Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { startDate: "", endDate: "", reason: "vacances", note: "" },
  });

  const submitRequestMutation = useMutation({
    // mutationFn: async (formData) => {
    //   await api.post("/leaves", formData);
    // },
     mutationFn: (formData) => leaveService.submit(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request submitted successfully!");
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    },
  });

  // Approve/Reject Request Mutation
  const handleStatusMutation = useMutation({
    // mutationFn: async ({ id, status }) => {
    //   await api.put(`/leaves/admin/${id}/status`, { status });
    // },
     mutationFn: ({ id, status }) => leaveService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Request successfully processed.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Action failed.");
    },
  });

  // Inside LeavesDashboard.jsx:

  // Employee responds to colleague's request (Accept/Decline) [2]
  const peerRespondMutation = useMutation({
    // mutationFn: async ({ id, accept }) => {
    //   await api.put(`/swaps/${id}/respond`, { accept });
    // },
    mutationFn: ({ id, accept }) => swapService.respond(id, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      toast.success("Response successfully sent!");
    },
  });

  // Manager finalizes swap (Approve/Reject) [2]
  const managerFinalizeMutation = useMutation({
    // mutationFn: async ({ id, status }) => {
    //   await api.put(`/swaps/admin/${id}/status`, { status });
    // },
    mutationFn: ({ id, status }) => swapService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      toast.success("Shift swap approved and applied to planning!");
    },
  });

  const onFormSubmit = (data) => submitRequestMutation.mutate(data);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Leave & Vacation Manager
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isManagerOrAdmin
            ? "Review and approve/reject employee leave and rest-day requests."
            : "Request paid vacation, sick leave, or days off, and monitor your requests."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ========================================== */}
        {/* COLUMN 1: EMPLOYEE SUBMISSION FORM         */}
        {/* ========================================== */}
        {!isManagerOrAdmin && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center">
              <FiCalendar className="mr-2 h-5 w-5 text-indigo-500" /> New Leave
              Request
            </h3>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  {...register("startDate")}
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  {...register("endDate")}
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              {/* 🛑 UPGRADED REASON DROPDOWN */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Reason / Motif
                </label>
                <select
                  {...register("reason")}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none bg-white dark:bg-zinc-900"
                >
                  <option value="vacances">Vacances (Vacation)</option>
                  <option value="maladie">Maladie (Sickness)</option>
                  <option value="sans_solde">
                    Congé Sans Solde (Unpaid Leave)
                  </option>
                  <option value="personnel">
                    Raison Personnelle (Personal)
                  </option>
                  <option value="autre">Autre (Other)</option>
                </select>
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              {/* 🛑 NEW NOTE FIELD */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Note (Optional)
                </label>
                <textarea
                  {...register("note")}
                  placeholder="e.g., Summer holidays with family"
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                />
                {errors.note && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.note.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 transition shadow-sm"
              >
                <FiSend className="mr-2 h-4 w-4" /> Submit Request
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* COLUMNS 2 & 3: HISTORICAL LIST / APPROVALS  */}
        {/* ========================================== */}
        <div className={isManagerOrAdmin ? "lg:col-span-3" : "lg:col-span-2"}>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center">
              <FiClock className="mr-2 h-5 w-5 text-indigo-500" />
              {isManagerOrAdmin ? "Leave Approval Inbox" : "My Leave Requests"}
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <tr>
                    {isManagerOrAdmin && (
                      <th className="px-4 py-3">Employee</th>
                    )}
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Daily Credit</th>
                    {/* 🛑 UPGRADED REASON / NOTE HEADER */}
                    <th className="px-4 py-3">Motif / Details</th>
                    <th className="px-4 py-3">Status</th>
                    {isManagerOrAdmin && (
                      <th className="px-4 py-3 text-right">Approval Control</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-zinc-400"
                      >
                        Loading requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-zinc-400"
                      >
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    requests.map((row) => {
                      const isPending = row.status === "pending";

                      const badgeStyles = {
                        pending:
                          "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
                        approved:
                          "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
                        rejected:
                          "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30",
                      };

                      const reasonLabels = {
                        vacances: "Vacances",
                        maladie: "Maladie",
                        sans_solde: "Sans Solde",
                        personnel: "Raison Personnelle",
                        autre: "Autre",
                      };

                      return (
                        <tr
                          key={row._id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition"
                        >
                          {isManagerOrAdmin && (
                            <td className="px-4 py-3 flex items-center space-x-2">
                              {row.employee?.avatar ? (
                                <img
                                  src={row.employee.avatar}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-[10px]">
                                  {row.employee?.name?.charAt(0)}
                                </div>
                              )}
                              <span className="font-bold text-zinc-900 dark:text-zinc-50">
                                {row.employee?.name}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {formatCalendarDate(row.startDate)}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {formatCalendarDate(row.endDate)}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {row.leaveHours} hrs/day
                          </td>

                          {/* 🛑 UPGRADED REASON BADGE & SUB-NOTE DISPLAY [2] */}
                          <td className="px-4 py-3 space-y-1">
                            <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {reasonLabels[row.reason] || "Autre"}
                            </span>
                            {row.note && (
                              <p
                                className="text-[10px] text-zinc-400 dark:text-zinc-500 italic max-w-37.5 truncate"
                                title={row.note}
                              >
                                "{row.note}"
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeStyles[row.status]}`}
                            >
                              {row.status === "pending"
                                ? "Pending"
                                : row.status}
                            </span>
                          </td>
                          {isManagerOrAdmin && (
                            <td className="px-4 py-3 text-right">
                              {isPending ? (
                                <div className="flex justify-end space-x-1.5">
                                  <button
                                    onClick={() =>
                                      handleStatusMutation.mutate({
                                        id: row._id,
                                        status: "approved",
                                      })
                                    }
                                    className="flex items-center rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                                  >
                                    <FiCheck className="mr-1 h-3.5 w-3.5" />{" "}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusMutation.mutate({
                                        id: row._id,
                                        status: "rejected",
                                      })
                                    }
                                    className="flex items-center rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500 shadow-sm"
                                  >
                                    <FiX className="mr-1 h-3.5 w-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-400 text-xs">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Inside LeavesDashboard.jsx (At the bottom of the parent container) */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-8">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center">
            <FiRefreshCw className="mr-2 h-5 w-5 text-indigo-500 animate-spin-slow" />
            {isManagerOrAdmin
              ? "Shift Swaps Pending Manager Approval"
              : "My Shift Swaps"}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Initiator (Sender)</th>
                  <th className="px-4 py-3">Colleague (Receiver)</th>
                  <th className="px-4 py-3">Sender's Shift</th>
                  <th className="px-4 py-3">Receiver's Shift</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isSwapsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      Loading swaps...
                    </td>
                  </tr>
                ) : swaps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      No shift swaps registered.
                    </td>
                  </tr>
                ) : (
                  swaps.map((row) => {
                    const isMyIncomingRequest =
                      !isManagerOrAdmin &&
                      row.receiver._id === user.id &&
                      row.status === "pending_receiver";
                    const isPendingManager = row.status === "pending_manager";

                    const badgeStyles = {
                      pending_receiver:
                        "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
                      pending_manager:
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
                      approved:
                        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
                      rejected:
                        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400",
                    };

                    return (
                      <tr
                        key={row._id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                          {row.sender.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                          {row.receiver.name}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {formatCalendarDate(row.senderDate)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {formatCalendarDate(row.receiverDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeStyles[row.status]}`}
                          >
                            {row.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {/* CASE 1: Employee receives swap proposal from colleague -> Accept/Decline [2] */}
                          {isMyIncomingRequest && (
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() =>
                                  peerRespondMutation.mutate({
                                    id: row._id,
                                    accept: true,
                                  })
                                }
                                className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  peerRespondMutation.mutate({
                                    id: row._id,
                                    accept: false,
                                  })
                                }
                                className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500"
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {/* CASE 2: Manager reviews peer-accepted swap -> Approve/Reject [2] */}
                          {isManagerOrAdmin && isPendingManager && (
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() =>
                                  managerFinalizeMutation.mutate({
                                    id: row._id,
                                    status: "approved",
                                  })
                                }
                                className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                              >
                                Approve Swap
                              </button>
                              <button
                                onClick={() =>
                                  managerFinalizeMutation.mutate({
                                    id: row._id,
                                    status: "rejected",
                                  })
                                }
                                className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {!isMyIncomingRequest &&
                            (!isManagerOrAdmin || !isPendingManager) && (
                              <span className="text-zinc-400 text-xs">-</span>
                            )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
