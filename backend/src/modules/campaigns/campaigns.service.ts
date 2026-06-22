import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Campaign, CampaignDocument, GenerationStatus } from './schemas/campaign.schema';
import { CreateCampaignDto } from './dtos/create-campaign.dto';
import { AttachContactsDto } from './dtos/attach-contacts.dto';
import { ContactsService } from '../contacts/contacts.service';
import { LlmService } from '../../shared/llm/llm.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    private readonly contactsService: ContactsService,
    private readonly llm: LlmService,
  ) {}

  async create(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const createdCampaign = new this.campaignModel({
      ...dto,
      userId,
    });
    return createdCampaign.save();
  }

  async getOne(userId: string, campaignId: string): Promise<Omit<Campaign, 'contacts'> & { contacts: (Omit<CampaignContact, 'contactId'> & { contactId: string; contact: unknown })[] }> {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, userId }).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    
    await campaign.populate({
      path: 'contacts.contactId',
      model: 'Contact',
    });
    
    const doc = campaign.toObject();
    const mappedContacts = doc.contacts.map((c) => {
      // At this point, c.contactId is the populated Contact object.
      const populatedContact = c.contactId as unknown as { _id: mongoose.Types.ObjectId };
      return {
        ...c,
        contact: populatedContact,
        contactId: populatedContact._id.toString(),
      };
    });
    
    return {
      ...doc,
      contacts: mappedContacts,
    };
  }

  async attachContacts(
    userId: string,
    campaignId: string,
    dto: AttachContactsDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, userId }).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Verify contacts belong to user
    const ownedContacts = await this.contactsService.findOwnedByIds(userId, dto.contactIds);
    const ownedContactIds = new Set(ownedContacts.map(c => (c as unknown as mongoose.Document)._id.toString()));

    const existingContactIds = new Set(campaign.contacts.map(c => c.contactId.toString()));

    for (const contactId of dto.contactIds) {
      if (ownedContactIds.has(contactId) && !existingContactIds.has(contactId)) {
        campaign.contacts.push({
          contactId: contactId as unknown as mongoose.Types.ObjectId,
          status: GenerationStatus.NOT_GENERATED,
        });
      }
    }

    return campaign.save();
  }

  async generateForContact(
    userId: string,
    campaignId: string,
    contactId: string,
  ): Promise<{ status: string; message?: string; error?: string }> {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, userId }).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const campaignContact = campaign.contacts.find(c => c.contactId.toString() === contactId);
    if (!campaignContact) {
      throw new NotFoundException('Contact not attached to this campaign');
    }

    const contacts = await this.contactsService.findOwnedByIds(userId, [contactId]);
    if (contacts.length === 0) {
      throw new NotFoundException('Contact not found');
    }
    const contact = contacts[0];

    // Set to pending
    campaignContact.status = GenerationStatus.PENDING;
    campaignContact.error = undefined;
    await campaign.save();

    try {
      // Interpolate
      let prompt = campaign.promptTemplate;
      const data: Record<string, string> = {
        name: contact.name || '',
        email: contact.email || '',
        company: contact.company || '',
        title: contact.title || '',
      };
      
      prompt = prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return data[key] || '';
      });

      const message = await this.llm.complete(prompt);

      campaignContact.status = GenerationStatus.FINISHED;
      campaignContact.generatedMessage = message;
      await campaign.save();

      return {
        status: campaignContact.status,
        message: campaignContact.generatedMessage,
      };
    } catch (err: unknown) {
      // Handle error gracefully
      campaignContact.status = GenerationStatus.FAILED;
      const errorMessage = err instanceof Error ? err.message : String(err);
      campaignContact.error = errorMessage || 'LLM Generation failed';
      await campaign.save();

      return {
        status: campaignContact.status,
        error: campaignContact.error,
      };
    }
  }
}
