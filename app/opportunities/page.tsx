import Link from "next/link";

import { requireCompletedProfile } from "@/lib/require-completed-profile";
import { getOpportunities } from "@/lib/opportunities";
import OpportunityFilters from "@/components/OpportunityFilters";

export default async function OpportunitiesPage() {
  await requireCompletedProfile();

  const opportunities = await getOpportunities();

  return (
    <main className="opportunities-page">
      <div className="opportunities-heading">
        <div>
          <p className="opportunities-eyebrow">
            USC TIE HUB
          </p>

          <h1>Opportunities Board</h1>

          <p>
            Find cofounders, join projects, and
            build something together.
          </p>
        </div>

        <div className="opportunity-heading-actions">
        <Link
            href="/opportunities/responses"
            className="opportunity-secondary-link"
        >
            My Responses
        </Link>

        <Link
            href="/opportunities/new"
            className="opportunity-primary-link"
        >
            + Post an Opportunity
        </Link>
        </div>
      </div>

      <OpportunityFilters
        opportunities={opportunities}
      />
    </main>
  );
}