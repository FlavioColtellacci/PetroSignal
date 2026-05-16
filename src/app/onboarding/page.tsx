import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ProtectedPage } from "@/components/auth/protected-page";

export default function OnboardingPage() {
  return (
    <ProtectedPage>
      <OnboardingWizard />
    </ProtectedPage>
  );
}
