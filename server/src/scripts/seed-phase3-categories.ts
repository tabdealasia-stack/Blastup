import mongoose from 'mongoose';
import { env } from '../config/env';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';

const newCategories = [
  {
    name: 'Events & Ticketing',
    slug: 'events-ticketing',
    description: 'Event management, ticketing, and attendee notifications.',
    packs: [
      {
        name: 'Events Standard',
        slug: 'events-standard',
        description: 'Standard event and ticketing notification workflow.',
        templates: [
          { slug: 'ticket-confirmed', name: 'Ticket Confirmed', event: 'ticket.confirmed', message: 'Hello {{customerName}}, your ticket for {{eventName}} is confirmed. Ticket ID: {{ticketId}}.', variables: ['customerName', 'eventName', 'ticketId'] },
          { slug: 'ticket-details', name: 'Ticket Details', event: 'ticket.details', message: 'Here are the details for your ticket {{ticketId}}: Venue: {{venueName}}, Date: {{eventDate}} at {{eventTime}}.', variables: ['ticketId', 'venueName', 'eventDate', 'eventTime'] },
          { slug: 'event-reminder', name: 'Event Reminder', event: 'event.reminder', message: 'Reminder: {{eventName}} is scheduled for {{eventDate}} at {{eventTime}} at {{venueName}}.', variables: ['eventName', 'eventDate', 'eventTime', 'venueName'] },
          { slug: 'event-schedule-changed', name: 'Event Schedule Changed', event: 'event.schedule_changed', message: 'Important: The schedule for {{eventName}} has been changed to {{eventDate}} at {{eventTime}}.', variables: ['eventName', 'eventDate', 'eventTime'] },
          { slug: 'event-venue-changed', name: 'Event Venue Changed', event: 'event.venue_changed', message: 'Important: The venue for {{eventName}} has been changed to {{venueName}}.', variables: ['eventName', 'venueName'] },
          { slug: 'ticket-cancelled', name: 'Ticket Cancelled', event: 'ticket.cancelled', message: 'Hello {{customerName}}, your ticket {{ticketId}} for {{eventName}} has been cancelled.', variables: ['customerName', 'ticketId', 'eventName'] },
          { slug: 'ticket-refund', name: 'Ticket Refund', event: 'ticket.refund', message: 'Hello {{customerName}}, a refund of {{amount}} for ticket {{ticketId}} has been processed.', variables: ['customerName', 'amount', 'ticketId'] },
          { slug: 'event-started', name: 'Event Started', event: 'event.started', message: 'Welcome! {{eventName}} has officially started. Enjoy the event.', variables: ['eventName'] },
          { slug: 'event-feedback', name: 'Event Feedback', event: 'event.feedback', message: 'Hello {{customerName}}, we hope you enjoyed {{eventName}}. Please share your feedback.', variables: ['customerName', 'eventName'] }
        ]
      }
    ]
  },
  {
    name: 'Finance & Banking',
    slug: 'finance-banking',
    description: 'Banking, loans, EMI, and financial transaction notifications.',
    packs: [
      {
        name: 'Finance Standard',
        slug: 'finance-standard',
        description: 'Standard finance and banking workflow.',
        templates: [
          { slug: 'kyc-approved', name: 'KYC Approved', event: 'kyc.approved', message: 'Hello {{customerName}}, your KYC application has been approved successfully.', variables: ['customerName'] },
          { slug: 'kyc-rejected', name: 'KYC Rejected', event: 'kyc.rejected', message: 'Hello {{customerName}}, your KYC application has been rejected. Please contact support.', variables: ['customerName'] },
          { slug: 'loan-application-received', name: 'Loan Application Received', event: 'loan.application_received', message: 'Hello {{customerName}}, your loan application has been received and is under review.', variables: ['customerName'] },
          { slug: 'loan-approved', name: 'Loan Approved', event: 'loan.approved', message: 'Congratulations {{customerName}}, your loan application has been approved.', variables: ['customerName'] },
          { slug: 'loan-disbursed', name: 'Loan Disbursed', event: 'loan.disbursed', message: 'Hello {{customerName}}, your loan amount of {{amount}} has been disbursed to your account.', variables: ['customerName', 'amount'] },
          { slug: 'emi-reminder', name: 'EMI Reminder', event: 'emi.reminder', message: 'Reminder: Your EMI of {{amount}} is due on {{dueDate}}. Please ensure sufficient balance.', variables: ['amount', 'dueDate'] },
          { slug: 'payment-received', name: 'Payment Received', event: 'payment.received', message: 'Hello {{customerName}}, your payment of {{amount}} has been received successfully. Ref: {{paymentId}}.', variables: ['customerName', 'amount', 'paymentId'] },
          { slug: 'payment-failed', name: 'Payment Failed', event: 'payment.failed', message: 'Alert: Your recent payment of {{amount}} failed. Please try again.', variables: ['amount'] },
          { slug: 'payment-bounced', name: 'Payment Bounced', event: 'payment.bounced', message: 'Alert: Your scheduled payment of {{amount}} has bounced. Please clear the dues immediately.', variables: ['amount'] },
          { slug: 'account-transaction', name: 'Account Transaction', event: 'account.transaction', message: 'Transaction Alert: An amount of {{amount}} was processed on your account. Ref: {{paymentId}}.', variables: ['amount', 'paymentId'] }
        ]
      }
    ]
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Policy, premium, claims, and insurance lifecycle notifications.',
    packs: [
      {
        name: 'Insurance Standard',
        slug: 'insurance-standard',
        description: 'Standard insurance workflow.',
        templates: [
          { slug: 'policy-application-received', name: 'Policy Application Received', event: 'policy.application_received', message: 'Hello {{customerName}}, your insurance policy application has been received.', variables: ['customerName'] },
          { slug: 'policy-issued', name: 'Policy Issued', event: 'policy.issued', message: 'Congratulations {{customerName}}, your policy {{policyNumber}} has been issued.', variables: ['customerName', 'policyNumber'] },
          { slug: 'premium-reminder', name: 'Premium Reminder', event: 'premium.reminder', message: 'Reminder: Your premium of {{amount}} for policy {{policyNumber}} is due on {{dueDate}}.', variables: ['amount', 'policyNumber', 'dueDate'] },
          { slug: 'premium-received', name: 'Premium Received', event: 'premium.received', message: 'Hello {{customerName}}, we have received your premium payment of {{amount}} for policy {{policyNumber}}.', variables: ['customerName', 'amount', 'policyNumber'] },
          { slug: 'policy-renewal', name: 'Policy Renewal', event: 'policy.renewal', message: 'Hello {{customerName}}, your policy {{policyNumber}} is up for renewal on {{dueDate}}.', variables: ['customerName', 'policyNumber', 'dueDate'] },
          { slug: 'claim-registered', name: 'Claim Registered', event: 'claim.registered', message: 'Hello {{customerName}}, your claim {{claimId}} for policy {{policyNumber}} has been registered.', variables: ['customerName', 'claimId', 'policyNumber'] },
          { slug: 'claim-updated', name: 'Claim Updated', event: 'claim.updated', message: 'Update: Your claim {{claimId}} status has changed. Please check your portal for details.', variables: ['claimId'] },
          { slug: 'claim-approved', name: 'Claim Approved', event: 'claim.approved', message: 'Hello {{customerName}}, your claim {{claimId}} has been approved for the amount of {{amount}}.', variables: ['customerName', 'claimId', 'amount'] },
          { slug: 'claim-rejected', name: 'Claim Rejected', event: 'claim.rejected', message: 'Hello {{customerName}}, we regret to inform you that your claim {{claimId}} has been rejected.', variables: ['customerName', 'claimId'] },
          { slug: 'policy-cancelled', name: 'Policy Cancelled', event: 'policy.cancelled', message: 'Hello {{customerName}}, your policy {{policyNumber}} has been cancelled as per your request or terms.', variables: ['customerName', 'policyNumber'] }
        ]
      }
    ]
  },
  {
    name: 'NGO & Charity',
    slug: 'ngo-charity',
    description: 'Donations, volunteers, and campaign updates.',
    packs: [
      {
        name: 'NGO Standard',
        slug: 'ngo-standard',
        description: 'Standard NGO and charity workflow.',
        templates: [
          { slug: 'donation-received', name: 'Donation Received', event: 'donation.received', message: 'Dear {{customerName}}, thank you for your generous donation of {{amount}}.', variables: ['customerName', 'amount'] },
          { slug: 'donation-receipt', name: 'Donation Receipt', event: 'donation.receipt', message: 'Dear {{customerName}}, your donation receipt for {{amount}} is available. Ref: {{paymentId}}.', variables: ['customerName', 'amount', 'paymentId'] },
          { slug: 'donation-tax-receipt', name: 'Donation Tax Receipt', event: 'donation.tax_receipt', message: 'Dear {{customerName}}, your tax exemption receipt for your donation of {{amount}} is ready.', variables: ['customerName', 'amount'] },
          { slug: 'volunteer-registered', name: 'Volunteer Registered', event: 'volunteer.registered', message: 'Hello {{customerName}}, thank you for registering as a volunteer for {{eventName}}.', variables: ['customerName', 'eventName'] },
          { slug: 'volunteer-confirmed', name: 'Volunteer Confirmed', event: 'volunteer.confirmed', message: 'Hello {{customerName}}, your volunteer shift for {{eventName}} on {{eventDate}} is confirmed.', variables: ['customerName', 'eventName', 'eventDate'] },
          { slug: 'volunteer-reminder', name: 'Volunteer Reminder', event: 'volunteer.reminder', message: 'Reminder: You have a volunteer shift for {{eventName}} on {{eventDate}} at {{eventTime}}.', variables: ['eventName', 'eventDate', 'eventTime'] },
          { slug: 'campaign-update', name: 'Campaign Update', event: 'campaign.update', message: 'Update: Our campaign {{eventName}} has reached a new milestone! Thank you for your support.', variables: ['eventName'] },
          { slug: 'event-reminder', name: 'Event Reminder', event: 'event.reminder', message: 'Reminder: Our charity event {{eventName}} is happening on {{eventDate}} at {{venueName}}.', variables: ['eventName', 'eventDate', 'venueName'] },
          { slug: 'donor-thank-you', name: 'Donor Thank You', event: 'donor.thank_you', message: 'Dear {{customerName}}, your support makes our work possible. Thank you from our entire team.', variables: ['customerName'] }
        ]
      }
    ]
  }
];

async function seedPhase3() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected.');

  // Validate that no slugs are already used unexpectedly
  for (const cat of newCategories) {
    const existingCat = await ClientCategory.findOne({ slug: cat.slug });
    if (existingCat) {
      if (existingCat.name !== cat.name) {
        throw new Error(`Category conflict: ${cat.slug} exists but name is "${existingCat.name}" instead of "${cat.name}"`);
      }
    }

    for (const pack of cat.packs) {
      if (existingCat) {
        const existingPack = await TemplatePack.findOne({ categoryId: existingCat._id, slug: pack.slug });
        if (existingPack) {
          if (existingPack.name !== pack.name) {
            throw new Error(`Pack conflict: ${pack.slug} exists but name is "${existingPack.name}" instead of "${pack.name}"`);
          }
        }
      }
      
      // Verify event names format strictly
      for (const tmpl of pack.templates) {
        const isValidEvent = /^[a-z0-9_]+\.[a-z0-9_]+$/.test(tmpl.event);
        if (!isValidEvent) {
            throw new Error(`Invalid event name format: ${tmpl.event} in template ${tmpl.slug}`);
        }
      }
    }
  }

  // Strict Insert Logic
  for (let c = 0; c < newCategories.length; c++) {
    const catDef = newCategories[c];
    let cat = await ClientCategory.findOne({ slug: catDef.slug });
    if (!cat) {
      cat = await ClientCategory.create({
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        active: true,
        displayOrder: 17 + c
      });
      console.log(`Created Category: ${cat.name}`);
    } else {
      console.log(`Verified Category (Already Exists): ${cat.name}`);
    }

    for (let p = 0; p < catDef.packs.length; p++) {
      const packDef = catDef.packs[p];
      let pack = await TemplatePack.findOne({ categoryId: cat._id, slug: packDef.slug });
      if (!pack) {
        pack = await TemplatePack.create({
          name: packDef.name,
          slug: packDef.slug,
          categoryId: cat._id,
          description: packDef.description,
          active: true,
          isDefault: true,
          displayOrder: 1
        });
        console.log(`  Created Pack: ${pack.name}`);
        
        if (!cat.defaultTemplatePackId) {
            cat.defaultTemplatePackId = pack._id as mongoose.Types.ObjectId;
            await cat.save();
        }
      } else {
        console.log(`  Verified Pack (Already Exists): ${pack.name}`);
      }

      for (let t = 0; t < packDef.templates.length; t++) {
        const tmplDef = packDef.templates[t];
        let tmpl = await NotificationTemplate.findOne({ templatePackId: pack._id, slug: tmplDef.slug });
        if (!tmpl) {
          tmpl = await NotificationTemplate.create({
            name: tmplDef.name,
            slug: tmplDef.slug,
            templatePackId: pack._id,
            event: tmplDef.event,
            message: tmplDef.message,
            variables: tmplDef.variables,
            active: true,
            displayOrder: t + 1
          });
          console.log(`    Created Template: ${tmpl.name} (${tmpl.event})`);
        } else {
            // Verify event matches
            if (tmpl.event !== tmplDef.event) {
                throw new Error(`Template conflict: ${tmpl.slug} exists with event "${tmpl.event}" instead of "${tmplDef.event}"`);
            }
            console.log(`    Verified Template (Already Exists): ${tmpl.name} (${tmpl.event})`);
        }
      }
    }
  }

  console.log('Phase 3 Seed Execution Complete.');
  await mongoose.disconnect();
}

seedPhase3().catch(async (err) => {
  console.error('SEED FAILED:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
