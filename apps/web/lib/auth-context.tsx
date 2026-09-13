"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type RoleType = "support_agent" | "support_manager" | "lead_investigator" | "admin";

export interface UserPersona {
  id: string;
  fullName: string;
  email: string;
  role: RoleType;
  roleTitle: string;
  orgId: string;
  orgName: string;
  initials: string;
  avatarColor: string;
  description: string;
}

export const PRESET_PERSONAS: UserPersona[] = [
  {
    id: "00000000-0000-0000-0000-000000000011",
    fullName: "Alex Rivera",
    email: "alex.rivera@acmecommerce.com",
    role: "support_agent",
    roleTitle: "Support Agent",
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "Acme Commerce Inc.",
    initials: "AR",
    avatarColor: "bg-blue-600",
    description: "Case queue triage, customer context, AI suggested responses, and escalations."
  },
  {
    id: "00000000-0000-0000-0000-000000000014",
    fullName: "Sarah Jenkins",
    email: "sarah.jenkins@acmecommerce.com",
    role: "support_manager",
    roleTitle: "Support Manager",
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "Acme Commerce Inc.",
    initials: "SJ",
    avatarColor: "bg-purple-600",
    description: "Team workload, escalation reviews, resolution SLAs, and CX sentiment analytics."
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    fullName: "Maya Patel",
    email: "maya.patel@acmecommerce.com",
    role: "lead_investigator",
    roleTitle: "Lead Investigator",
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "Acme Commerce Inc.",
    initials: "MP",
    avatarColor: "bg-[#5052C9]",
    description: "Incident Command Center, multi-signal correlation, root cause, and proactive mitigation."
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    fullName: "Devin Wright",
    email: "admin@acmecommerce.com",
    role: "admin",
    roleTitle: "Organization Admin",
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "Acme Commerce Inc.",
    initials: "DW",
    avatarColor: "bg-emerald-600",
    description: "Tenant settings, RBAC policies, AI autonomy guardrails, and enterprise integrations."
  }
];

interface AuthContextType {
  user: UserPersona;
  role: RoleType;
  availablePersonas: UserPersona[];
  switchRole: (role: RoleType) => void;
  loginAsPersona: (role: RoleType) => void;
  updateUserProfile: (updates: Partial<UserPersona>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Maya Patel (Lead Investigator)
  const [user, setUser] = useState<UserPersona>(PRESET_PERSONAS[2]);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("resolvex_active_role");
      let activeUser = PRESET_PERSONAS[2];
      if (savedRole) {
        const found = PRESET_PERSONAS.find((p) => p.role === savedRole);
        if (found) {
          activeUser = found;
        }
      }
      const savedCustom = localStorage.getItem("resolvex_user_profile");
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (parsed && typeof parsed === "object") {
          activeUser = { ...activeUser, ...parsed };
        }
      }
      setUser(activeUser);
    } catch {
      // localStorage not accessible
    }
  }, []);

  const switchRole = (newRole: RoleType) => {
    const found = PRESET_PERSONAS.find((p) => p.role === newRole);
    if (found) {
      setUser(found);
      try {
        localStorage.setItem("resolvex_active_role", newRole);
        localStorage.removeItem("resolvex_user_profile");
      } catch {}
    }
  };

  const loginAsPersona = (newRole: RoleType) => {
    switchRole(newRole);
  };

  const updateUserProfile = (updates: Partial<UserPersona>) => {
    setUser((prev) => {
      let initials = prev.initials;
      if (updates.fullName) {
        const parts = updates.fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts[0]) {
          initials = parts[0].slice(0, 2).toUpperCase();
        }
      }
      const updated = {
        ...prev,
        ...updates,
        initials: updates.initials || initials,
      };
      try {
        localStorage.setItem("resolvex_user_profile", JSON.stringify({
          fullName: updated.fullName,
          email: updated.email,
          initials: updated.initials,
          description: updated.description,
        }));
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    try {
      localStorage.removeItem("resolvex_active_role");
      localStorage.removeItem("resolvex_user_profile");
    } catch {}
    setUser(PRESET_PERSONAS[2]); // Fallback to default
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        availablePersonas: PRESET_PERSONAS,
        switchRole,
        loginAsPersona,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback default persona if outside provider
    return {
      user: PRESET_PERSONAS[2],
      role: "lead_investigator",
      availablePersonas: PRESET_PERSONAS,
      switchRole: () => {},
      loginAsPersona: () => {},
      updateUserProfile: () => {},
      logout: () => {},
    };
  }
  return context;
}
