import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();

// Define the secret for the TABDEAL API Key
const tabdealApiKey = defineSecret("TABDEAL_API_KEY");

/**
 * Reusable server-side TABDEAL API client.
 */
export async function sendTabdealNotification(params: {
  event: string;
  eventId: string;
  to: string;
  variables: Record<string, string>;
  apiKey: string;
}) {
  const payload = {
    event: params.event,
    eventId: params.eventId,
    to: params.to,
    variables: params.variables,
  };

  try {
    const apiUrl = process.env.TABDEAL_API_URL || "https://blastup.example.com/api/notifications/event";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TABDEAL] Notification failed with status ${response.status}. Diagnostics: ${errText}`);
      return { success: false, status: response.status };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[TABDEAL] Notification HTTP error:", error.message || error);
    return { success: false, error: error.message };
  }
}

/**
 * Firestore trigger for booking status changes.
 */
export const onBookingUpdated = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    secrets: [tabdealApiKey],
  },
  async (event) => {
    if (!event.data) {
      return;
    }

    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    const previousStatus = beforeData.status;
    const currentStatus = afterData.status;

    const apiKey = tabdealApiKey.value();
    if (!apiKey) {
      console.error("TABDEAL_API_KEY secret is not configured.");
      return;
    }

    const eventId = event.data.after.id; // Actual Firestore document ID
    const to = afterData.phone;
    if (!to) return;
    
    const displayId = `DIV/2026/${afterData.displayId || eventId.substring(0, 8)}`;
    const customerName = afterData.name || "";

    // Helper for sending notifications safely without throwing errors back to Firestore
    const sendEvent = async (eventName: string, eventIdStr: string, vars: Record<string, string>) => {
      console.log(`Triggering TABDEAL ${eventName} for eventId: ${eventIdStr}`);
      await sendTabdealNotification({
        event: eventName,
        eventId: eventIdStr,
        to: to,
        variables: { customerName, bookingId: displayId, ...vars },
        apiKey: apiKey,
      });
    };

    // 1. booking.confirmed (Existing logic)
    if (previousStatus !== "Assigned" && currentStatus === "Assigned") {
      await sendEvent("booking.confirmed", eventId, {});
    }

    // 2. driver_vehicle.assigned
    if (currentStatus === "Assigned" && afterData.driverName && afterData.driverVehicle) {
      const driverChanged = beforeData.driverPhone !== afterData.driverPhone || beforeData.driverName !== afterData.driverName || beforeData.driverVehicle !== afterData.driverVehicle;
      const statusJustAssigned = previousStatus !== "Assigned" && currentStatus === "Assigned";
      
      if (statusJustAssigned || driverChanged) {
        // Use driverPhone in eventId so if it changes, we send a new one
        const cleanPhone = (afterData.driverPhone || "").replace(/[^0-9]/g, '');
        await sendEvent("driver_vehicle.assigned", `${eventId}-drv-${cleanPhone}`, {
          driverName: afterData.driverName,
          driverPhone: afterData.driverPhone || "",
          vehicleNo: afterData.driverVehicle,
        });
      }
    }

    // 3. trip.details_confirmed
    if (afterData.detailsConfirmed === true && beforeData.detailsConfirmed !== true) {
      await sendEvent("trip.details_confirmed", `${eventId}-details`, {
        pickup: afterData.from || "",
        date: afterData.date || "",
      });
    }

    // 4. trip.reminder
    if (afterData.reminderSent === true && beforeData.reminderSent !== true) {
      await sendEvent("trip.reminder", `${eventId}-reminder`, {
        date: afterData.date || "",
        driverName: afterData.driverName || "your driver",
      });
    }

    // 5. trip.started
    if (afterData.tripStarted === true && beforeData.tripStarted !== true) {
      await sendEvent("trip.started", `${eventId}-started`, {});
    }

    // 6. trip.ended
    if (afterData.tripEnded === true && beforeData.tripEnded !== true) {
      await sendEvent("trip.ended", `${eventId}-ended`, {});
    }

    // 7. bill.generated & 8. feedback.request
    if (currentStatus === "Completed" && previousStatus !== "Completed" && afterData.invData) {
      const grandTotal = afterData.invData.grand || 0;
      const startKm = afterData.invData.startKm || "0";
      const endKm = afterData.invData.endKm || "0";

      await sendEvent("bill.generated", `${eventId}-bill`, {
        totalAmount: grandTotal.toString(),
        startKm: startKm.toString(),
        endKm: endKm.toString(),
      });

      await sendEvent("feedback.request", `${eventId}-feedback`, {});
    }

    // 9. booking.cancelled
    if (currentStatus === "Cancelled" && previousStatus !== "Cancelled") {
      await sendEvent("booking.cancelled", `${eventId}-cancelled`, {});
    }
  }
);
