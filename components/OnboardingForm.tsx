
"use client";

import { useActionState, useState } from "react";
import { createFounderProfile, type CreateProfileState } from "@/app/onboarding/actions";
import {
  GRADUATION_YEARS,
  USC_SCHOOLS,
  SKILLS,
  AREAS_OF_INTEREST,
  LOOKING_TO_CONNECT_WITH,
  MEMBER_TYPES,
  STATUS_OPTIONS,
} from "@/lib/profile-options";

const initialState: CreateProfileState = { error: null };
const USC_EMAIL_REGEX = /^[^\s@]+@usc\.edu$/i;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];

export default function OnboardingForm() {
  const [graduationYear, setGraduationYear] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [uscEmail, setUscEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");

  const [state, formAction, isPending] = useActionState(
    createFounderProfile,
    initialState
  );

  const emailIsInvalid =
    emailTouched && !USC_EMAIL_REGEX.test(uscEmail.trim());

  return (
    <form
      action={formAction}
      className="onboarding-form"
      onSubmit={(event) => {
        setEmailTouched(true);
        if (!USC_EMAIL_REGEX.test(uscEmail.trim()) || photoError) {
          event.preventDefault();
        }
      }}
    >
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-row">
        <label>
          First name
          <input name="firstName" type="text" required />
        </label>
        <label>
          Last name
          <input name="lastName" type="text" required />
        </label>
      </div>

      <fieldset className="profile-photo-section">
        <legend>Profile Photo (Optional)</legend>
        <p>
          Upload a photo to help other members recognize you. If you skip
          this, your initials will appear instead.
        </p>
        <label>
          Choose a photo
          <input
            type="file"
            name="profilePhoto"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            aria-describedby="profile-photo-help"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPhotoError(null);
              setPhotoName("");
              if (!file) return;
              if (!PHOTO_TYPES.includes(file.type)) {
                setPhotoError("Please choose a JPG, JPEG, or PNG image.");
                event.target.value = "";
                return;
              }
              if (file.size > MAX_PHOTO_SIZE) {
                setPhotoError("Your photo must be 2 MB or smaller.");
                event.target.value = "";
                return;
              }
              setPhotoName(file.name);
            }}
          />
        </label>
        <p id="profile-photo-help" className="form-help">
          JPG, JPEG, or PNG only. Maximum file size: 2 MB.
        </p>
        {photoName && <p className="form-help">Selected: {photoName}</p>}
        {photoError && (
          <p className="form-error" role="alert">
            {photoError}
          </p>
        )}
      </fieldset>

      <div className="form-field">
        <label htmlFor="uscEmail">USC email</label>
        <input
          id="uscEmail"
          name="uscEmail"
          type="email"
          placeholder="you@usc.edu"
          required
          value={uscEmail}
          onChange={(event) => setUscEmail(event.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={emailIsInvalid}
          aria-describedby={
            emailIsInvalid ? "usc-email-error" : "usc-email-help"
          }
        />
        {emailIsInvalid ? (
          <p id="usc-email-error" className="form-error" role="alert">
            Please use your USC email address ending in @usc.edu.
          </p>
        ) : (
          <p id="usc-email-help" className="form-help">
            A USC email address is required to join Find-a-Founder.
          </p>
        )}
      </div>

      <fieldset>
        <legend>I am a...</legend>
        <p>Select all that apply.</p>
        <div className="checkbox-grid">
          {MEMBER_TYPES.map((memberType) => (
            <label key={memberType}>
              <input type="checkbox" name="memberTypes" value={memberType} />
              {memberType}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-row">
        <label>
          Graduation year
          <select
            name="graduationYear"
            value={graduationYear}
            onChange={(event) => setGraduationYear(event.target.value)}
            required
          >
            <option value="">Select year</option>
            {GRADUATION_YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
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
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Degree / Program
        <input name="degreeProgram" type="text" placeholder="e.g. Computer Science" />
      </label>

      <div className="form-row">
        <label>
          Hometown
          <input name="hometown" type="text" placeholder="e.g. San Francisco" />
        </label>
        <label>
          Current location
          <input name="currentLocation" type="text" placeholder="e.g. Los Angeles" />
        </label>
      </div>

      <label>
        About you
        <textarea
          name="bio"
          rows={5}
          placeholder="Tell the USC community about yourself..."
          required
        />
      </label>

      <fieldset>
        <legend>What I Can Help With</legend>
        <p>Select the skills and expertise you can contribute to a team.</p>
        <div className="checkbox-grid">
          {SKILLS.map((skill) => (
            <label key={skill}>
              <input type="checkbox" name="whatICanHelpWith" value={skill} />
              {skill}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Areas of interest</legend>
        <p>What kinds of problems or industries interest you?</p>
        <div className="checkbox-grid">
          {AREAS_OF_INTEREST.map((interest) => (
            <label key={interest}>
              <input
                type="checkbox"
                name="areasOfInterest"
                value={interest}
                checked={areasOfInterest.includes(interest)}
                onChange={(event) => {
                  setAreasOfInterest((previous) =>
                    event.target.checked
                      ? [...previous, interest]
                      : previous.filter((item) => item !== interest)
                  );
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
        <p>What skills are you hoping to find in another collaborator?</p>
        <div className="checkbox-grid">
          {LOOKING_TO_CONNECT_WITH.map((role) => (
            <label key={role}>
              <input type="checkbox" name="lookingToConnectWith" value={role} />
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
        Current Status
        <select name="status" required>
          <option value="">Select your status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      <fieldset className="professional-links-section">
        <legend>Professional Links (Optional)</legend>
        <p className="professional-links-description">
          These links won't be displayed publicly on your profile. Other
          members can access them after sending you a connection request.
        </p>
        <div className="professional-links-fields">
          <label>
            LinkedIn URL
            <input
              name="linkedinUrl"
              type="url"
              placeholder="https://www.linkedin.com/in/yourname"
            />
          </label>
          <label>
            Portfolio / Personal Website
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://yourwebsite.com"
            />
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        className="onboarding-submit"
        disabled={isPending || emailIsInvalid || Boolean(photoError)}
      >
        {isPending ? "Creating Profile..." : "Create Profile"}
      </button>
    </form>
  );
}
