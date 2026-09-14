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

  // Tab Session Initialization & Legacy Migration
  useEffect(() => {
    try {
      // 1. Establish unique tab identifier for observability and correlation
      let tabId = sessionStorage.getItem("resolvex_tab_id");
      if (!tabId) {
        tabId = "tab_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
        sessionStorage.setItem("resolvex_tab_id", tabId);
      }

      // 2. Load tab-isolated session from sessionStorage
      let savedRole = sessionStorage.getItem("resolvex_active_role");
      let savedCustom = sessionStorage.getItem("resolvex_user_profile");

      // Backward-compatibility migration: if this tab has no session yet but localStorage has legacy data,
      // safely migrate into this tab's sessionStorage and clear localStorage to avoid cross-tab leakage.
      if (!savedRole && typeof localStorage !== "undefined") {
        const legacyRole = localStorage.getItem("resolvex_active_role");
        const legacyCustom = localStorage.getItem("resolvex_user_profile");
        if (legacyRole) {
          savedRole = legacyRole;
          sessionStorage.setItem("resolvex_active_role", legacyRole);
          sessionStorage.setItem("resolvex_session_token", `dev-${legacyRole}`);
          try {
            localStorage.removeItem("resolvex_active_role");
          } catch {}
        }
        if (legacyCustom) {
          savedCustom = legacyCustom;
          sessionStorage.setItem("resolvex_user_profile", legacyCustom);
          try {
            localStorage.removeItem("resolvex_user_profile");
          } catch {}
        }
      }

      let activeUser = PRESET_PERSONAS[2];
      if (savedRole) {
        const found = PRESET_PERSONAS.find((p) => p.role === savedRole);
        if (found) {
          activeUser = found;
        }
      }
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (parsed && typeof parsed === "object") {
          activeUser = { ...activeUser, ...parsed };
        }
      }

      // Synchronize full active_user record for tab-scoped api-client
      sessionStorage.setItem("resolvex_active_user", JSON.stringify(activeUser));
      sessionStorage.setItem("resolvex_session_token", `dev-${activeUser.role}`);
      setUser(activeUser);
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  // Targeted Cross-Tab Security Invalidation (BroadcastChannel)
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("resolvex_auth_events");
      channel.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (data && data.type === "USER_LOGOUT") {
          // Only invalidate if THIS tab is running as the specific logged-out user
          setUser((currentUser) => {
            const isTargetUser =
              (data.userId && currentUser.id === data.userId) ||
              (data.userEmail && currentUser.email.toLowerCase() === data.userEmail.toLowerCase());

            if (isTargetUser) {
              try {
                sessionStorage.removeItem("resolvex_active_role");
                sessionStorage.removeItem("resolvex_active_user");
                sessionStorage.removeItem("resolvex_user_profile");
                sessionStorage.removeItem("resolvex_session_token");
              } catch {}
              return PRESET_PERSONAS[2]; // Fallback to baseline default
            }

            // Other user logged out in another tab — remain completely unaffected
            return currentUser;
          });
        }
      };
    } catch {}

    return () => {
      try {
        channel?.close();
      } catch {}
    };
  }, []);

  const switchRole = (newRole: RoleType) => {
    const found = PRESET_PERSONAS.find((p) => p.role === newRole);
    if (found) {
      setUser(found);
      try {
        // Tab-isolated session storage
        sessionStorage.setItem("resolvex_active_role", newRole);
        sessionStorage.setItem("resolvex_active_user", JSON.stringify(found));
        sessionStorage.setItem("resolvex_session_token", `dev-${newRole}`);
        sessionStorage.removeItem("resolvex_user_profile");

        // Clean up legacy localStorage if still present
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("resolvex_active_role");
          localStorage.removeItem("resolvex_user_profile");
        }
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
        const customPayload = {
          fullName: updated.fullName,
          email: updated.email,
          initials: updated.initials,
          description: updated.description,
        };
        sessionStorage.setItem("resolvex_user_profile", JSON.stringify(customPayload));
        sessionStorage.setItem("resolvex_active_user", JSON.stringify(updated));

        // Clean up legacy localStorage if still present
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("resolvex_user_profile");
        }
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    const activeSnapshot = user;
    try {
      sessionStorage.removeItem("resolvex_active_role");
      sessionStorage.removeItem("resolvex_active_user");
      sessionStorage.removeItem("resolvex_user_profile");
      sessionStorage.removeItem("resolvex_session_token");

      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("resolvex_active_role");
        localStorage.removeItem("resolvex_user_profile");
      }
    } catch {}

    // Broadcast targeted security logout event to other tabs running as this user
    if (typeof window !== "undefined" && "BroadcastChannel" in window && activeSnapshot) {
      try {
        const channel = new BroadcastChannel("resolvex_auth_events");
        channel.postMessage({
          type: "USER_LOGOUT",
          userId: activeSnapshot.id,
          userEmail: activeSnapshot.email,
          timestamp: Date.now(),
        });
        channel.close();
      } catch {}
    }

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
