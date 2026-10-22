"use client";

import { useEffect, useState } from "react";

import {
  getConnectedFounderContact,
} from "@/app/connections/contact-actions";

type Contact = {
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
};

export default function ContactPopup({
  founderId,
  onClose,
}: {
  founderId: string;
  onClose: () => void;
}) {
  const [contact, setContact] =
    useState<Contact | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getConnectedFounderContact(founderId)
      .then((result) => {
        if (active) setContact(result);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load contact details.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [founderId]);

  function safeLink(value: string | null) {
    if (!value) return null;

    try {
      const url = new URL(value);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password
      ) {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }

  const linkedin = safeLink(contact?.linkedinUrl ?? null);
  const portfolio = safeLink(contact?.portfolioUrl ?? null);

  return (
    <div
      className="founder-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="founder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-popup-title"
      >
        <button
          type="button"
          className="founder-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="contact-popup-title">
          🎉 You're connected!
        </h2>

        {loading && <p>Loading contact details...</p>}

        {error && <p role="alert">{error}</p>}

        {contact && (
          <>
            <p>
              You can now reach out to{" "}
              <strong>{contact.name}</strong>.
            </p>

            <div className="founder-contact-list">
              {contact.email && (
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        contact.email
                      )
                    }
                  >
                    Copy
                  </button>
                </div>
              )}

              {contact.phone && (
                <div>
                  <strong>Phone</strong>
                  <a href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        contact.phone!
                      )
                    }
                  >
                    Copy
                  </button>
                </div>
              )}

              {linkedin && (
                <div>
                  <strong>LinkedIn</strong>
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open LinkedIn ↗
                  </a>
                </div>
              )}

              {portfolio && (
                <div>
                  <strong>Portfolio</strong>
                  <a
                    href={portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Portfolio ↗
                  </a>
                </div>
              )}
            </div>

            <p className="form-help">
              You can access these details again from
              the founder's profile while connected.
            </p>
          </>
        )}

        <button
          type="button"
          className="opportunity-primary-link"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}