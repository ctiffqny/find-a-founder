import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import {
  getFounderByAuthUserId,
  getFounderProfessionalLinks,
  getFounderById,
} from "@/lib/airtable";
import { requireCompletedProfile } from "@/lib/require-completed-profile";
import ConnectButton from "@/components/ConnectButton";
import { getConnectionStatusBetweenFounders } from "@/lib/connections";

type FounderProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default async function FounderProfilePage({
  params,
}: FounderProfilePageProps) {
  await requireCompletedProfile();

  const { id } = await params;
  const founder = await getFounderById(id);

  if (!founder) {
    notFound();
  }

  // Identify the signed-in founder.
  const { userId } = await auth();

  const currentFounder = userId
    ? await getFounderByAuthUserId(userId)
    : null;

  const isOwnProfile = currentFounder?.id === founder.id;

  // Check whether these two founders have connected.
  const connectionStatus =
    currentFounder && !isOwnProfile
      ? await getConnectionStatusBetweenFounders(
          currentFounder.id,
          founder.id
        )
      : null;

  // Professional links are private until a connection is accepted.
  const canViewProfessionalLinks =
    isOwnProfile || connectionStatus === "Accepted";

  const professionalLinks = canViewProfessionalLinks
    ? await getFounderProfessionalLinks(founder.id)
    : null;

  const linkedinUrl = safeExternalUrl(
    professionalLinks?.linkedinUrl
  );

  const portfolioUrl = safeExternalUrl(
    professionalLinks?.portfolioUrl
  );

  const initials =
    `${founder.firstName?.charAt(0) || ""}${
      founder.lastName?.charAt(0) || ""
    }`.toUpperCase() || "?";

  return (
    <main className="profile-page">
      <div className="profile-page-intro"><span className="profile-eyebrow">MEET THE COMMUNITY</span><h1>Founder Profile</h1><p>Learn more about the people building at USC.</p></div>
      {/* Back button */}
      <Link href="/founders" className="back-link">
        ← Back to people
      </Link>

      {/* Profile header */}
      <section className="profile-header">
        {founder.profilePhoto ? (
          <img
            src={founder.profilePhoto}
            alt={`${founder.name}'s profile photo`}
            className="profile-photo"
          />
        ) : (
          <div className="profile-photo-placeholder">
            {initials}
          </div>
        )}

        <div className="profile-header-details">
          <span className="profile-eyebrow">USC FOUNDER</span>
          <h1>{founder.name}</h1>

          {founder.memberTypes?.length > 0 && (
            <div className="tags">
              {founder.memberTypes.map((type) => (
                <span key={type} className="tag">
                  {type}
                </span>
              ))}
            </div>
          )}

          <p className="profile-school">
            {founder.school}
            {founder.graduationYear &&
              ` · Class of ${founder.graduationYear}`}
          </p>

          {founder.degreeProgram && (
            <p>{founder.degreeProgram}</p>
          )}

          {founder.currentLocation && (
            <p>{founder.currentLocation}</p>
          )}

          {founder.status && (
            <p className="profile-availability">
              {founder.status}
            </p>
          )}

          {/* Connection status */}
          <div className="profile-actions">
          {isOwnProfile ? (
            <span className="connection-status">
              Your Profile
            </span>
          ) : connectionStatus === "Accepted" ? (
            <span className="connection-status">
              ✓ Connected
            </span>
          ) : connectionStatus === "Pending" ? (
            <span className="connection-status">
              Request Pending
              <span>
                {" · "}
                <Link href="/connections">
                  View My Connections
                </Link>
              </span>
            </span>
          ) : connectionStatus === "Declined" ? (
            <span className="connection-status">
              Connection Unavailable
            </span>
          ) : (
            <ConnectButton founderId={founder.id} />
          )}
          </div>
        </div>
      </section>

      {/* Profile information */}
      <div className="profile-content">
        {founder.bio && (
          <section className="profile-section">
            <h2>About</h2>
            <p>{founder.bio}</p>
          </section>
        )}

        {founder.hometown && (
          <section className="profile-section">
            <h2>From</h2>
            <p>{founder.hometown}</p>
          </section>
        )}

        {founder.whatICanHelpWith.length > 0 && (
          <section className="profile-section">
            <h2>What I Can Help With</h2>

            <div className="tags">
              {founder.whatICanHelpWith.map((skill) => (
                <span key={skill} className="tag">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {founder.areasOfInterest.length > 0 && (
          <section className="profile-section">
            <h2>Areas of Interest</h2>

            <div className="tags">
              {founder.areasOfInterest.map((interest) => (
                <span key={interest} className="tag">
                  {interest}
                </span>
              ))}
            </div>
          </section>
        )}

        {founder.workingOn && (
          <section className="profile-section">
            <h2>What I'm Working On</h2>
            <p>{founder.workingOn}</p>
          </section>
        )}

        {founder.lookingToConnectWith.length > 0 && (
          <section className="profile-section">
            <h2>Looking to Connect With</h2>

            <div className="tags">
              {founder.lookingToConnectWith.map((role) => (
                <span key={role} className="tag">
                  {role}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Only visible to the owner or accepted connections */}
        {canViewProfessionalLinks && (
          <section className="profile-section professional-links-display">
            <h2>Professional Links</h2>

            {linkedinUrl || portfolioUrl ? (
              <div className="professional-links-list">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn Profile ↗
                  </a>
                )}

                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Personal Website / Portfolio ↗
                  </a>
                )}
              </div>
            ) : (
              <p>No professional links added yet.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
