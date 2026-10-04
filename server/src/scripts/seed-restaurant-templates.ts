import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
import mongoose from 'mongoose';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';

const templates = [
  {
    name: 'Booking Confirmation',
    slug: 'booking-confirmation',
    event: 'booking.confirmed',
    message:
      'Hello {{customer_name}},\n\nYour booking at {{business_name}} is confirmed.\n\nBooking ID: {{booking_id}}\nDate: {{booking_date}}\nTime: {{booking_time}}\n\nThank you.',
    variables: [
      'customer_name',
      'business_name',
      'booking_id',
      'booking_date',
      'booking_time',
    ],
  },
  {
    name: 'Booking Cancellation',
    slug: 'booking-cancellation',
    event: 'booking.cancelled',
    message:
      'Hello {{customer_name}},\n\nYour booking {{booking_id}} at {{business_name}} has been cancelled.\n\nIf you need any assistance, please contact us.',
    variables: [
      'customer_name',
      'business_name',
      'booking_id',
    ],
  },
  {
    name: 'Booking Reminder',
    slug: 'booking-reminder',
    event: 'booking.reminder',
    message:
      'Hello {{customer_name}},\n\nThis is a reminder for your booking at {{business_name}}.\n\nBooking ID: {{booking_id}}\nDate: {{booking_date}}\nTime: {{booking_time}}\n\nWe look forward to serving you.',
    variables: [
      'customer_name',
      'business_name',
      'booking_id',
      'booking_date',
      'booking_time',
    ],
  },
  {
    name: 'Enquiry Received',
    slug: 'enquiry-received',
    event: 'enquiry.received',
    message:
      'Hello {{customer_name}},\n\nThank you for contacting {{business_name}}. We have received your enquiry and will get back to you shortly.',
    variables: [
      'customer_name',
      'business_name',
    ],
  },
  {
    name: 'Order Received',
    slug: 'order-received',
    event: 'order.received',
    message:
      'Hello {{customer_name}},\n\nYour order {{order_id}} has been received by {{business_name}}.\n\nWe will notify you when your order status changes.',
    variables: [
      'customer_name',
      'business_name',
      'order_id',
    ],
  },
  {
    name: 'Payment Confirmation',
    slug: 'payment-confirmation',
    event: 'payment.confirmed',
    message:
      'Hello {{customer_name}},\n\nPayment received successfully.\n\nAmount: {{amount}}\nPayment ID: {{payment_id}}\n\nThank you for your payment to {{business_name}}.',
    variables: [
      'customer_name',
      'business_name',
      'amount',
      'payment_id',
    ],
  },
  {
    name: 'Order Ready',
    slug: 'order-ready',
    event: 'order.ready',
    message:
      'Hello {{customer_name}},\n\nYour order {{order_id}} from {{business_name}} is ready.',
    variables: [
      'customer_name',
      'business_name',
      'order_id',
    ],
  },
  {
    name: 'Order Completed',
    slug: 'order-completed',
    event: 'order.completed',
    message:
      'Hello {{customer_name}},\n\nYour order {{order_id}} from {{business_name}} has been completed.\n\nThank you for choosing us.',
    variables: [
      'customer_name',
      'business_name',
      'order_id',
    ],
  },
  {
    name: 'Thank You',
    slug: 'thank-you',
    event: 'customer.thank_you',
    message:
      'Hello {{customer_name}},\n\nThank you for choosing {{business_name}}. We appreciate your business.',
    variables: [
      'customer_name',
      'business_name',
    ],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const category = await ClientCategory.findOneAndUpdate(
    { slug: 'restaurant' },
    {
      $set: {
        name: 'Restaurant',
        description: 'Restaurants, cafes and food service businesses.',
        active: true,
        displayOrder: 1,
      },
      $setOnInsert: {
        slug: 'restaurant',
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  const pack = await TemplatePack.findOneAndUpdate(
    {
      categoryId: category._id,
      slug: 'restaurant-standard',
    },
    {
      $set: {
        name: 'Restaurant Standard',
        description: 'Standard transactional notifications for restaurants.',
        active: true,
        isDefault: true,
        displayOrder: 1,
      },
      $setOnInsert: {
        categoryId: category._id,
        slug: 'restaurant-standard',
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];

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
          displayOrder: i + 1,
        },
        $setOnInsert: {
          templatePackId: pack._id,
          slug: template.slug,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  }

  category.defaultTemplatePackId = pack._id;
  await category.save();

  console.log('\n========================================');
  console.log('RESTAURANT TEMPLATE PACK SEEDED');
  console.log('========================================');
  console.log(`Category: ${category.name}`);
  console.log(`Category ID: ${category._id}`);
  console.log(`Default Pack: ${pack.name}`);
  console.log(`Pack ID: ${pack._id}`);
  console.log(`Templates: ${templates.length}`);
  console.log('========================================\n');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('\nERROR:', error);
  await mongoose.disconnect();
  process.exit(1);
});
