
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import { getConnectionRequestsForFounder } from "@/lib/connections";
import ConnectionRequestActions from "@/components/ConnectionRequestActions";

export const dynamic = "force-dynamic";

type FounderSummary = {
  id: string;
  name: string;
};

async function getFounderSummaries(
  founderIds: string[]
): Promise<Map<string, FounderSummary>> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN;

  if (!baseId || !token) {
    throw new Error("Missing Airtable configuration.");
  }

  const summaries = new Map<string, FounderSummary>();

  await Promise.all(
    [...new Set(founderIds)].map(async (founderId) => {
      if (!/^rec[a-zA-Z0-9]+$/.test(founderId)) {
        return;
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Founders/${founderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const record = await response.json();

      summaries.set(founderId, {
        id: founderId,
        name: record.fields?.Name || "Founder",
      });
    })
  );

  return summaries;
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ConnectionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const founder = await getFounderByAuthUserId(userId);

  if (!founder || !founder.profileCompleted) {
    redirect("/onboarding");
  }

  const requests = await getConnectionRequestsForFounder(
    founder.id
  );

  const incoming = requests
    .filter((request) => request.toFounderId === founder.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const sent = requests
    .filter((request) => request.fromFounderId === founder.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const otherFounderIds = requests.map((request) =>
    request.fromFounderId === founder.id
      ? request.toFounderId
      : request.fromFounderId
  );

  const founderSummaries = await getFounderSummaries(
    otherFounderIds
  );

  return (
    <main className="connections-page">
      <div className="connections-page-header">
        <div>
          <p className="connections-eyebrow">
            FIND-A-FOUNDER
          </p>

          <h1>My Connections</h1>

          <p>
            Manage your requests and connect with fellow
            USC founders.
          </p>
        </div>

        <Link href="/founders" className="connections-browse-link">
          Browse Founders
        </Link>
      </div>

      <div className="connections-stats">
        <div className="connections-stat">
          <strong>
            {
              incoming.filter(
                (request) => request.status === "Pending"
              ).length
            }
          </strong>
          <span>Pending requests</span>
        </div>

        <div className="connections-stat">
          <strong>{sent.length}</strong>
          <span>Requests sent</span>
        </div>
      </div>

      <section className="connections-section">
        <h2>Incoming Requests</h2>

        {incoming.length === 0 ? (
          <p className="connections-empty">
            You haven't received any connection requests yet.
          </p>
        ) : (
          <div className="connections-list">
            {incoming.map((request) => {
              const otherFounder = founderSummaries.get(
                request.fromFounderId
              );

              return (
                <article
                  key={request.id}
                  className="connection-request-card"
                >
                  <div className="connection-request-top">
                    <div>
                      <h3>
                        {otherFounder?.name || "Founder"}
                      </h3>

                      <p className="connection-request-date">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`connection-status connection-status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {request.message && (
                    <p className="connection-request-message">
                      {request.message}
                    </p>
                  )}

                  <div className="connection-request-bottom">
                    {otherFounder && (
                      <Link
                        href={`/founders/${otherFounder.id}`}
                        className="connection-profile-link"
                      >
                        View Profile
                      </Link>
                    )}

                    {request.status === "Pending" && (
                      <ConnectionRequestActions
                        requestId={request.id}
                        otherFounderId={request.fromFounderId}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="connections-section">
        <h2>Sent Requests</h2>

        {sent.length === 0 ? (
          <p className="connections-empty">
            You haven't sent any connection requests yet.
          </p>
        ) : (
          <div className="connections-list">
            {sent.map((request) => {
              const otherFounder = founderSummaries.get(
                request.toFounderId
              );

              return (
                <article
                  key={request.id}
                  className="connection-request-card"
                >
                  <div className="connection-request-top">
                    <div>
                      <h3>
                        {otherFounder?.name || "Founder"}
                      </h3>

                      <p className="connection-request-date">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`connection-status connection-status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {request.message && (
                    <p className="connection-request-message">
                      {request.message}
                    </p>
                  )}

                  <div className="connection-request-bottom">
                    {otherFounder && (
                      <Link
                        href={`/founders/${otherFounder.id}`}
                        className="connection-profile-link"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
