"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  Shield,
  Copy,
  Check,
  LogOut,
  Edit3,
  X,
  Save,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, updateUserProfile, logout } = useAuth();
  const router = useRouter();

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [copiedId, setCopiedId] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Sync state when user updates
  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
  }, [user]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStartEdit = () => {
    setFullName(user.fullName);
    setEmail(user.email);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(user.fullName);
    setEmail(user.email);
    setIsEditing(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
    });

    setIsEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      {/* Page Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#464B5E] mt-0.5">
            Your personal credentials and workspace identity.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-3.5 py-2 rounded-xl bg-[#FBFAF7] hover:bg-[#EDEBE5] text-[#24283A] border-[1.5px] border-[#BDBCB5] text-xs font-semibold transition-all shadow-2xs flex items-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#5052C9]" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-xl bg-[#FBFAF7] hover:bg-[#EDEBE5] text-[#464B5E] border border-[#BDBCB5] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-3.5 py-1.5 rounded-xl bg-[#5052C9] hover:bg-[#4345B0] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {savedToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile updated successfully. Your changes are live across the system.</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="unify-card p-6 sm:p-8 bg-[#FBFAF7] border-[1.5px] border-[#C6C5BE] rounded-[16px] shadow-2xs">
        {/* User Identity Header */}
        <div className="flex items-center gap-5 pb-6 border-b-[1.5px] border-[#D8D6CE]">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-sm shrink-0 ${user.avatarColor}`}
          >
            {user.initials}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#24283A] truncate">
                {user.fullName}
              </h2>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#E5E4EE] text-[#5052C9] border border-[#BFC1E4]">
                {user.roleTitle}
              </span>
            </div>

            <p className="text-xs text-[#464B5E] flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-[#5052C9] shrink-0" />
              <span>{user.email}</span>
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Account</span>
            </div>
          </div>
        </div>

        {/* Account Details / Editable Form */}
        <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          {/* Full Name */}
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#D8D6CE]">
            <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono block mb-1.5">
              Full Name
            </span>
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#BDBCB5] text-xs font-semibold text-[#24283A] focus:outline-none focus:ring-2 focus:ring-[#5052C9]/30 focus:border-[#5052C9]"
                  placeholder="Enter full name"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#24283A]">
                <User className="w-4 h-4 text-[#5052C9] shrink-0" />
                <span>{user.fullName}</span>
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#D8D6CE]">
            <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono block mb-1.5">
              Email Address
            </span>
            {isEditing ? (
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#BDBCB5] text-xs font-semibold text-[#24283A] focus:outline-none focus:ring-2 focus:ring-[#5052C9]/30 focus:border-[#5052C9]"
                  placeholder="Enter email address"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#24283A] truncate">
                <Mail className="w-4 h-4 text-[#5052C9] shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* Organization / Workspace (Organization Governed) */}
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#D8D6CE]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono">
                Organization / Workspace
              </span>
              <span className="text-[10px] text-[#464B5E] flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-[#464B5E]" />
                Managed
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#24283A]">
              <Building2 className="w-4 h-4 text-[#5052C9] shrink-0" />
              <span>{user.orgName}</span>
            </div>
          </div>

          {/* Assigned Role (RBAC Governed) */}
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#D8D6CE]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono">
                Assigned Role
              </span>
              <span className="text-[10px] text-[#464B5E] flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-[#464B5E]" />
                RBAC
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#24283A]">
              <Shield className="w-4 h-4 text-[#5052C9] shrink-0" />
              <span>{user.roleTitle}</span>
            </div>
          </div>
        </form>

        {/* User / Employee ID with copy button */}
        <div className="mt-4 p-4 rounded-xl bg-[#F4F3EE] border border-[#D8D6CE] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono block mb-0.5">
              Account ID
            </span>
            <span className="font-mono text-xs font-semibold text-[#24283A] truncate block">
              {user.id}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EDEBE5] border border-[#C6C5BE] text-xs font-medium text-[#24283A] flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            title="Copy Account ID"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#5052C9]" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Sign Out Action */}
        <div className="mt-6 pt-6 border-t-[1.5px] border-[#D8D6CE] flex items-center justify-between">
          <p className="text-xs text-[#464B5E]">
            End your current session on this device.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-[1.5px] border-rose-200 text-xs font-semibold transition-all shadow-2xs flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
