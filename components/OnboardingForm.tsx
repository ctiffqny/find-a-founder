"use client";

import { useState } from "react";
import { createFounderProfile } from "@/app/onboarding/actions";

import {
  GRADUATION_YEARS,
  USC_SCHOOLS,
  SKILLS,
  AREAS_OF_INTEREST,
  LOOKING_TO_CONNECT_WITH,
  AVAILABILITY_OPTIONS,
} from "@/lib/profile-options";

export default function OnboardingForm() {
  const [graduationYear, setGraduationYear] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);

  return (
    <form
      action={createFounderProfile}
      className="onboarding-form"
    >
      <div className="form-row">
        <label>
          First name
          <input
            name="firstName"
            type="text"
            required
          />
        </label>

        <label>
          Last name
          <input
            name="lastName"
            type="text"
            required
          />
        </label>
      </div>

      <label>
        USC email
        <input
          name="uscEmail"
          type="email"
          placeholder="you@usc.edu"
          required
        />
      </label>

      <div className="form-row">
        <label>
            Graduation year

            <select
                name="graduationYear"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                required
            >
                <option value="">Select year</option>

                {GRADUATION_YEARS.map((year) => (
                <option key={year} value={year}>
                    {year}
                </option>
                ))}
            </select>

            {graduationYear === "Other" && (
                <input
                type="text"
                name="otherGraduationYear"
                placeholder="Enter graduation year"
                required
                />
            )}
        </label>

        <label>
            USC school

            <select name="school" required>
                <option value="">Select school</option>

                {USC_SCHOOLS.map((school) => (
                <option key={school} value={school}>
                    {school}
                </option>
                ))}
            </select>
            </label>
      </div>

      <label>
        Degree / Program
        <input
          name="degreeProgram"
          type="text"
          placeholder="e.g. Computer Science"
        />
      </label>

      <div className="form-row">
        <label>
          Hometown
          <input
            name="hometown"
            type="text"
            placeholder="e.g. San Francisco"
          />
        </label>

        <label>
          Current location
          <input
            name="currentLocation"
            type="text"
            placeholder="e.g. Los Angeles"
          />
        </label>
      </div>

      <label>
        About you
        <textarea
          name="bio"
          rows={5}
          placeholder="Tell other founders about yourself..."
          required
        />
      </label>

      <fieldset>
        <legend>Skills</legend>

        <p>
          What can you bring to a founding team?
        </p>

        <div className="checkbox-grid">
            {SKILLS.map((skill) => (
                <label key={skill}>
                <input
                    type="checkbox"
                    name="skills"
                    value={skill}
                />

                {skill}
                </label>
            ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Areas of interest</legend>

        <p>
          What kinds of problems or industries
          interest you?
        </p>

        <div className="checkbox-grid">
            {AREAS_OF_INTEREST.map((interest) => (
                <label key={interest}>
                <input
                    type="checkbox"
                    name="areasOfInterest"
                    value={interest}
                    checked={areasOfInterest.includes(interest)}
                    onChange={(e) => {
                        if (e.target.checked) {
                        setAreasOfInterest([
                            ...areasOfInterest,
                            interest,
                        ]);
                        } else {
                        setAreasOfInterest(
                            areasOfInterest.filter(
                            (item) => item !== interest
                            )
                        );
                        }
                    }}
                    />

                {interest}
                </label>
            ))}
        </div>

        {areasOfInterest.includes("Other") && (
            <label>
                Other area of interest

                <input
                type="text"
                name="otherAreaOfInterest"
                placeholder="e.g. Space technology"
                required
                />
            </label>
            )}

      </fieldset>

      <fieldset>
        <legend>Looking to connect with</legend>

        <p>
          What skills are you hoping to find in
          another founder?
        </p>

        <div className="checkbox-grid">
            {LOOKING_TO_CONNECT_WITH.map((role) => (
                <label key={role}>
                <input
                    type="checkbox"
                    name="lookingToConnectWith"
                    value={role}
                />

                {role}
                </label>
            ))}
        </div>
      </fieldset>

      <label>
        What are you working on?
        <textarea
          name="workingOn"
          rows={4}
          placeholder="Describe an idea, startup, project, or problem you're exploring."
        />
      </label>

      <label>
        Availability

        <select name="availability" required>
            <option value="">
            Select availability
            </option>

            {AVAILABILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
                {option}
            </option>
            ))}
        </select>
        </label>

      <button
        type="submit"
        className="onboarding-submit"
      >
        Create Profile
      </button>
    </form>
  );
}