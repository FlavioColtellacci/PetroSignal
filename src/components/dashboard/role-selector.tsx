"use client"

import { motion } from "framer-motion"

import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain"

const ROLE_LABELS: Record<BriefingRole, string> = {
  investor: "Investor",
  consultant: "Consultant",
  service_company: "Service Company",
  compliance: "Compliance",
  engineer: "Engineer",
}

type RoleSelectorProps = {
  active: BriefingRole
  onChange: (role: BriefingRole) => void
}

export function RoleSelector({ active, onChange }: RoleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-stack">
      {BRIEFING_ROLES.map((role) => {
        const isActive = role === active
        return (
          <motion.button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            whileTap={{ scale: 0.97 }}
            className={`relative border px-2 py-1 font-heading text-xs uppercase tracking-[0.04em] transition ${
              isActive
                ? "border-primary text-primary-foreground"
                : "border-outline-variant bg-surface-container-high text-foreground hover:bg-surface-container-highest"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="role-active-bg"
                className="absolute inset-0 -z-0 bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{ROLE_LABELS[role]}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export { ROLE_LABELS }
