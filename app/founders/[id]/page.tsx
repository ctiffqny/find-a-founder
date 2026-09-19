import Link from "next/link";
import { notFound } from "next/navigation";

import { getFounderById } from "@/lib/airtable";

type FounderProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FounderProfilePage({
  params,
}: FounderProfilePageProps) {
  const { id } = await params;

  const founder = await getFounderById(id);

  if (!founder) {
    notFound();
  }

  return (
    <main className="profile-page">
      {/* Back button */}
      <Link href="/founders" className="back-link">
        ← Back to founders
      </Link>

      {/* Profile header */}
      <section className="profile-header">
        {founder.profilePhoto ? (
          <img
            src={founder.profilePhoto}
            alt={`${founder.name} profile`}
            className="profile-photo"
          />
        ) : (
          <div className="profile-photo-placeholder">
            {founder.firstName?.charAt(0)}
            {founder.lastName?.charAt(0)}
          </div>
        )}

        <div>
          <h1>{founder.name}</h1>

          <p className="profile-school">
            {founder.school}

            {founder.graduationYear &&
              ` · Class of ${founder.graduationYear}`}
          </p>

          {founder.degreeProgram && (
            <p>{founder.degreeProgram}</p>
          )}

          {founder.currentLocation && (
            <p>📍 {founder.currentLocation}</p>
          )}

          {founder.availability && (
            <p className="availability">
              {founder.availability}
            </p>
          )}

          <button
            type="button"
            className="contact-founder-button"
          >
            Contact Founder
          </button>
        </div>
      </section>

      {/* Profile information */}
      <div className="profile-content">

        {/* About */}
        {founder.bio && (
          <section className="profile-section">
            <h2>About</h2>

            <p>{founder.bio}</p>
          </section>
        )}

        {/* Hometown */}
        {founder.hometown && (
          <section className="profile-section">
            <h2>From</h2>

            <p>{founder.hometown}</p>
          </section>
        )}

        {/* Skills */}
        {founder.skills.length > 0 && (
          <section className="profile-section">
            <h2>Skills</h2>

            <div className="tags">
              {founder.skills.map((skill) => (
                <span
                  key={skill}
                  className="tag"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Areas of Interest */}
        {founder.areasOfInterest.length > 0 && (
          <section className="profile-section">
            <h2>Areas of Interest</h2>

            <div className="tags">
              {founder.areasOfInterest.map(
                (interest) => (
                  <span
                    key={interest}
                    className="tag"
                  >
                    {interest}
                  </span>
                )
              )}
            </div>
          </section>
        )}

        {/* What I'm Working On */}
        {founder.workingOn && (
          <section className="profile-section">
            <h2>What I'm Working On</h2>

            <p>{founder.workingOn}</p>
          </section>
        )}

        {/* Looking to Connect With */}
        {founder.lookingToConnectWith.length > 0 && (
          <section className="profile-section">
            <h2>Looking to Connect With</h2>

            <div className="tags">
              {founder.lookingToConnectWith.map(
                (role) => (
                  <span
                    key={role}
                    className="tag"
                  >
                    {role}
                  </span>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}