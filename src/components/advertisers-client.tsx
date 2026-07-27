"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createAdvertiserAction,
  updateAdvertiserAction,
  deleteAdvertiserAction,
} from "@/app/actions/advertiser";
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  User,
  Mail,
  Phone,
  Ban,
  CheckCircle,
  X,
  AlertTriangle,
} from "lucide-react";

// Form Schema
const advertiserSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Please select a business category"),
  password: z.string().optional().or(z.literal("")),
  couponCode: z.string().optional().or(z.literal("")),
  couponDiscount: z.string().optional().or(z.literal("")),
  couponTitle: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.password && data.password.length < 6) {
    return false;
  }
  return true;
}, {
  message: "Password must be at least 6 characters long",
  path: ["password"],
});

type AdvertiserFormValues = z.infer<typeof advertiserSchema>;

interface AdvertisersClientProps {
  initialAdvertisers: any[];
}

export function AdvertisersClient({ initialAdvertisers }: AdvertisersClientProps) {
  const [advertisers, setAdvertisers] = useState(initialAdvertisers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdvertiserFormValues>({
    resolver: zodResolver(advertiserSchema),
  });

  // Filter list
  const filtered = advertisers.filter(
    (adv) =>
      adv.companyName.toLowerCase().includes(search.toLowerCase()) ||
      adv.name.toLowerCase().includes(search.toLowerCase()) ||
      adv.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    reset({
      name: "",
      companyName: "",
      email: "",
      phone: "",
      category: "",
      password: "",
      couponCode: "",
      couponDiscount: "",
      couponTitle: "",
    });
    setEditingId(null);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (adv: any) => {
    reset({
      name: adv.name,
      companyName: adv.companyName,
      email: adv.email,
      phone: adv.phone || "",
      category: adv.category || "",
      password: "",
      couponCode: "",
      couponDiscount: "",
      couponTitle: "",
    });
    setEditingId(adv.id);
    setErrorMsg(null);
    setShowModal(true);
  };

  const onSubmit = async (data: AdvertiserFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (editingId) {
        // Edit Action
        const updated = await updateAdvertiserAction(editingId, {
          name: data.name,
          companyName: data.companyName,
          phone: data.phone || undefined,
          category: data.category || undefined,
        });
        setAdvertisers(
          advertisers.map((a) => (a.id === editingId ? { ...a, ...data, category: data.category } : a))
        );
      } else {
        // Create Action
        const created = await createAdvertiserAction(data);
        setAdvertisers([created, ...advertisers]);
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateAdvertiserAction(id, { status: nextStatus });
      setAdvertisers(
        advertisers.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
      );
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "All associated campaigns, users, and QR codes will be soft-deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
      background: "#12141c",
      color: "#ffffff",
      customClass: {
        popup: "border border-white/5 rounded-3xl",
      }
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAdvertiserAction(id);
      setAdvertisers(advertisers.filter((a) => a.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "Advertiser has been deleted successfully.",
        icon: "success",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Failed to delete advertiser.",
        icon: "error",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Advertisers</h1>
          <p className="text-gray-400 text-xs mt-1">
            Manage multi-tenant advertiser accounts, activate/suspend access, and update profiles.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/10 transition-all flex items-center gap-2 cursor-pointer text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Advertiser</span>
        </button>
      </div>

      {/* Control Actions Row */}
      <div className="flex bg-[#12141c]/40 border border-white/5 rounded-2xl p-3 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search company, contact or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#171924]/85 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((adv) => (
            <div
              key={adv.id}
              className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-white/10 transition-all"
            >
              <div>
                {/* Card Title */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/15 text-purple-400 rounded-xl">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{adv.companyName}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[8px] font-black uppercase tracking-wider">
                          {adv.category || "Retail"}
                        </span>
                        <span className="text-gray-600 text-[8px]">•</span>
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-widest">
                          Tenant
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <button
                    onClick={() => toggleStatus(adv.id, adv.status)}
                    title="Click to toggle status"
                    className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer transition-all ${
                      adv.status === "ACTIVE"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25"
                    }`}
                  >
                    {adv.status}
                  </button>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs text-gray-400 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{adv.name} (Contact)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{adv.email}</span>
                  </div>
                  {adv.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{adv.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => openEditModal(adv)}
                  className="p-2 bg-[#1c1f2a]/80 hover:bg-[#252837] border border-white/5 hover:border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleStatus(adv.id, adv.status)}
                  className={`p-2 border rounded-xl transition-all cursor-pointer ${
                    adv.status === "ACTIVE"
                      ? "bg-[#1c1f2a]/80 border-white/5 hover:border-red-950/20 text-gray-400 hover:text-red-400"
                      : "bg-[#1c1f2a]/80 border-white/5 hover:border-emerald-950/20 text-gray-400 hover:text-emerald-400"
                  }`}
                  title={adv.status === "ACTIVE" ? "Suspend Advertiser" : "Activate Advertiser"}
                >
                  {adv.status === "ACTIVE" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(adv.id)}
                  className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 hover:border-red-800/40 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                  title="Delete advertiser"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#12141c]/40 border border-white/5 border-dashed rounded-3xl py-16 text-center">
            <Building2 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No advertisers found matching search.</p>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#1c1f2a] border border-white/5 hover:border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {editingId ? "Update Advertiser Profile" : "Add Advertiser Tenant"}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Create a sandbox environment tenant that isolates campaigns and customer leads.
            </p>

            {errorMsg && (
              <div className="mb-4 text-xs p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    {...register("companyName")}
                    placeholder="e.g. AquaFlow Hydration"
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Business Category */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Retail & Shopping">Retail & Shopping</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                    <option value="Entertainment & Leisure">Entertainment & Leisure</option>
                    <option value="Technology & Services">Technology & Services</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                {errors.name && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Primary / Billing Email
                  </label>
                  <input
                    type="email"
                    disabled={!!editingId}
                    {...register("email")}
                    placeholder="billing@company.com"
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.email && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    {...register("phone")}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Login Account Setup (Create Only) */}
              {!editingId && (
                <div className="border-t border-white/5 pt-4 mt-2 space-y-4">
                  <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-wider">
                    Administrator Login Setup
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Account Login Password
                    </label>
                    <input
                      type="password"
                      {...register("password")}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    {errors.password && (
                      <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Default Reward Offer Setup (Create Only) */}
              {!editingId && (
                <div className="border-t border-white/5 pt-4 mt-2 space-y-4">
                  <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-wider">
                    Default Coupon Reward Setup
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Base Coupon Code
                      </label>
                      <input
                        type="text"
                        {...register("couponCode")}
                        placeholder="e.g. BOTTLE20"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Discount Value
                      </label>
                      <input
                        type="text"
                        {...register("couponDiscount")}
                        placeholder="e.g. 20% or $10"
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Coupon Title
                    </label>
                    <input
                      type="text"
                      {...register("couponTitle")}
                      placeholder="e.g. 20% Off Your Purchase"
                      className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
