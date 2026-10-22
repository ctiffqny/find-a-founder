
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { getFounderByAuthUserId } from "@/lib/airtable";
import { requireCompletedProfile } from "@/lib/require-completed-profile";
import { getOpportunityResponses } from "@/lib/opportunity-responses";

import { reviewOpportunityResponse } from "./actions";

export default async function OpportunityResponsesPage() {
  await requireCompletedProfile();

  const { userId } = await auth.protect();
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return (
      <main className="opportunities-page">
        <p>Please complete your founder profile first.</p>
      </main>
    );
  }

  const allResponses = await getOpportunityResponses();

  const received = allResponses.filter(
    (response) =>
      response.opportunityOwnerId === founder.id
  );

  const sent = allResponses.filter(
    (response) =>
      response.applicantId === founder.id
  );

  return (
    <main className="opportunities-page">
      <Link
        href="/opportunities"
        className="opportunity-back"
      >
        ← Back to opportunities
      </Link>

      <p className="opportunities-eyebrow">
        YOUR COLLABORATIONS
      </p>

      <h1>My Opportunity Responses</h1>

      <p className="opportunity-intro">
        Manage the interest you've received and
        keep track of opportunities you've applied to.
      </p>

      <div className="opportunity-response-summary">
        <div>
          <strong>{received.length}</strong>
          <span>Responses received</span>
        </div>

        <div>
          <strong>{sent.length}</strong>
          <span>Responses sent</span>
        </div>
      </div>

      <section className="opportunity-response-section">
        <h2>Interest in My Opportunities</h2>

        {received.length === 0 ? (
          <div className="opportunity-empty">
            No one has expressed interest yet.
          </div>
        ) : (
          <div className="opportunity-response-list">
            {received.map((response) => (
              <article
                className="opportunity-response-card"
                key={response.id}
              >
                <div className="opportunity-card-top">
                  <span className="opportunity-type">
                    Incoming interest
                  </span>

                  <span
                    className={`interest-status interest-status-${response.status.toLowerCase()}`}
                  >
                    {response.status}
                  </span>
                </div>

                <h3>{response.opportunityTitle}</h3>

                <p>
                  From{" "}
                  <Link
                    href={`/founders/${response.applicantId}`}
                  >
                    {response.applicantName}
                  </Link>
                </p>

                <p className="opportunity-response-message">
                  {response.message}
                </p>

                {response.status === "Pending" && (
                  <div className="opportunity-review-actions">
                    <form action={reviewOpportunityResponse}>
                      <input
                        type="hidden"
                        name="responseId"
                        value={response.id}
                      />
                      <input
                        type="hidden"
                        name="decision"
                        value="Accepted"
                      />
                      <button
                        type="submit"
                        className="opportunity-accept-button"
                      >
                        Accept Interest
                      </button>
                    </form>

                    <form action={reviewOpportunityResponse}>
                      <input
                        type="hidden"
                        name="responseId"
                        value={response.id}
                      />
                      <input
                        type="hidden"
                        name="decision"
                        value="Declined"
                      />
                      <button
                        type="submit"
                        className="opportunity-decline-button"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="opportunity-response-section">
        <h2>My Submitted Interest</h2>

        {sent.length === 0 ? (
          <div className="opportunity-empty">
            You haven't expressed interest in any
            opportunities yet.
          </div>
        ) : (
          <div className="opportunity-response-list">
            {sent.map((response) => (
              <article
                className="opportunity-response-card"
                key={response.id}
              >
                <div className="opportunity-card-top">
                  <span className="opportunity-type">
                    Your application
                  </span>

                  <span
                    className={`interest-status interest-status-${response.status.toLowerCase()}`}
                  >
                    {response.status}
                  </span>
                </div>

                <h3>
                  <Link
                    href={`/opportunities/${response.opportunityId}`}
                  >
                    {response.opportunityTitle}
                  </Link>
                </h3>

                <p className="opportunity-response-message">
                  {response.message}
                </p>

                {response.status === "Accepted" && (
                  <p className="opportunity-accepted-note">
                    Your interest was accepted! Visit
                    the opportunity and connect with
                    its founder to continue the conversation.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
