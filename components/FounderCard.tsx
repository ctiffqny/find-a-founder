import Link from "next/link";
import type { Founder } from "@/lib/types";

type FounderCardProps = {
  founder: Founder;
};

export default function FounderCard({
  founder,
}: FounderCardProps) {
  return (
    <article className="founder-card">
      {founder.profilePhoto ? (
        <img
          src={founder.profilePhoto}
          alt={`${founder.name} profile`}
          className="founder-photo"
        />
      ) : (
        <div className="founder-photo-placeholder">
          {founder.firstName?.charAt(0)}
          {founder.lastName?.charAt(0)}
        </div>
      )}

      <div className="founder-card-content">
        <h2>{founder.name}</h2>

        <p className="founder-school">
          {founder.school}

          {founder.graduationYear &&
            ` · Class of ${founder.graduationYear}`}
        </p>

        {founder.degreeProgram && (
          <p className="founder-program">
            {founder.degreeProgram}
          </p>
        )}

        {founder.bio && (
          <p className="founder-bio">
            {founder.bio}
          </p>
        )}

        {founder.skills.length > 0 && (
          <div className="tag-section">
            <span className="tag-label">Skills</span>

            <div className="tags">
              {founder.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {founder.lookingToConnectWith.length > 0 && (
          <div className="tag-section">
            <span className="tag-label">
              Looking to connect with
            </span>

            <div className="tags">
              {founder.lookingToConnectWith
                .slice(0, 3)
                .map((role) => (
                  <span key={role} className="tag">
                    {role}
                  </span>
                ))}
            </div>
          </div>
        )}

        <Link
          href={`/founders/${founder.id}`}
          className="view-profile-button"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}