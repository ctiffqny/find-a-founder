
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  getFounderByAuthUserId,
  getFounderById,
} from "@/lib/airtable";

import {
  createConnectionRequest,
  getConnectionRequestById,
  getConnectionRequestsForFounder,
  updateConnectionRequestStatus,
  markConnectionEmailSent,
} from "@/lib/connections";

import { sendConnectionRequestEmail } from "@/lib/email";

type ActionResult = {
  success: boolean;
  message: string;
};

async function getCurrentFounder() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Please sign in to continue.");
  }

  const founder = await getFounderByAuthUserId(userId);

  if (!founder || !founder.profileCompleted) {
    throw new Error(
      "Please complete your founder profile first."
    );
  }

  return founder;
}


async function getFounderEmail(
  founderId: string
): Promise<{ email: string; name: string }> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN;

  if (!baseId || !token) {
    throw new Error("Missing Airtable configuration.");
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/Founders/${encodeURIComponent(founderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve recipient email.");
  }

  const record = await response.json();

  return {
    email: record.fields?.["USC Email"] ?? "",
    name: record.fields?.["Name"] ?? "Founder",
  };
}


// Send a new connection request.
export async function sendConnectionRequest(
  recipientFounderId: string,
  message: string
): Promise<ActionResult> {
  try {
    const sender = await getCurrentFounder();

    if (!/^rec[a-zA-Z0-9]+$/.test(recipientFounderId)) {
      return {
        success: false,
        message: "Invalid recipient.",
      };
    }

    if (sender.id === recipientFounderId) {
      return {
        success: false,
        message: "You cannot connect with yourself.",
      };
    }

    const recipient = await getFounderById(
      recipientFounderId
    );

    if (!recipient) {
      return {
        success: false,
        message: "This founder is not available.",
      };
    }

    const cleanedMessage = message.trim();

    if (cleanedMessage.length > 1000) {
      return {
        success: false,
        message: "Your message must be 1000 characters or fewer.",
      };
    }

    const existingRequests =
      await getConnectionRequestsForFounder(sender.id);

    const existingConnection = existingRequests.find(
      (request) =>
        (request.fromFounderId === sender.id &&
          request.toFounderId === recipientFounderId) ||
        (request.fromFounderId === recipientFounderId &&
          request.toFounderId === sender.id)
    );

    if (existingConnection) {
      if (existingConnection.status === "Accepted") {
        return {
          success: false,
          message: "You're already connected with this founder.",
        };
      }

      if (existingConnection.status === "Pending") {
        return {
          success: false,
          message: "A connection request is already pending.",
        };
      }

      // A declined request stays in the history.
      // We'll design a resend policy later.
      return {
        success: false,
        message:
          "A previous request exists between these founders.",
      };
    }

    
    const request = await createConnectionRequest(
    sender.id,
    recipientFounderId,
    cleanedMessage
    );

    // Send the email after Airtable saves the request.
    // Email failures must not cancel the connection request.
    try {
    const recipientInfo = await getFounderEmail(
        recipientFounderId
    );

    if (!recipientInfo.email) {
        console.error(
        "Recipient does not have an email address in Airtable."
        );
    } else {
        await sendConnectionRequestEmail({
        recipientEmail: recipientInfo.email,
        recipientName: recipientInfo.name,
        senderName: sender.name,
        });

        await markConnectionEmailSent(request.id);
    }
    } catch (emailError) {
    console.error(
        "Connection request saved, but email notification failed:",
        emailError
    );
    }


    revalidatePath("/connections");
    revalidatePath(`/founders/${recipientFounderId}`);

    return {
      success: true,
      message: "Connection request sent!",
    };
  } catch (error) {
    console.error("Send connection request failed:", error);

    return {
      success: false,
      message: "Unable to send connection request.",
    };
  }
}

// Accept or decline an incoming request.
export async function respondToConnectionRequest(
  requestId: string,
  decision: "Accepted" | "Declined"
): Promise<ActionResult> {
  try {
    const currentFounder = await getCurrentFounder();

    if (!/^rec[a-zA-Z0-9]+$/.test(requestId)) {
      return {
        success: false,
        message: "Invalid connection request.",
      };
    }

    if (
      decision !== "Accepted" &&
      decision !== "Declined"
    ) {
      return {
        success: false,
        message: "Invalid decision.",
      };
    }

    const request = await getConnectionRequestById(requestId);

    if (!request) {
      return {
        success: false,
        message: "Connection request not found.",
      };
    }

    if (request.toFounderId !== currentFounder.id) {
      return {
        success: false,
        message: "You cannot respond to this request.",
      };
    }

    if (request.status !== "Pending") {
      return {
        success: false,
        message: "This request has already been handled.",
      };
    }

    await updateConnectionRequestStatus(
      requestId,
      decision
    );

    revalidatePath("/connections");
    revalidatePath(`/founders/${request.fromFounderId}`);
    revalidatePath(`/founders/${request.toFounderId}`);

    return {
      success: true,
      message:
        decision === "Accepted"
          ? "Connection accepted!"
          : "Connection declined.",
    };
  } catch (error) {
    console.error("Respond to connection request failed:", error);

    return {
      success: false,
      message: "Unable to update connection request.",
    };
  }
}
