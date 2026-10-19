
import Link from "next/link";
import { notFound } from "next/navigation";

import { getFounderById } from "@/lib/airtable";
import { requireCompletedProfile } from "@/lib/require-completed-profile";

type FounderProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FounderProfilePage({
  params,
}: FounderProfilePageProps) {
  await requireCompletedProfile();

  const { id } = await params;
  const founder = await getFounderById(id);

  if (!founder) {
    notFound();
  }

  const initials =
    `${founder.firstName?.charAt(0) || ""}${
      founder.lastName?.charAt(0) || ""
    }`.toUpperCase() || "?";

  return (
    <main className="profile-page">
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

        <div>
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
            <p className="availability">
              {founder.status}
            </p>
          )}

          {/* Connection requests will be added later. */}
          <button
            type="button"
            className="contact-founder-button"
            disabled
            title="Connection requests coming soon"
          >
            Connect — Coming Soon
          </button>
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
      </div>
    </main>
  );
}
