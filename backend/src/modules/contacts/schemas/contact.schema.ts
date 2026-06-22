import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Contact schema representing an individual target for outreach.
 */
@Schema({ timestamps: true })
export class Contact {
  /** The owning user (from x-user-id). Resources must be scoped to this. */
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  company?: string;

  @Prop()
  title?: string;

  // createdAt / updatedAt provided by `timestamps: true`
}

export type ContactDocument = Contact & Document;
export const ContactSchema = SchemaFactory.createForClass(Contact);

// Indexes for fast retrieval by user and deterministic pagination
ContactSchema.index({ userId: 1, name: 1, _id: 1 });
ContactSchema.index({ userId: 1, createdAt: 1, _id: 1 });
