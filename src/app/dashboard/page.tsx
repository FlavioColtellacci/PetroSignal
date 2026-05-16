import { OnboardingGuard } from "@/components/auth/onboarding-guard"
import { ProtectedPage } from "@/components/auth/protected-page"
import { DashboardTerminal } from "@/components/dashboard/dashboard-terminal"

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <OnboardingGuard>
        <DashboardTerminal />
      </OnboardingGuard>
    </ProtectedPage>
  )
}
