import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientCategory extends Document {
  name: string;
  slug: string;
  description?: string | null;

  defaultTemplatePackId?: mongoose.Types.ObjectId | null;

  active: boolean;
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

const clientCategorySchema = new Schema<IClientCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: null,
      maxlength: 500,
    },

    defaultTemplatePackId: {
      type: Schema.Types.ObjectId,
      ref: 'TemplatePack',
      default: null,
      index: true,
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
    collection: 'client_categories',
  }
);

export const ClientCategory: Model<IClientCategory> =
  mongoose.model<IClientCategory>(
    'ClientCategory',
    clientCategorySchema
  );
