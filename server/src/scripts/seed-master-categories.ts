import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';

dotenv.config({ path: '../.env' });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/wa_platform';

type TemplateDef = {
  slug: string;
  name: string;
  event: string;
  message: string;
  variables: string[];
};

type PackDef = {
  name: string;
  slug: string;
  description: string;
  templates: TemplateDef[];
};

type CategoryDef = {
  name: string;
  slug: string;
  description: string;
  packs: PackDef[];
};

const t = (
  slug: string,
  name: string,
  event: string,
  message: string,
  variables: string[]
): TemplateDef => ({
  slug,
  name,
  event,
  message,
  variables,
});

const categories: CategoryDef[] = [
  {
    name: 'Grocery / Supermarket',
    slug: 'grocery-supermarket',
    description: 'Order, payment, delivery and customer notifications.',
    packs: [
      {
        name: 'Grocery Standard',
        slug: 'grocery-standard',
        description: 'Standard grocery and supermarket notification workflow.',
        templates: [
          t('order-received', 'Order Received', 'order_received', 'Hello {{customer_name}}, your order #{{order_id}} has been received successfully.', ['customer_name', 'order_id']),
          t('order-confirmed', 'Order Confirmed', 'order_confirmed', 'Hello {{customer_name}}, your order #{{order_id}} has been confirmed.', ['customer_name', 'order_id']),
          t('order-ready', 'Order Ready', 'order_ready', 'Hello {{customer_name}}, your order #{{order_id}} is ready for pickup.', ['customer_name', 'order_id']),
          t('order-dispatched', 'Order Dispatched', 'order_dispatched', 'Hello {{customer_name}}, your order #{{order_id}} has been dispatched. Delivery partner: {{delivery_partner}}.', ['customer_name', 'order_id', 'delivery_partner']),
          t('order-delivered', 'Order Delivered', 'order_delivered', 'Hello {{customer_name}}, your order #{{order_id}} has been delivered.', ['customer_name', 'order_id']),
          t('order-cancelled', 'Order Cancelled', 'order_cancelled', 'Hello {{customer_name}}, your order #{{order_id}} has been cancelled.', ['customer_name', 'order_id']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{customer_name}}, payment of {{amount}} has been received for order #{{order_id}}.', ['customer_name', 'amount', 'order_id']),
          t('payment-failed', 'Payment Failed', 'payment_failed', 'Hello {{customer_name}}, payment for order #{{order_id}} could not be completed.', ['customer_name', 'order_id']),
          t('delivery-update', 'Delivery Update', 'delivery_update', 'Hello {{customer_name}}, your order #{{order_id}} delivery status is {{status}}.', ['customer_name', 'order_id', 'status']),
        ],
      },
    ],
  },

  {
    name: 'Salon / Beauty',
    slug: 'salon-beauty',
    description: 'Appointment and customer-care notifications for salons and beauty businesses.',
    packs: [
      {
        name: 'Salon Standard',
        slug: 'salon-standard',
        description: 'Standard salon appointment workflow.',
        templates: [
          t('appointment-booked', 'Appointment Booked', 'appointment_booked', 'Hello {{customer_name}}, your appointment is booked for {{date}} at {{time}}.', ['customer_name', 'date', 'time']),
          t('appointment-confirmed', 'Appointment Confirmed', 'appointment_confirmed', 'Hello {{customer_name}}, your appointment on {{date}} at {{time}} has been confirmed.', ['customer_name', 'date', 'time']),
          t('appointment-reminder', 'Appointment Reminder', 'appointment_reminder', 'Reminder: Hello {{customer_name}}, your appointment is scheduled for {{date}} at {{time}}.', ['customer_name', 'date', 'time']),
          t('appointment-rescheduled', 'Appointment Rescheduled', 'appointment_rescheduled', 'Hello {{customer_name}}, your appointment has been rescheduled to {{date}} at {{time}}.', ['customer_name', 'date', 'time']),
          t('appointment-cancelled', 'Appointment Cancelled', 'appointment_cancelled', 'Hello {{customer_name}}, your appointment on {{date}} at {{time}} has been cancelled.', ['customer_name', 'date', 'time']),
          t('service-completed', 'Service Completed', 'service_completed', 'Hello {{customer_name}}, your {{service_name}} service has been completed.', ['customer_name', 'service_name']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{customer_name}}, payment of {{amount}} has been received.', ['customer_name', 'amount']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Hello {{customer_name}}, we hope you enjoyed your visit. We would appreciate your feedback.', ['customer_name']),
          t('follow-up', 'Customer Follow-up', 'follow_up', 'Hello {{customer_name}}, thank you for choosing us. Please contact us if you need assistance.', ['customer_name']),
        ],
      },
    ],
  },

  {
    name: 'Clinic / Healthcare',
    slug: 'clinic-healthcare',
    description: 'Patient, appointment, prescription and healthcare notification workflows.',
    packs: [
      {
        name: 'Clinic Standard',
        slug: 'clinic-standard',
        description: 'Standard clinic notification workflow.',
        templates: [
          t('patient-registered', 'Patient Registered', 'patient_registered', 'Hello {{patient_name}}, your registration is complete. Patient ID: {{patient_id}}.', ['patient_name', 'patient_id']),
          t('appointment-booked', 'Appointment Booked', 'appointment_booked', 'Hello {{patient_name}}, your appointment with {{doctor_name}} is booked for {{date}} at {{time}}.', ['patient_name', 'doctor_name', 'date', 'time']),
          t('appointment-confirmed', 'Appointment Confirmed', 'appointment_confirmed', 'Hello {{patient_name}}, your appointment with {{doctor_name}} on {{date}} at {{time}} is confirmed.', ['patient_name', 'doctor_name', 'date', 'time']),
          t('appointment-reminder', 'Appointment Reminder', 'appointment_reminder', 'Reminder: Your appointment with {{doctor_name}} is scheduled for {{date}} at {{time}}.', ['doctor_name', 'date', 'time']),
          t('prescription-saved', 'Prescription Saved', 'prescription_saved', 'Hello {{patient_name}}, your prescription has been saved. Patient ID: {{patient_id}}. Prescription ID: {{prescription_id}}.', ['patient_name', 'patient_id', 'prescription_id']),
          t('prescription-ready', 'Prescription Ready', 'prescription_ready', 'Hello {{patient_name}}, your prescription {{prescription_id}} is ready. View it securely here: {{prescription_link}}', ['patient_name', 'prescription_id', 'prescription_link']),
          t('medicine-reminder', 'Medicine Reminder', 'medicine_reminder', '?? Medicine Reminder: {{patient_name}}, please take {{medicine_name}} {{dosage}} as prescribed. Instruction: {{instructions}}.', ['patient_name', 'medicine_name', 'dosage', 'instructions']),
          t('follow-up-reminder', 'Follow-up Reminder', 'follow_up_reminder', 'Hello {{patient_name}}, your follow-up is due on {{date}}. Please contact the clinic to schedule your appointment.', ['patient_name', 'date']),
          t('report-ready', 'Report Ready', 'report_ready', 'Hello {{patient_name}}, your medical report is ready. Please contact the clinic for further details.', ['patient_name']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{patient_name}}, payment of {{amount}} has been received. Thank you.', ['patient_name', 'amount']),
        ],
      },
    ],
  },

  {
    name: 'Hotel / Hospitality',
    slug: 'hotel-hospitality',
    description: 'Hotel and hospitality booking lifecycle notifications.',
    packs: [
      {
        name: 'Hotel Standard',
        slug: 'hotel-standard',
        description: 'Standard hotel booking workflow.',
        templates: [
          t('booking-received', 'Booking Received', 'booking_received', 'Hello {{guest_name}}, your booking request #{{booking_id}} has been received.', ['guest_name', 'booking_id']),
          t('booking-confirmed', 'Booking Confirmed', 'booking_confirmed', 'Hello {{guest_name}}, your booking #{{booking_id}} is confirmed. Check-in: {{check_in}}. Check-out: {{check_out}}.', ['guest_name', 'booking_id', 'check_in', 'check_out']),
          t('check-in-reminder', 'Check-in Reminder', 'check_in_reminder', 'Hello {{guest_name}}, this is a reminder for your check-in on {{check_in}}.', ['guest_name', 'check_in']),
          t('check-in-completed', 'Check-in Completed', 'check_in_completed', 'Hello {{guest_name}}, your check-in has been completed. We hope you enjoy your stay.', ['guest_name']),
          t('check-out-reminder', 'Check-out Reminder', 'check_out_reminder', 'Hello {{guest_name}}, this is a reminder that check-out is scheduled for {{check_out}}.', ['guest_name', 'check_out']),
          t('booking-cancelled', 'Booking Cancelled', 'booking_cancelled', 'Hello {{guest_name}}, booking #{{booking_id}} has been cancelled.', ['guest_name', 'booking_id']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{guest_name}}, payment of {{amount}} has been received for booking #{{booking_id}}.', ['guest_name', 'amount', 'booking_id']),
          t('invoice-ready', 'Invoice Ready', 'invoice_ready', 'Hello {{guest_name}}, your invoice for booking #{{booking_id}} is ready.', ['guest_name', 'booking_id']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Hello {{guest_name}}, thank you for staying with us. We would appreciate your feedback.', ['guest_name']),
        ],
      },
    ],
  },

  {
    name: 'Gym / Fitness',
    slug: 'gym-fitness',
    description: 'Membership, classes, payments and fitness notifications.',
    packs: [
      {
        name: 'Gym Standard',
        slug: 'gym-standard',
        description: 'Standard gym and fitness workflow.',
        templates: [
          t('membership-activated', 'Membership Activated', 'membership_activated', 'Hello {{customer_name}}, your membership has been activated successfully.', ['customer_name']),
          t('membership-expiry-reminder', 'Membership Expiry Reminder', 'membership_expiry_reminder', 'Hello {{customer_name}}, your membership expires on {{expiry_date}}. Please renew to continue.', ['customer_name', 'expiry_date']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{customer_name}}, payment of {{amount}} has been received for your membership.', ['customer_name', 'amount']),
          t('class-booked', 'Class Booked', 'class_booked', 'Hello {{customer_name}}, your {{class_name}} class is booked for {{date}} at {{time}}.', ['customer_name', 'class_name', 'date', 'time']),
          t('class-reminder', 'Class Reminder', 'class_reminder', 'Reminder: Your {{class_name}} class starts at {{time}}.', ['class_name', 'time']),
          t('membership-cancelled', 'Membership Cancelled', 'membership_cancelled', 'Hello {{customer_name}}, your membership has been cancelled.', ['customer_name']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Hello {{customer_name}}, we value your feedback about your experience with us.', ['customer_name']),
        ],
      },
    ],
  },

  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Property enquiry, site visit, booking and payment notifications.',
    packs: [
      {
        name: 'Real Estate Standard',
        slug: 'real-estate-standard',
        description: 'Standard property sales and enquiry workflow.',
        templates: [
          t('lead-received', 'Lead Received', 'lead_received', 'Hello {{customer_name}}, thank you for your property enquiry. Our team will contact you shortly.', ['customer_name']),
          t('site-visit-booked', 'Site Visit Booked', 'site_visit_booked', 'Hello {{customer_name}}, your site visit for {{property_name}} is booked on {{date}} at {{time}}.', ['customer_name', 'property_name', 'date', 'time']),
          t('site-visit-reminder', 'Site Visit Reminder', 'site_visit_reminder', 'Reminder: Your site visit is scheduled for {{date}} at {{time}}.', ['date', 'time']),
          t('site-visit-rescheduled', 'Site Visit Rescheduled', 'site_visit_rescheduled', 'Hello {{customer_name}}, your site visit has been rescheduled to {{date}} at {{time}}.', ['customer_name', 'date', 'time']),
          t('property-details', 'Property Details', 'property_details', 'Hello {{customer_name}}, here are the details for {{property_name}}: {{property_link}}', ['customer_name', 'property_name', 'property_link']),
          t('booking-confirmed', 'Booking Confirmed', 'booking_confirmed', 'Hello {{customer_name}}, your booking for {{property_name}} has been confirmed.', ['customer_name', 'property_name']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{customer_name}}, payment of {{amount}} has been received.', ['customer_name', 'amount']),
          t('document-update', 'Document Update', 'document_update', 'Hello {{customer_name}}, there is an update regarding your property documents.', ['customer_name']),
          t('follow-up', 'Lead Follow-up', 'follow_up', 'Hello {{customer_name}}, we are following up regarding your property enquiry.', ['customer_name']),
        ],
      },
    ],
  },

  {
    name: 'Travel',
    slug: 'travel',
    description: 'Travel agency enquiry, booking, itinerary and trip notifications.',
    packs: [
      {
        name: 'Travel Agency Standard',
        slug: 'travel-agency-standard',
        description: 'Travel agency booking lifecycle.',
        templates: [
          t('enquiry-received', 'Enquiry Received', 'enquiry_received', 'Hello {{customer_name}}, your travel enquiry {{enquiry_id}} has been received. Our team will contact you shortly.', ['customer_name', 'enquiry_id']),
          t('quotation-sent', 'Quotation Sent', 'quotation_sent', 'Hello {{customer_name}}, your travel quotation {{quotation_id}} is ready. View details: {{quotation_link}}', ['customer_name', 'quotation_id', 'quotation_link']),
          t('booking-confirmed', 'Booking Confirmed', 'booking_confirmed', 'Hello {{customer_name}}, your booking {{booking_id}} is confirmed. Destination: {{destination}}. Travel date: {{travel_date}}.', ['customer_name', 'booking_id', 'destination', 'travel_date']),
          t('payment-received', 'Payment Received', 'payment_received', 'Hello {{customer_name}}, payment of {{amount}} has been received for booking {{booking_id}}.', ['customer_name', 'amount', 'booking_id']),
          t('itinerary-ready', 'Itinerary Ready', 'itinerary_ready', 'Hello {{customer_name}}, your itinerary for booking {{booking_id}} is ready: {{itinerary_link}}', ['customer_name', 'booking_id', 'itinerary_link']),
          t('document-required', 'Document Required', 'document_required', 'Hello {{customer_name}}, documents are required for booking {{booking_id}}. Please submit them securely: {{document_link}}', ['customer_name', 'booking_id', 'document_link']),
          t('departure-reminder', 'Departure Reminder', 'departure_reminder', '?? Reminder: Your journey for booking {{booking_id}} starts on {{travel_date}}. Pickup/details: {{pickup_details}}.', ['booking_id', 'travel_date', 'pickup_details']),
          t('booking-cancelled', 'Booking Cancelled', 'booking_cancelled', 'Hello {{customer_name}}, booking {{booking_id}} has been cancelled. Refund/update details: {{details}}.', ['customer_name', 'booking_id', 'details']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Hello {{customer_name}}, thank you for travelling with us. We would appreciate your feedback.', ['customer_name']),
        ],
      },
    ],
  },

  {
    name: 'Rent-a-Car / Tour Vehicle',
    slug: 'rent-a-car',
    description: 'Vehicle rental and tour vehicle operational lifecycle.',
    packs: [
      {
        name: 'Rent-a-Car Standard',
        slug: 'rent-a-car-standard',
        description: 'Driver, vehicle and trip lifecycle based on tour/rental operations.',
        templates: [
          t('enquiry-received', 'Enquiry Received', 'enquiry_received', 'Hello {{customer_name}}, your vehicle/travel enquiry {{enquiry_id}} has been received. Our team will contact you shortly.', ['customer_name', 'enquiry_id']),
          t('booking-confirmed', 'Booking Confirmed', 'booking_confirmed', '?? Hello {{customer_name}}, booking {{booking_id}} is confirmed. Pickup: {{pickup_location}} on {{trip_date}} at {{pickup_time}}.', ['customer_name', 'booking_id', 'pickup_location', 'trip_date', 'pickup_time']),
          t('driver-assigned', 'Driver Assigned', 'driver_assigned', '????? Driver assigned for booking {{booking_id}}: {{driver_name}}. Contact: {{driver_phone}}.', ['booking_id', 'driver_name', 'driver_phone']),
          t('vehicle-assigned', 'Vehicle Assigned', 'vehicle_assigned', '?? Vehicle assigned for booking {{booking_id}}: {{vehicle_name}} | Vehicle No.: {{vehicle_number}}.', ['booking_id', 'vehicle_name', 'vehicle_number']),
          t('trip-details-confirmed', 'Trip Details Confirmed', 'trip_details_confirmed', '?? Your trip is confirmed. Driver: {{driver_name}} | Vehicle: {{vehicle_name}} ({{vehicle_number}}) | Pickup: {{pickup_location}}.', ['driver_name', 'vehicle_name', 'vehicle_number', 'pickup_location']),
          t('trip-reminder', 'Trip Reminder', 'trip_reminder', '?? Reminder: Your trip {{trip_id}} is scheduled for {{trip_date}} at {{pickup_time}} from {{pickup_location}}.', ['trip_id', 'trip_date', 'pickup_time', 'pickup_location']),
          t('trip-started', 'Trip Started', 'trip_started', '?? Trip {{trip_id}} has started. Driver: {{driver_name}} | Vehicle: {{vehicle_name}} | Starting KM: {{initial_km}}.', ['trip_id', 'driver_name', 'vehicle_name', 'initial_km']),
          t('trip-ended', 'Trip Ended', 'trip_ended', '? Trip {{trip_id}} has ended. Starting KM: {{initial_km}} | Ending KM: {{final_km}} | Total Distance: {{total_km}} KM.', ['trip_id', 'initial_km', 'final_km', 'total_km']),
          t('bill-generated', 'Bill Generated', 'bill_generated', '?? Your bill for booking {{booking_id}} is ready. Bill No.: {{invoice_number}} | Amount: ?{{total_amount}} | View: {{invoice_link}}', ['booking_id', 'invoice_number', 'total_amount', 'invoice_link']),
          t('payment-received', 'Payment Received', 'payment_received', '? Payment of ?{{amount}} has been received for booking {{booking_id}}. Thank you.', ['amount', 'booking_id']),
          t('booking-cancelled', 'Booking Cancelled', 'booking_cancelled', 'Hello {{customer_name}}, booking {{booking_id}} has been cancelled. Details: {{details}}.', ['customer_name', 'booking_id', 'details']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Hello {{customer_name}}, thank you for travelling with us. Please share your feedback: {{feedback_link}}', ['customer_name', 'feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Service booking, technician assignment and completion notifications.',
    packs: [
      {
        name: 'Home Services Standard',
        slug: 'home-services-standard',
        description: 'Standard home service workflow.',
        templates: [
          t('service-request-received', 'Service Request Received', 'service_request_received', 'Hello {{customer_name}}, your service request {{request_id}} has been received.', ['customer_name', 'request_id']),
          t('booking-confirmed', 'Booking Confirmed', 'booking_confirmed', 'Hello {{customer_name}}, your service booking {{booking_id}} is confirmed for {{date}} at {{time}}.', ['customer_name', 'booking_id', 'date', 'time']),
          t('technician-assigned', 'Technician Assigned', 'technician_assigned', '????? Technician assigned: {{technician_name}}. Contact: {{technician_phone}}.', ['technician_name', 'technician_phone']),
          t('technician-on-the-way', 'Technician On The Way', 'technician_on_the_way', 'Your technician {{technician_name}} is on the way to your location.', ['technician_name']),
          t('service-started', 'Service Started', 'service_started', 'Your service request {{request_id}} has started.', ['request_id']),
          t('service-completed', 'Service Completed', 'service_completed', 'Your service request {{request_id}} has been completed. Thank you.', ['request_id']),
          t('bill-generated', 'Bill Generated', 'bill_generated', 'Your service bill {{invoice_number}} is ready. Amount: ?{{amount}}. {{invoice_link}}', ['invoice_number', 'amount', 'invoice_link']),
          t('payment-received', 'Payment Received', 'payment_received', 'Payment of ?{{amount}} has been received. Thank you.', ['amount']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'We value your feedback. Please share your experience: {{feedback_link}}', ['feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Education / Coaching',
    slug: 'education-coaching',
    description: 'Admission, fees, classes, attendance and student notifications.',
    packs: [
      {
        name: 'Education Standard',
        slug: 'education-standard',
        description: 'Standard coaching and education workflow.',
        templates: [
          t('enquiry-received', 'Enquiry Received', 'enquiry_received', 'Hello {{student_name}}, your enquiry {{enquiry_id}} has been received. Our team will contact you shortly.', ['student_name', 'enquiry_id']),
          t('admission-confirmed', 'Admission Confirmed', 'admission_confirmed', 'Congratulations {{student_name}}, your admission {{admission_id}} has been confirmed.', ['student_name', 'admission_id']),
          t('fee-payment-received', 'Fee Payment Received', 'fee_payment_received', 'Hello {{student_name}}, fee payment of ?{{amount}} has been received. Receipt: {{receipt_number}}.', ['student_name', 'amount', 'receipt_number']),
          t('fee-reminder', 'Fee Reminder', 'fee_reminder', 'Hello {{student_name}}, your fee payment of ?{{amount}} is due on {{due_date}}.', ['student_name', 'amount', 'due_date']),
          t('class-reminder', 'Class Reminder', 'class_reminder', 'Reminder: {{course_name}} class is scheduled for {{date}} at {{time}}.', ['course_name', 'date', 'time']),
          t('attendance-update', 'Attendance Update', 'attendance_update', 'Attendance update for {{student_name}}: {{attendance_status}} on {{date}}.', ['student_name', 'attendance_status', 'date']),
          t('result-published', 'Result Published', 'result_published', 'Hello {{student_name}}, your result is available. View it here: {{result_link}}', ['student_name', 'result_link']),
          t('course-completed', 'Course Completed', 'course_completed', 'Congratulations {{student_name}}, you have completed {{course_name}}.', ['student_name', 'course_name']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Please share your feedback about {{course_name}}: {{feedback_link}}', ['course_name', 'feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Automobile / Car Service',
    slug: 'automobile-car-service',
    description: 'Vehicle service booking and workshop lifecycle notifications.',
    packs: [
      {
        name: 'Automobile Standard',
        slug: 'automobile-standard',
        description: 'Standard vehicle service workflow.',
        templates: [
          t('service-booked', 'Service Booked', 'service_booked', 'Your vehicle service booking {{booking_id}} is confirmed for {{date}} at {{time}}.', ['booking_id', 'date', 'time']),
          t('vehicle-received', 'Vehicle Received', 'vehicle_received', 'Your vehicle {{vehicle_number}} has been received by our workshop. Opening KM: {{initial_km}}.', ['vehicle_number', 'initial_km']),
          t('inspection-complete', 'Inspection Complete', 'inspection_complete', 'Inspection for vehicle {{vehicle_number}} is complete. Update: {{details}}.', ['vehicle_number', 'details']),
          t('service-started', 'Service Started', 'service_started', 'Service for vehicle {{vehicle_number}} has started.', ['vehicle_number']),
          t('service-completed', 'Service Completed', 'service_completed', 'Service for vehicle {{vehicle_number}} has been completed. Final KM: {{final_km}}.', ['vehicle_number', 'final_km']),
          t('bill-generated', 'Bill Generated', 'bill_generated', 'Your vehicle service bill {{invoice_number}} is ready. Amount: ?{{amount}}. {{invoice_link}}', ['invoice_number', 'amount', 'invoice_link']),
          t('payment-received', 'Payment Received', 'payment_received', 'Payment of ?{{amount}} has been received for vehicle {{vehicle_number}}.', ['amount', 'vehicle_number']),
          t('vehicle-ready', 'Vehicle Ready', 'vehicle_ready', 'Your vehicle {{vehicle_number}} is ready for pickup.', ['vehicle_number']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Please share your feedback about your vehicle service: {{feedback_link}}', ['feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Retail / E-commerce',
    slug: 'retail-ecommerce',
    description: 'Retail order, payment, shipment and delivery notifications.',
    packs: [
      {
        name: 'Retail Standard',
        slug: 'retail-standard',
        description: 'Standard retail and e-commerce order workflow.',
        templates: [
          t('order-received', 'Order Received', 'order_received', 'Hello {{customer_name}}, order #{{order_id}} has been received successfully.', ['customer_name', 'order_id']),
          t('order-confirmed', 'Order Confirmed', 'order_confirmed', 'Hello {{customer_name}}, order #{{order_id}} has been confirmed.', ['customer_name', 'order_id']),
          t('payment-received', 'Payment Received', 'payment_received', 'Payment of ?{{amount}} has been received for order #{{order_id}}.', ['amount', 'order_id']),
          t('order-packed', 'Order Packed', 'order_packed', 'Your order #{{order_id}} has been packed and is ready for dispatch.', ['order_id']),
          t('order-shipped', 'Order Shipped', 'order_shipped', 'Your order #{{order_id}} has been shipped. Tracking: {{tracking_link}}', ['order_id', 'tracking_link']),
          t('out-for-delivery', 'Out for Delivery', 'out_for_delivery', 'Your order #{{order_id}} is out for delivery today.', ['order_id']),
          t('order-delivered', 'Order Delivered', 'order_delivered', 'Your order #{{order_id}} has been delivered successfully.', ['order_id']),
          t('order-cancelled', 'Order Cancelled', 'order_cancelled', 'Your order #{{order_id}} has been cancelled. Details: {{details}}.', ['order_id', 'details']),
          t('refund-processed', 'Refund Processed', 'refund_processed', 'Refund of ?{{amount}} for order #{{order_id}} has been processed.', ['amount', 'order_id']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Please share your feedback about order #{{order_id}}: {{feedback_link}}', ['order_id', 'feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Logistics / Courier',
    slug: 'logistics-courier',
    description: 'Shipment pickup, transit, delivery and exception notifications.',
    packs: [
      {
        name: 'Logistics Standard',
        slug: 'logistics-standard',
        description: 'Standard logistics lifecycle.',
        templates: [
          t('shipment-booked', 'Shipment Booked', 'shipment_booked', 'Shipment {{shipment_id}} has been booked successfully.', ['shipment_id']),
          t('pickup-scheduled', 'Pickup Scheduled', 'pickup_scheduled', 'Pickup for shipment {{shipment_id}} is scheduled for {{date}} at {{time}}.', ['shipment_id', 'date', 'time']),
          t('shipment-picked-up', 'Shipment Picked Up', 'shipment_picked_up', 'Shipment {{shipment_id}} has been picked up successfully.', ['shipment_id']),
          t('in-transit', 'Shipment In Transit', 'in_transit', 'Shipment {{shipment_id}} is currently in transit. Current status: {{status}}.', ['shipment_id', 'status']),
          t('out-for-delivery', 'Out for Delivery', 'out_for_delivery', 'Shipment {{shipment_id}} is out for delivery.', ['shipment_id']),
          t('delivered', 'Shipment Delivered', 'delivered', 'Shipment {{shipment_id}} has been delivered successfully.', ['shipment_id']),
          t('delivery-exception', 'Delivery Exception', 'delivery_exception', 'There is an update regarding shipment {{shipment_id}}: {{details}}.', ['shipment_id', 'details']),
          t('payment-received', 'Payment Received', 'payment_received', 'Payment of ?{{amount}} has been received for shipment {{shipment_id}}.', ['amount', 'shipment_id']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'Please share your feedback about shipment {{shipment_id}}: {{feedback_link}}', ['shipment_id', 'feedback_link']),
        ],
      },
    ],
  },

  {
    name: 'Professional / Digital Services',
    slug: 'professional-digital-services',
    description: 'Lead, proposal, project, invoice and client communication.',
    packs: [
      {
        name: 'Professional Services Standard',
        slug: 'professional-services-standard',
        description: 'Standard professional and digital services workflow.',
        templates: [
          t('enquiry-received', 'Enquiry Received', 'enquiry_received', 'Hello {{customer_name}}, your enquiry {{enquiry_id}} has been received.', ['customer_name', 'enquiry_id']),
          t('internal-enquiry-received', 'Internal Enquiry Received', 'internal.enquiry_received', `🔔 New Enquiry Received

Business: {{business_name}}

Name: {{customer_name}}
Company: {{company_name}}
Designation: {{designation}}

WhatsApp: {{mobile}}
Email: {{email}}
Location: {{city}}

Requirement: {{requirement_type}}
Facility: {{facility_type}}

Requirement Details:
{{brief_requirement}}`, ['business_name', 'customer_name', 'company_name', 'designation', 'mobile', 'email', 'city', 'requirement_type', 'facility_type', 'brief_requirement']),
          t('meeting-scheduled', 'Meeting Scheduled', 'meeting_scheduled', 'Your meeting is scheduled for {{date}} at {{time}}. Meeting link: {{meeting_link}}', ['date', 'time', 'meeting_link']),
          t('quotation-sent', 'Quotation Sent', 'quotation_sent', 'Your quotation {{quotation_id}} is ready. View it here: {{quotation_link}}', ['quotation_id', 'quotation_link']),
          t('proposal-approved', 'Proposal Approved', 'proposal_approved', 'Your proposal {{proposal_id}} has been approved. We will begin the next steps shortly.', ['proposal_id']),
          t('project-started', 'Project Started', 'project_started', 'Project {{project_name}} has started successfully.', ['project_name']),
          t('project-update', 'Project Update', 'project_update', 'Project {{project_name}} update: {{update}}', ['project_name', 'update']),
          t('invoice-generated', 'Invoice Generated', 'invoice_generated', 'Invoice {{invoice_number}} is ready. Amount: ?{{amount}}. {{invoice_link}}', ['invoice_number', 'amount', 'invoice_link']),
          t('payment-received', 'Payment Received', 'payment_received', 'Payment of ?{{amount}} has been received. Thank you.', ['amount']),
          t('project-completed', 'Project Completed', 'project_completed', 'Project {{project_name}} has been completed successfully.', ['project_name']),
          t('feedback-request', 'Feedback Request', 'feedback_request', 'We value your feedback. Please share it here: {{feedback_link}}', ['feedback_link']),
        ],
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  let totalCategories = 0;
  let totalPacks = 0;
  let totalTemplates = 0;

  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
    const categoryDef = categories[categoryIndex];

    const category = await ClientCategory.findOneAndUpdate(
      { slug: categoryDef.slug },
      {
        $set: {
          name: categoryDef.name,
          description: categoryDef.description,
          active: true,
          displayOrder: categoryIndex + 1,
        },
        $setOnInsert: {
          slug: categoryDef.slug,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    totalCategories++;
    console.log(`Category processed: ${category.name}`);

    for (let packIndex = 0; packIndex < categoryDef.packs.length; packIndex++) {
      const packDef = categoryDef.packs[packIndex];

      const pack = await TemplatePack.findOneAndUpdate(
        {
          slug: packDef.slug,
          categoryId: category._id,
        },
        {
          $set: {
            name: packDef.name,
            description: packDef.description,
            active: true,
            isDefault: packIndex === 0,
            displayOrder: packIndex + 1,
          },
          $setOnInsert: {
            slug: packDef.slug,
            categoryId: category._id,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      totalPacks++;

      if (packIndex === 0) {
        await ClientCategory.updateOne(
          { _id: category._id },
          { $set: { defaultTemplatePackId: pack._id } }
        );
      }

      console.log(`  Pack processed: ${pack.name}`);

      for (let templateIndex = 0; templateIndex < packDef.templates.length; templateIndex++) {
        const templateDef = packDef.templates[templateIndex];

        await NotificationTemplate.findOneAndUpdate(
          {
            slug: templateDef.slug,
            templatePackId: pack._id,
          },
          {
            $set: {
              name: templateDef.name,
              event: templateDef.event,
              message: templateDef.message,
              variables: templateDef.variables,
              active: true,
              displayOrder: templateIndex + 1,
            },
            $setOnInsert: {
              slug: templateDef.slug,
              templatePackId: pack._id,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        totalTemplates++;
      }

      console.log(`  Templates processed: ${packDef.templates.length}`);
    }
  }

  console.log('\nMASTER CATEGORY/TEMPLATE SEED COMPLETE');
  console.log(`Categories processed: ${totalCategories}`);
  console.log(`Packs processed: ${totalPacks}`);
  console.log(`Templates processed: ${totalTemplates}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('SEED FAILED:', error);
  await mongoose.disconnect();
  process.exit(1);
});
