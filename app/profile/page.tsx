import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { getFounderByAuthUserId } from "@/lib/airtable";

export default async function ProfilePage() {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return (
      <main className="profile-page">
        <h1>Create your founder profile</h1>

        <p>
          You haven't created a founder profile yet.
          Create one to appear in the USC founder
          directory.
        </p>

        <Link
          href="/onboarding"
          className="view-profile-button"
        >
          Create Profile
        </Link>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <h1>My Profile</h1>

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
          <h2>{founder.name}</h2>

          <p>
            {founder.school}

            {founder.graduationYear &&
              ` · Class of ${founder.graduationYear}`}
          </p>

          {founder.degreeProgram && (
            <p>{founder.degreeProgram}</p>
          )}

          <div className="profile-actions">
            <Link
              href="/profile/edit"
              className="view-profile-button"
            >
              Edit Profile
            </Link>

            <Link
              href={`/founders/${founder.id}`}
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </section>

      <div className="profile-content">
        {founder.bio && (
          <section className="profile-section">
            <h2>About</h2>
            <p>{founder.bio}</p>
          </section>
        )}

        {founder.whatICanHelpWith.length > 0 && (
          <section className="profile-section">
            <h2>Skills</h2>

            <div className="tags">
              {founder.whatICanHelpWith.map((skill) => (
                <span className="tag" key={skill}>
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
              {founder.areasOfInterest.map(
                (interest) => (
                  <span
                    className="tag"
                    key={interest}
                  >
                    {interest}
                  </span>
                )
              )}
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
              {founder.lookingToConnectWith.map(
                (role) => (
                  <span className="tag" key={role}>
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