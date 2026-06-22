import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dtos/create-contact.dto';
import { ListContactsDto } from './dtos/list-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(userId: string, dto: CreateContactDto): Promise<Contact> {
    const createdContact = new this.contactModel({
      ...dto,
      userId,
    });
    return createdContact.save();
  }

  async list(
    userId: string,
    query: ListContactsDto,
  ): Promise<{ items: Contact[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, sort = 'createdAt' } = query;
    const skip = (page - 1) * limit;

    const filter: mongoose.FilterQuery<ContactDocument> = { userId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    // Deterministic sorting using _id as a tie-breaker
    const sortObj: Record<string, 1 | -1> = { [sort]: 1, _id: 1 };

    const [items, total] = await Promise.all([
      this.contactModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      this.contactModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Look up specific contacts owned by a user. The campaigns module needs this
   * to attach/generate against contacts without reaching into the model itself.
   */
  async findOwnedByIds(userId: string, contactIds: string[]): Promise<Contact[]> {
    return this.contactModel.find({ userId, _id: { $in: contactIds } }).exec();
  }
}
