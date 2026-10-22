import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getFounderByAuthUserId } from "@/lib/airtable";
import { requireCompletedProfile } from "@/lib/require-completed-profile";
import { getOpportunity } from "@/lib/opportunities";
import { closeMyOpportunity } from "@/app/opportunities/actions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OpportunityDetailPage({
  params,
}: Props) {
  await requireCompletedProfile();

  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  const { userId } = await auth();

  const founder = userId
    ? await getFounderByAuthUserId(userId)
    : null;

  const isOwner =
    founder?.id === opportunity.founderId;

  return (
    <main className="opportunities-page opportunity-narrow">
      <Link
        href="/opportunities"
        className="opportunity-back"
      >
        ← All opportunities
      </Link>

      <div className="opportunity-detail">
        <div className="opportunity-card-top">
          <span className="opportunity-type">
            {opportunity.type}
          </span>

          <span
            className={
              opportunity.status === "Open"
                ? "opportunity-open"
                : "opportunity-closed"
            }
          >
            {opportunity.status}
          </span>
        </div>

        <h1>{opportunity.title}</h1>

        <p className="opportunity-author">
          Posted by{" "}
          <Link
            href={`/founders/${opportunity.founderId}`}
          >
            {opportunity.founderName}
          </Link>
        </p>

        <h2>About this opportunity</h2>

        <p className="opportunity-detail-description">
          {opportunity.description}
        </p>

        {opportunity.skills && (
          <section>
            <h2>Skills needed</h2>
            <p>{opportunity.skills}</p>
          </section>
        )}

        {opportunity.location && (
          <section>
            <h2>Location</h2>
            <p>{opportunity.location}</p>
          </section>
        )}

        {opportunity.commitment && (
          <section>
            <h2>Time commitment</h2>
            <p>{opportunity.commitment}</p>
          </section>
        )}

        <div className="opportunity-detail-actions">
          {isOwner ? (
            opportunity.status === "Open" ? (
              <form action={closeMyOpportunity}>
                <input
                  type="hidden"
                  name="id"
                  value={opportunity.id}
                />

                <button
                  type="submit"
                  className="opportunity-close-button"
                >
                  Close this opportunity
                </button>
              </form>
            ) : (
              <p>This opportunity is closed.</p>
            )
          ) : opportunity.status === "Open" ? (
            <Link
              className="opportunity-primary-link"
              href={`/founders/${opportunity.founderId}`}
            >
              View founder & connect →
            </Link>
          ) : (
            <p>
              This opportunity is no longer
              accepting interest.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}