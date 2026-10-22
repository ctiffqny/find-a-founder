import Link from "next/link";

import { requireCompletedProfile } from "@/lib/require-completed-profile";
import OpportunityForm from "@/components/OpportunityForm";

export default async function NewOpportunityPage() {
  await requireCompletedProfile();

  return (
    <main className="opportunities-page opportunity-narrow">
      <Link
        href="/opportunities"
        className="opportunity-back"
      >
        ← Back to opportunities
      </Link>

      <p className="opportunities-eyebrow">
        SHARE AN OPPORTUNITY
      </p>

      <h1>What are you building?</h1>

      <p className="opportunity-intro">
        Tell the USC founder community who
        you'd like to work with.
      </p>

      <OpportunityForm />
    </main>
  );
}