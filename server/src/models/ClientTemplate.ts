import mongoose, { Document, Schema } from 'mongoose';

export interface IClientTemplate extends Document {
  clientId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  enabled: boolean;
  customMessage?: string;
  customVariables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientTemplateSchema = new Schema<IClientTemplate>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    customMessage: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
    customVariables: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'client_templates',
  }
);

ClientTemplateSchema.index(
  { clientId: 1, templateId: 1 },
  { unique: true }
);

export default mongoose.model<IClientTemplate>(
  'ClientTemplate',
  ClientTemplateSchema
);
