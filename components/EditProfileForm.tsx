
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  saveFounderProfile,
  type EditProfileState,
} from "@/app/profile/edit/actions";

import type { EditableFounderProfile } from "@/lib/airtable";

import {
  MEMBER_TYPES,
  SKILLS,
  AREAS_OF_INTEREST,
  LOOKING_TO_CONNECT_WITH,
  STATUS_OPTIONS,
} from "@/lib/profile-options";

type Props = {
  founder: EditableFounderProfile;
  profilePhoto: string | null;
};

const initialState: EditProfileState = {
  error: null,
  success: false,
};

export default function EditProfileForm({
  founder,
  profilePhoto,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    saveFounderProfile,
    initialState
  );

  const [customInterests, setCustomInterests] = useState<string[]>(
    founder.customInterests
  );

  const [newInterest, setNewInterest] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profilePhoto
  );
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function addInterest() {
    const value = newInterest.trim();

    if (
      value &&
      !customInterests.some(
        (interest) => interest.toLowerCase() === value.toLowerCase()
      )
    ) {
      setCustomInterests((previous) => [...previous, value]);
    }

    setNewInterest("");
  }

  function removeInterest(value: string) {
    setCustomInterests((previous) =>
      previous.filter((interest) => interest !== value)
    );
  }

  function handlePhotoChange(file?: File) {
    setPhotoError(null);

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Please select a JPG or PNG image.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be smaller than 2 MB.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="onboarding-form edit-profile-form">
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="form-success" role="status">
          Your profile has been updated successfully!
        </p>
      )}

      {/* Photo */}
      <fieldset className="edit-photo-section">
        <legend>Profile Photo</legend>

        <div className="edit-photo-row">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Your profile photo"
              className="edit-photo-preview"
            />
          ) : (
            <div className="edit-photo-placeholder">
              {founder.firstName.charAt(0)}
              {founder.lastName.charAt(0)}
            </div>
          )}

          <div>
            <button
              type="button"
              className="view-profile-button"
              onClick={() => photoInputRef.current?.click()}
            >
              Change Photo
            </button>

            <input
              ref={photoInputRef}
              type="file"
              name="profilePhoto"
              accept="image/jpeg,image/png"
              hidden
              onChange={(event) =>
                handlePhotoChange(event.target.files?.[0])
              }
            />

            <p className="form-help">
              JPG or PNG. Maximum 2 MB.
            </p>

            {photoError && (
              <p className="form-error">{photoError}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Name */}
      <div className="form-row">
        <label>
          First name
          <input
            name="firstName"
            defaultValue={founder.firstName}
            required
          />
        </label>

        <label>
          Last name
          <input
            name="lastName"
            defaultValue={founder.lastName}
            required
          />
        </label>
      </div>

      {/* Personal details */}
      <div className="form-row">
        <label>
          Hometown
          <input
            name="hometown"
            defaultValue={founder.hometown}
          />
        </label>

        <label>
          Current location
          <input
            name="currentLocation"
            defaultValue={founder.currentLocation}
          />
        </label>
      </div>

      <label>
        Degree / Program
        <input
          name="degreeProgram"
          defaultValue={founder.degreeProgram}
        />
      </label>

      <label>
        About you
        <textarea
          name="bio"
          rows={5}
          defaultValue={founder.bio}
          required
        />
      </label>

      {/* Member type */}
      <fieldset>
        <legend>I am a...</legend>

        <div className="checkbox-grid">
          {MEMBER_TYPES.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                name="memberTypes"
                value={type}
                defaultChecked={founder.memberTypes.includes(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Skills */}
      <fieldset>
        <legend>What I Can Help With</legend>

        <div className="checkbox-grid">
          {SKILLS.map((skill) => (
            <label key={skill}>
              <input
                type="checkbox"
                name="whatICanHelpWith"
                value={skill}
                defaultChecked={founder.whatICanHelpWith.includes(
                  skill
                )}
              />
              {skill}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Interests */}
      <fieldset>
        <legend>Areas of Interest</legend>

        <div className="checkbox-grid">
          {AREAS_OF_INTEREST.filter(
            (interest) => interest !== "Other"
          ).map((interest) => (
            <label key={interest}>
              <input
                type="checkbox"
                name="areasOfInterest"
                value={interest}
                defaultChecked={founder.areasOfInterest.includes(
                  interest
                )}
              />
              {interest}
            </label>
          ))}
        </div>

        <div className="custom-interests-editor">
          <label htmlFor="newInterest">
            Add another interest
          </label>

          <div className="custom-interest-input-row">
            <input
              id="newInterest"
              type="text"
              value={newInterest}
              placeholder="e.g. Space technology"
              onChange={(event) =>
                setNewInterest(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addInterest();
                }
              }}
            />

            <button type="button" onClick={addInterest}>
              Add
            </button>
          </div>

          <div className="tags custom-interest-tags">
            {customInterests.map((interest) => (
              <span className="tag" key={interest}>
                {interest}

                <button
                  type="button"
                  aria-label={`Remove ${interest}`}
                  onClick={() => removeInterest(interest)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
            type="hidden"
            name="customInterests"
            value={customInterests.join(",")}
          />
        </div>
      </fieldset>

      {/* Connections */}
      <fieldset>
        <legend>Looking to Connect With</legend>

        <div className="checkbox-grid">
          {LOOKING_TO_CONNECT_WITH.map((role) => (
            <label key={role}>
              <input
                type="checkbox"
                name="lookingToConnectWith"
                value={role}
                defaultChecked={founder.lookingToConnectWith.includes(
                  role
                )}
              />
              {role}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        What I'm Working On
        <textarea
          name="workingOn"
          rows={4}
          defaultValue={founder.workingOn}
        />
      </label>

      <label>
        Current Status
        <select
          name="status"
          defaultValue={founder.status}
          required
        >
          <option value="">Select status</option>

          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      {/* Private professional links */}
      <fieldset>
        <legend>Professional Links</legend>

        <p className="form-help">
          These links are only visible to founders whose connection
          requests you've accepted.
        </p>

        <label>
          LinkedIn URL
          <input
            type="url"
            name="linkedinUrl"
            defaultValue={founder.linkedinUrl}
            placeholder="https://linkedin.com/in/yourname"
          />
        </label>

        <label>
          Personal Website / Portfolio
          <input
            type="url"
            name="portfolioUrl"
            defaultValue={founder.portfolioUrl}
            placeholder="https://yourwebsite.com"
          />
        </label>
      </fieldset>

      {/* Actions */}
      <div className="edit-profile-actions">
        <button
          type="submit"
          className="onboarding-submit"
          disabled={isPending || Boolean(photoError)}
        >
          {isPending ? "Saving Changes..." : "Save Changes"}
        </button>

        <Link href="/profile">
          Cancel
        </Link>
      </div>
    </form>
  );
}
