"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  updateSettingAction,
  createUserAction,
  deleteUserAction,
} from "@/app/actions/settings";
import {
  Settings,
  Users,
  Shield,
  Plus,
  Trash2,
  Lock,
  Mail,
  User,
  Check,
  X,
  Building,
  Key,
  CreditCard,
  History,
  TrendingUp,
} from "lucide-react";

// User Validation Schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().uuid("Please select a role"),
  advertiserId: z.string().optional().or(z.literal("")),
});

type UserFormValues = z.infer<typeof userSchema>;

interface SettingsClientProps {
  settings: any[];
  users: any[];
  roles: any[];
  advertisers: any[];
}

export function SettingsClient({
  settings: initialSettings,
  users: initialUsers,
  roles,
  advertisers,
}: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState<"system" | "users" | "billing">("system");
  const [showUserModal, setShowUserModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit settings inline
  const [editingSettingKey, setEditingSettingKey] = useState<string | null>(null);
  const [editingSettingValue, setEditingSettingValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const selectedRoleId = watch("roleId");
  const selectedRoleName = roles.find((r) => r.id === selectedRoleId)?.name;
  const isAdvertiserRole = selectedRoleName === "ADVERTISER";

  const handleUpdateSetting = async (key: string) => {
    try {
      await updateSettingAction(key, editingSettingValue);
      setSettings(
        settings.map((s) => (s.key === key ? { ...s, value: editingSettingValue } : s))
      );
      setEditingSettingKey(null);
    } catch (err) {
      alert("Failed to update setting");
    }
  };

  const openAddUserModal = () => {
    reset({
      name: "",
      email: "",
      password: "",
      roleId: roles[0]?.id || "",
      advertiserId: "",
    });
    setErrorMsg(null);
    setShowUserModal(true);
  };

  const onUserSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const created = await createUserAction({
        name: data.name,
        email: data.email,
        passwordHash: data.password,
        roleId: data.roleId,
        advertiserId: isAdvertiserRole ? data.advertiserId || null : null,
      });

      setUsers([...users, created]);
      setShowUserModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this user!",
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
      await deleteUserAction(id);
      setUsers(users.filter((u) => u.id !== id));
      Swal.fire({
        title: "Deleted!",
        text: "User has been deleted successfully.",
        icon: "success",
        background: "#12141c",
        color: "#ffffff",
        customClass: {
          popup: "border border-white/5 rounded-3xl",
        }
      });
    } catch (err: any) {
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to delete user.",
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System Configuration</h1>
        <p className="text-gray-400 text-xs mt-1">
          Configure site parameters, register administrative credentials, and manage platform subscriptions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "system"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Site Settings</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "users"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Credentials</span>
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-5 py-3 border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "billing"
              ? "border-purple-500 text-purple-300 bg-purple-950/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Platform Billing</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM CONFIGS */}
      {activeTab === "system" && (
        <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in text-xs">
          <div className="divide-y divide-white/5">
            {settings.map((setting) => (
              <div key={setting.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-md">
                  <span className="font-bold text-white text-sm block tracking-wide font-mono">
                    {setting.key.toUpperCase()}
                  </span>
                  <p className="text-gray-500 text-[11px] mt-1">{setting.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-2">
                  {editingSettingKey === setting.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSettingValue}
                        onChange={(e) => setEditingSettingValue(e.target.value)}
                        className="px-3 py-1.5 bg-[#171924] border border-purple-500 rounded-xl text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateSetting(setting.key)}
                        className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingSettingKey(null)}
                        className="p-2 bg-[#1c1f2a] hover:bg-[#252837] text-gray-400 hover:text-white rounded-xl border border-white/5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl font-bold font-mono text-purple-300">
                        {setting.value}
                      </span>
                      <button
                        onClick={() => {
                          setEditingSettingKey(setting.key);
                          setEditingSettingValue(setting.value);
                        }}
                        className="px-3 py-1.5 bg-[#1c1f2a] hover:bg-[#252837] border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer font-bold"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER CREDENTIALS */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="flex justify-end">
            <button
              onClick={openAddUserModal}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add User Credential</span>
            </button>
          </div>

          <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Associated Tenant</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01] text-gray-300 font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5 block">{u.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-[10px] text-gray-400 font-mono">
                          <Shield className="h-3 w-3" />
                          <span>{u.role.name}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.advertiser ? (
                          <span className="font-bold text-purple-400">{u.advertiser.companyName}</span>
                        ) : (
                          <span className="text-gray-600 italic">Global Access</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleUserDelete(u.id)}
                          className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM BILLING SUMMARY */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fade-in">
          {/* Revenue and Active subscriptions summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/15 text-purple-400 rounded-xl">
                  <TrendingUp className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">MRR Projection</h2>
                  <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                    Platform Revenue
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4 text-gray-400">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Monthly Recurring Revenue
                  </span>
                  <span className="text-3xl font-black text-white tracking-tight">
                    ₹3,999.00
                  </span>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Active Tenants</span>
                    <span className="text-white font-bold">{advertisers.length} Total</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Subscribed Tenants</span>
                    <span className="text-white font-bold">1 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Average Tier Value</span>
                    <span className="text-white font-bold">₹3,999.00 / mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Config & Webhooks configuration scaffolding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stripe integrations setup */}
            <div className="bg-[#12141c]/65 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                SaaS Scaffolding
              </span>
              <h2 className="text-sm font-bold text-white mb-2">Stripe Integration Hooks</h2>
              <p className="text-gray-400 mb-6 text-[11px] leading-relaxed">
                Connect the Stripe webhook endpoints to receive events for subscription payments (`invoice.payment_succeeded`), subscription cancelations (`customer.subscription.deleted`), and trial updates.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#171924] border border-white/5 rounded-xl space-y-2">
                  <span className="font-bold text-white block">Webhook Endpoint URI</span>
                  <input
                    type="text"
                    readOnly
                    value="https://yourdomain.com/api/billing/stripe"
                    className="w-full bg-[#10121a] border border-white/5 rounded-xl p-2 font-mono text-gray-500 focus:outline-none select-all"
                  />
                </div>
                <div className="p-3.5 bg-[#171924] border border-white/5 rounded-xl space-y-2">
                  <span className="font-bold text-white block">Active Billing Plans configurator</span>
                  <div className="flex items-center justify-between text-gray-400 text-[11px]">
                    <span>Pro Growth Plan (5,000 scans limit)</span>
                    <span className="text-purple-400 font-bold font-mono">₹3,999.00/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Create Modal Overlay */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#1c1f2a] border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-400" />
              <span>Create User Credentials</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Create credentials for platform administrators or advertiser managers.
            </p>

            {errorMsg && (
              <div className="mb-4 text-xs p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onUserSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Michael Chang"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Login Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white placeholder-gray-600 text-xs focus:outline-none"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  System Role
                </label>
                <select
                  {...register("roleId")}
                  className="w-full px-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.roleId.message}</p>
                )}
              </div>

              {/* Advertiser Select */}
              {isAdvertiserRole && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Associate Advertiser Tenant
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Building className="h-4 w-4" />
                    </div>
                    <select
                      {...register("advertiserId")}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#171924] border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Tenant --</option>
                      {advertisers.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.advertiserId && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.advertiserId.message}</p>
                  )}
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="w-1/2 py-2.5 bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {isLoading ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
