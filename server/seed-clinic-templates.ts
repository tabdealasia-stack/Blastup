import mongoose from 'mongoose';
import { ClientCategory } from './src/models/ClientCategory';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import ClientTemplate from './src/models/ClientTemplate';
import dotenv from 'dotenv';
dotenv.config();

const missingTemplates = [
  // Patient flow
  { event: 'appointment.rescheduled', name: 'Appointment Rescheduled', vars: ['patient_name', 'doctor_name', 'date', 'time'], msg: 'Hello {{patient_name}}, your appointment with {{doctor_name}} has been rescheduled to {{date}} at {{time}}.' },
  { event: 'appointment.cancelled', name: 'Appointment Cancelled', vars: ['patient_name', 'doctor_name', 'date', 'time'], msg: 'Hello {{patient_name}}, your appointment with {{doctor_name}} on {{date}} at {{time}} has been cancelled.' },
  { event: 'consultation.completed', name: 'Consultation Completed', vars: ['patient_name', 'doctor_name'], msg: 'Hello {{patient_name}}, your consultation with {{doctor_name}} is complete. Thank you for visiting.' },
  { event: 'payment.pending', name: 'Payment Pending', vars: ['patient_name', 'amount'], msg: 'Hello {{patient_name}}, you have a pending payment of {{amount}}. Please complete it at your earliest convenience.' },
  { event: 'patient.feedback', name: 'Patient Feedback', vars: ['patient_name', 'feedback_link'], msg: 'Hello {{patient_name}}, please share your feedback on your recent visit: {{feedback_link}}' },
  
  // Chemist flow
  { event: 'prescription.received', name: 'Prescription Received', vars: ['chemist_name', 'patient_name', 'prescription_id'], msg: 'Hello {{chemist_name}}, you have received a new prescription {{prescription_id}} for {{patient_name}}.' },
  { event: 'medicine.order_received', name: 'Medicine Order Received', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, we have received your medicine order {{order_id}}.' },
  { event: 'medicine.order_confirmed', name: 'Medicine Order Confirmed', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your medicine order {{order_id}} is confirmed and being processed.' },
  { event: 'medicine.ready', name: 'Medicine Ready', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your medicine order {{order_id}} is ready for pickup.' },
  { event: 'medicine.dispatched', name: 'Medicine Dispatched', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your medicine order {{order_id}} has been dispatched.' },
  { event: 'medicine.delivered', name: 'Medicine Delivered', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your medicine order {{order_id}} has been delivered.' },
  { event: 'medicine.unavailable', name: 'Medicine Unavailable', vars: ['patient_name', 'medicine_name'], msg: 'Hello {{patient_name}}, the medicine {{medicine_name}} is currently unavailable.' },
  { event: 'medicine.substitution_required', name: 'Medicine Substitution Required', vars: ['doctor_name', 'patient_name', 'medicine_name'], msg: 'Hello {{doctor_name}}, a substitution is required for {{medicine_name}} prescribed to {{patient_name}}.' },
  { event: 'medicine.payment_received', name: 'Medicine Payment Received', vars: ['patient_name', 'amount'], msg: 'Hello {{patient_name}}, we have received your payment of {{amount}} for your medicines.' },
  { event: 'medicine.refill_reminder', name: 'Medicine Refill Reminder', vars: ['patient_name', 'medicine_name'], msg: 'Hello {{patient_name}}, this is a reminder to refill your prescription for {{medicine_name}}.' },
  
  // Coordination flow
  { event: 'prescription.sent_to_pharmacy', name: 'Prescription Sent to Pharmacy', vars: ['patient_name', 'chemist_name'], msg: 'Hello {{patient_name}}, your prescription has been sent directly to {{chemist_name}}.' },
  { event: 'medicine.availability_confirmed', name: 'Medicine Availability Confirmed', vars: ['doctor_name', 'patient_name'], msg: 'Hello {{doctor_name}}, all medicines for {{patient_name}} are available.' },
  { event: 'medicine.partial_availability', name: 'Medicine Partial Availability', vars: ['doctor_name', 'patient_name', 'missing_medicines'], msg: 'Hello {{doctor_name}}, some medicines for {{patient_name}} are unavailable: {{missing_medicines}}.' },
  { event: 'medicine.order_ready', name: 'Medicine Order Ready', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your complete medicine order {{order_id}} is now ready.' },
  { event: 'medicine.order_completed', name: 'Medicine Order Completed', vars: ['patient_name', 'order_id'], msg: 'Hello {{patient_name}}, your medicine order {{order_id}} is fully completed. Thank you.' },
];

async function seedClinic() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    // Record baselines
    const preCategoryCount = await ClientCategory.countDocuments();
    const prePackCount = await TemplatePack.countDocuments();
    const preTemplateCount = await NotificationTemplate.countDocuments();
    const preClientTemplateCount = await ClientTemplate.countDocuments();
    const dtClient = await mongoose.connection.collection('clients').findOne({ slug: 'divine-tours' });
    const preDtCount = dtClient ? await ClientTemplate.countDocuments({ clientId: dtClient._id }) : 0;
    console.log(`Pre-Seed Baseline -> Categories: ${preCategoryCount}, Packs: ${prePackCount}, Master Templates: ${preTemplateCount}, ClientTemplates: ${preClientTemplateCount}, DivineTours CTs: ${preDtCount}`);

    const category = await ClientCategory.findOne({ slug: 'clinic-healthcare' });
    if (!category) throw new Error('Clinic category not found!');
    
    const pack = await TemplatePack.findOne({ categoryId: category._id });
    if (!pack) throw new Error('Clinic TemplatePack not found!');

    console.log(`Existing Clinic Category ID: ${category._id}, Pack ID: ${pack._id}`);

    const existingTemplates = await NotificationTemplate.find({ templatePackId: pack._id });
    const existingEvents = new Set(existingTemplates.map(t => t.event));

    let createdCount = 0;
    let skippedCount = 0;
    let highestOrder = Math.max(...existingTemplates.map(t => t.displayOrder), 0);

    for (const missing of missingTemplates) {
      if (existingEvents.has(missing.event)) {
        console.log(`- Skipped (already exists): ${missing.event}`);
        skippedCount++;
      } else {
        highestOrder += 10;
        await NotificationTemplate.create({
          name: missing.name,
          slug: missing.event.replace(/\./g, '-'),
          templatePackId: pack._id,
          event: missing.event,
          message: missing.msg,
          variables: missing.vars,
          active: true,
          displayOrder: highestOrder
        });
        console.log(`+ Created (missing): ${missing.event} -> ${missing.vars.join(',')}`);
        createdCount++;
      }
    }

    console.log(`\nAudit Results: ${skippedCount} skipped, ${createdCount} created.`);

    // Record Post baselines
    const postCategoryCount = await ClientCategory.countDocuments();
    const postPackCount = await TemplatePack.countDocuments();
    const postTemplateCount = await NotificationTemplate.countDocuments();
    const postClientTemplateCount = await ClientTemplate.countDocuments();
    const postDtCount = dtClient ? await ClientTemplate.countDocuments({ clientId: dtClient._id }) : 0;
    console.log(`\nPost-Seed Baseline -> Categories: ${postCategoryCount}, Packs: ${postPackCount}, Master Templates: ${postTemplateCount}, ClientTemplates: ${postClientTemplateCount}, DivineTours CTs: ${postDtCount}`);

    // Verification
    const updatedExistingTemplates = await NotificationTemplate.find({ templatePackId: pack._id });
    
    // Check preservation of existing templates
    let allPreserved = true;
    for (const ext of existingTemplates) {
      const found = updatedExistingTemplates.find(t => t._id.toString() === ext._id.toString());
      if (!found || found.message !== ext.message || found.event !== ext.event || found.active !== ext.active) {
        allPreserved = false;
        console.error(`ERROR: Existing template ${ext.event} was modified!`);
      }
    }
    console.log(`Preservation Check: Existing templates preserved = ${allPreserved}`);

    // Check duplicates
    const allEvents = updatedExistingTemplates.filter(t => t.active).map(t => t.event);
    const hasDuplicates = new Set(allEvents).size !== allEvents.length;
    console.log(`Duplicate Active Event Check: Has duplicates = ${hasDuplicates}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seedClinic();
