import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Status of a single contact's generated message within a campaign.
 * (Mirrors the kind of status enum our real "magic copy" generation uses.)
 */
export enum GenerationStatus {
  NOT_GENERATED = 'not_generated',
  PENDING = 'pending',
  FINISHED = 'finished',
  FAILED = 'failed',
}

/**
 * Schema representing an individual generated message for a contact.
 * Kept as an embedded sub-document to avoid expensive $lookup aggregations.
 * This is highly performant and safe for this project's scope, as the array 
 * of contacts will easily stay well below MongoDB's 16MB document size limit.
 */
@Schema({ _id: false })
export class CampaignContact {
  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true })
  contactId: Types.ObjectId;

  @Prop({ type: String, enum: GenerationStatus, default: GenerationStatus.NOT_GENERATED })
  status: GenerationStatus;

  @Prop()
  generatedMessage?: string;

  @Prop()
  error?: string;

  @Prop({
    type: [{
      promptTemplate: String,
      generatedMessage: String,
      createdAt: Date
    }],
    default: []
  })
  history?: { promptTemplate: string; generatedMessage: string; createdAt: Date }[];
}
export const CampaignContactSchema = SchemaFactory.createForClass(CampaignContact);

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  /** e.g. "Write a 2-sentence opener for {{name}}, a {{title}} at {{company}}." */
  @Prop({ required: true })
  promptTemplate: string;

  @Prop({ type: [CampaignContactSchema], default: [] })
  contacts: CampaignContact[];
}

export type CampaignDocument = Campaign & Document;
export const CampaignSchema = SchemaFactory.createForClass(Campaign);
