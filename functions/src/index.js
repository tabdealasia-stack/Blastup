import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
admin.initializeApp();
// Define the secret for the TABDEAL API Key
const tabdealApiKey = defineSecret("TABDEAL_API_KEY");
/**
 * Reusable server-side TABDEAL API client.
 */
async function sendTabdealNotification(params) {
    const payload = {
        event: params.event,
        eventId: params.eventId,
        to: params.to,
        variables: params.variables,
    };
    try {
        const response = await fetch("http://localhost:3001/api/notifications/event", {
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
    }
    catch (error) {
        console.error("[TABDEAL] Notification HTTP error:", error.message || error);
        return { success: false, error: error.message };
    }
}
/**
 * Firestore trigger for booking status changes.
 */
export const onBookingUpdated = onDocumentUpdated({
    document: "bookings/{bookingId}",
    secrets: [tabdealApiKey],
}, async (event) => {
    if (!event.data) {
        return;
    }
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const previousStatus = beforeData.status;
    const currentStatus = afterData.status;
    // The actual "Confirmed" state in godivine.html is "Assigned"
    if (previousStatus !== "Assigned" && currentStatus === "Assigned") {
        const apiKey = tabdealApiKey.value();
        if (!apiKey) {
            console.error("TABDEAL_API_KEY secret is not configured.");
            return;
        }
        const eventId = event.data.after.id; // Actual Firestore document ID
        const to = afterData.phone;
        const variables = {
            customerName: afterData.name || "",
            bookingId: `DIV/2026/${afterData.displayId || eventId.substring(0, 8)}`,
        };
        console.log(`Triggering TABDEAL booking.confirmed for eventId: ${eventId}`);
        // We do not await this if we want to ensure we don't throw back to Firestore and cause a retry
        // But we can await and catch all errors so it never rolls back the transaction (even though Firestore background triggers don't rollback anyway).
        await sendTabdealNotification({
            event: "booking.confirmed",
            eventId: eventId,
            to: to,
            variables: variables,
            apiKey: apiKey,
        });
    }
});
