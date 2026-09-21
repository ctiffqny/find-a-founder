import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth.protect();

  const existingFounder =
    await getFounderByAuthUserId(userId);

  // User already has a profile.
  // Don't let them create another one.
  if (existingFounder) {
    redirect("/profile");
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-header">
        <h1>Create your founder profile</h1>

        <p>
          Tell the USC community a little about
          yourself, what you're interested in, and
          who you'd like to meet.
        </p>
      </div>

      <OnboardingForm />
    </main>
  );
}