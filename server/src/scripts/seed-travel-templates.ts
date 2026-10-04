import mongoose from 'mongoose';
import { env } from '../config/env';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';

const templates = [
  {
    name: 'Booking Confirmation',
    slug: 'booking-confirmation',
    event: 'booking.confirmed',
    message:
      'Dear {{customerName}}, your booking {{bookingId}} has been confirmed. Pickup: {{pickup}}. Drop: {{drop}}. Travel Date: {{travelDate}} at {{pickupTime}}. Thank you for choosing {{businessName}}.',
    variables: [
      'customerName',
      'bookingId',
      'pickup',
      'drop',
      'travelDate',
      'pickupTime',
      'businessName',
    ],
    displayOrder: 1,
  },
  {
    name: 'Driver & Vehicle Assigned',
    slug: 'driver-vehicle-assigned',
    event: 'driver_vehicle.assigned',
    message:
      'Dear {{customerName}}, your trip {{bookingId}} has been assigned. Driver: {{driverName}} ({{driverPhone}}). Vehicle: {{vehicleName}} - {{vehicleNumber}}. Pickup: {{pickup}}. Travel Date: {{travelDate}} at {{pickupTime}}.',
    variables: [
      'customerName',
      'bookingId',
      'driverName',
      'driverPhone',
      'vehicleName',
      'vehicleNumber',
      'pickup',
      'travelDate',
      'pickupTime',
    ],
    displayOrder: 2,
  },
  {
    name: 'Trip Details Confirmed',
    slug: 'trip-details-confirmed',
    event: 'trip.details_confirmed',
    message:
      'Dear {{customerName}}, your trip details for booking {{bookingId}} are confirmed. Pickup: {{pickup}}. Drop: {{drop}}. Date: {{travelDate}} at {{pickupTime}}. Driver: {{driverName}}. Vehicle: {{vehicleName}} - {{vehicleNumber}}.',
    variables: [
      'customerName',
      'bookingId',
      'pickup',
      'drop',
      'travelDate',
      'pickupTime',
      'driverName',
      'vehicleName',
      'vehicleNumber',
    ],
    displayOrder: 3,
  },
  {
    name: 'Trip Reminder',
    slug: 'trip-reminder',
    event: 'trip.reminder',
    message:
      'Dear {{customerName}}, this is a reminder for your trip {{bookingId}}. Pickup: {{pickup}}. Date: {{travelDate}} at {{pickupTime}}. Driver: {{driverName}}. Vehicle: {{vehicleNumber}}. Please be ready on time.',
    variables: [
      'customerName',
      'bookingId',
      'pickup',
      'travelDate',
      'pickupTime',
      'driverName',
      'vehicleNumber',
    ],
    displayOrder: 4,
  },
  {
    name: 'Trip Started',
    slug: 'trip-started',
    event: 'trip.started',
    message:
      'Dear {{customerName}}, your trip {{bookingId}} has started. Initial KM: {{initialKm}}. Driver: {{driverName}}. Vehicle: {{vehicleNumber}}. Have a safe journey.',
    variables: [
      'customerName',
      'bookingId',
      'initialKm',
      'driverName',
      'vehicleNumber',
    ],
    displayOrder: 5,
  },
  {
    name: 'Trip Ended',
    slug: 'trip-ended',
    event: 'trip.ended',
    message:
      'Dear {{customerName}}, your trip {{bookingId}} has ended. Initial KM: {{initialKm}}, Final KM: {{finalKm}}, Total KM: {{totalKm}}. Thank you for travelling with {{businessName}}.',
    variables: [
      'customerName',
      'bookingId',
      'initialKm',
      'finalKm',
      'totalKm',
      'businessName',
    ],
    displayOrder: 6,
  },
  {
    name: 'Bill Generated',
    slug: 'bill-generated',
    event: 'bill.generated',
    message:
      'Dear {{customerName}}, your bill for booking {{bookingId}} has been generated. Invoice No: {{invoiceNo}}. Total Amount: {{grandTotal}}. Thank you for choosing {{businessName}}.',
    variables: [
      'customerName',
      'bookingId',
      'invoiceNo',
      'grandTotal',
      'businessName',
    ],
    displayOrder: 7,
  },
  {
    name: 'Booking Cancelled',
    slug: 'booking-cancelled',
    event: 'booking.cancelled',
    message:
      'Dear {{customerName}}, your booking {{bookingId}} has been cancelled. If you need any assistance, please contact {{businessName}}.',
    variables: [
      'customerName',
      'bookingId',
      'businessName',
    ],
    displayOrder: 8,
  },
  {
    name: 'Feedback Request',
    slug: 'feedback-request',
    event: 'feedback.request',
    message:
      'Dear {{customerName}}, thank you for travelling with {{businessName}}. We would love to hear about your experience for booking {{bookingId}}. Your feedback helps us serve you better.',
    variables: [
      'customerName',
      'businessName',
      'bookingId',
    ],
    displayOrder: 9,
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);

  const category = await ClientCategory.findOneAndUpdate(
    { slug: 'travel-rent-a-car' },
    {
      $set: {
        name: 'Travel & Rent-a-Car',
        description: 'Travel, taxi, tour and rent-a-car notifications',
        active: true,
        displayOrder: 2,
      },
      $setOnInsert: {
        slug: 'travel-rent-a-car',
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  const pack = await TemplatePack.findOneAndUpdate(
    {
      categoryId: category._id,
      slug: 'travel-standard',
    },
    {
      $set: {
        name: 'Travel Standard',
        description: 'Standard transactional notifications for travel and rent-a-car clients',
        active: true,
        isDefault: true,
        displayOrder: 1,
      },
      $setOnInsert: {
        categoryId: category._id,
        slug: 'travel-standard',
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  await ClientCategory.findByIdAndUpdate(category._id, {
    defaultTemplatePackId: pack._id,
  });

  for (const template of templates) {
    await NotificationTemplate.findOneAndUpdate(
      {
        templatePackId: pack._id,
        slug: template.slug,
      },
      {
        $set: {
          name: template.name,
          event: template.event,
          message: template.message,
          variables: template.variables,
          active: true,
          displayOrder: template.displayOrder,
        },
        $setOnInsert: {
          templatePackId: pack._id,
          slug: template.slug,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  console.log('Travel category:', category._id.toString());
  console.log('Travel template pack:', pack._id.toString());
  console.log('Templates seeded:', templates.length);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
