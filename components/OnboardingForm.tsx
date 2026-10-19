
"use client";

import { useActionState, useState } from "react";

import {
  createFounderProfile,
  type CreateProfileState,
} from "@/app/onboarding/actions";

import {
  GRADUATION_YEARS,
  USC_SCHOOLS,
  SKILLS,
  AREAS_OF_INTEREST,
  LOOKING_TO_CONNECT_WITH,
  AVAILABILITY_OPTIONS,
} from "@/lib/profile-options";

const initialState: CreateProfileState = {
  error: null,
};

const USC_EMAIL_REGEX = /^[^\s@]+@usc\.edu$/i;

export default function OnboardingForm() {
  const [graduationYear, setGraduationYear] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [uscEmail, setUscEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [state, formAction, isPending] = useActionState(
    createFounderProfile,
    initialState
  );

  const emailIsInvalid =
    emailTouched &&
    !USC_EMAIL_REGEX.test(uscEmail.trim());

  return (
    <form
      action={formAction}
      className="onboarding-form"
      onSubmit={(event) => {
        setEmailTouched(true);

        if (!USC_EMAIL_REGEX.test(uscEmail.trim())) {
          event.preventDefault();
        }
      }}
    >
      {/* Server-side errors */}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      {/* Name */}
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

      {/* USC Email */}
      <div className="form-field">
        <label htmlFor="uscEmail">
          USC email
        </label>

        <input
          id="uscEmail"
          name="uscEmail"
          type="email"
          placeholder="you@usc.edu"
          required
          value={uscEmail}
          onChange={(event) => {
            setUscEmail(event.target.value);
          }}
          onBlur={() => {
            setEmailTouched(true);
          }}
          aria-invalid={emailIsInvalid}
          aria-describedby={
            emailIsInvalid
              ? "usc-email-error"
              : "usc-email-help"
          }
        />

        {emailIsInvalid ? (
          <p
            id="usc-email-error"
            className="form-error"
            role="alert"
          >
            Please use your USC email address ending in
            @usc.edu.
          </p>
        ) : (
          <p
            id="usc-email-help"
            className="form-help"
          >
            A USC email address is required to join
            Find-a-Founder.
          </p>
        )}
      </div>

      {/* Graduation Year and School */}
      <div className="form-row">
        <label>
          Graduation year

          <select
            name="graduationYear"
            value={graduationYear}
            onChange={(event) => {
              setGraduationYear(event.target.value);
            }}
            required
          >
            <option value="">
              Select year
            </option>

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
            <option value="">
              Select school
            </option>

            {USC_SCHOOLS.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Degree / Program */}
      <label>
        Degree / Program

        <input
          name="degreeProgram"
          type="text"
          placeholder="e.g. Computer Science"
        />
      </label>

      {/* Location */}
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

      {/* Bio */}
      <label>
        About you

        <textarea
          name="bio"
          rows={5}
          placeholder="Tell the USC community about yourself..."
          required
        />
      </label>

      {/* Skills */}
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

      {/* Areas of Interest */}
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
                onChange={(event) => {
                  if (event.target.checked) {
                    setAreasOfInterest((previous) => [
                      ...previous,
                      interest,
                    ]);
                  } else {
                    setAreasOfInterest((previous) =>
                      previous.filter(
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

      {/* Looking to Connect With */}
      <fieldset>
        <legend>Looking to connect with</legend>

        <p>
          What skills are you hoping to find
          in another collaborator?
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

      {/* Current Project */}
      <label>
        What are you working on?

        <textarea
          name="workingOn"
          rows={4}
          placeholder="Describe an idea, startup, project, or problem you're exploring."
        />
      </label>

      {/* Availability */}
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

      {/* Submit */}
      <button
        type="submit"
        className="onboarding-submit"
        disabled={isPending || emailIsInvalid}
      >
        {isPending
          ? "Creating Profile..."
          : "Create Profile"}
      </button>
    </form>
  );
}
