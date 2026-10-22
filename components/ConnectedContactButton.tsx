"use client";

import { useState } from "react";
import ContactPopup from "@/components/ContactPopup";

export default function ConnectedContactButton({
  founderId,
}: {
  founderId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="opportunity-primary-link"
        onClick={() => setOpen(true)}
      >
        View Contact Details →
      </button>

      {open && (
        <ContactPopup
          founderId={founderId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}