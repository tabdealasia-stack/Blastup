import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationTemplate extends Document {
  name: string;
  slug: string;

  templatePackId: mongoose.Types.ObjectId;

  event: string;
  message: string;

  variables: string[];

  active: boolean;
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
      index: true,
    },

    templatePackId: {
      type: Schema.Types.ObjectId,
      ref: 'TemplatePack',
      required: true,
      index: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },

    variables: {
      type: [String],
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notification_templates',
  }
);

// Template slug is unique within a template pack.
notificationTemplateSchema.index(
  { templatePackId: 1, slug: 1 },
  { unique: true }
);

// Event lookup within a pack.
notificationTemplateSchema.index(
  { templatePackId: 1, event: 1, active: 1 }
);

export const NotificationTemplate: Model<INotificationTemplate> =
  mongoose.model<INotificationTemplate>(
    'NotificationTemplate',
    notificationTemplateSchema
  );
