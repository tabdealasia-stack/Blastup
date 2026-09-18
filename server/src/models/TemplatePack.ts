import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplatePack extends Document {
  name: string;
  slug: string;

  categoryId: mongoose.Types.ObjectId;

  description?: string | null;

  active: boolean;
  isDefault: boolean;
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

const templatePackSchema = new Schema<ITemplatePack>(
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

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientCategory',
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: null,
      maxlength: 500,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
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
    collection: 'template_packs',
  }
);

// A pack slug only needs to be unique within its category.
templatePackSchema.index(
  { categoryId: 1, slug: 1 },
  { unique: true }
);

export const TemplatePack: Model<ITemplatePack> =
  mongoose.model<ITemplatePack>(
    'TemplatePack',
    templatePackSchema
  );
