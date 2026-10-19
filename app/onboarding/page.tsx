import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth.protect();

  const existingFounder =
    await getFounderByAuthUserId(userId);

  // Completed profiles can browse the directory.
  if (existingFounder?.profileCompleted) {
    redirect("/founders");
  }

  // An incomplete existing record cannot be recreated.
  // We'll add a resume/edit flow for these profiles next.
  if (existingFounder) {
    return (
      <main className="onboarding-page">
        <div className="onboarding-header">
          <h1>Finish your profile</h1>
          <p>
            You already have a profile saved, but it has
            not been marked as complete yet.
            Please contact the site administrator
            to finish activating your profile.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-header">
        <h1>Create your profile</h1>

        <p>
          Introduce yourself to the USC community.
          Share your background, skills, interests,
          and the people you'd like to connect with.
        </p>
      </div>

      <OnboardingForm />
    </main>
  );
}
