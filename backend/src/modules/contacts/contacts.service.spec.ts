import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service';
import { Contact } from './schemas/contact.schema';

/**
 * STARTER test. Replace/extend with a meaningful spec — the pagination/list logic
 * is the most valuable thing to cover here (stable ordering, search, scoping).
 *
 * You can mock the model as below, or stand up an in-memory Mongo if you prefer.
 */
describe('ContactsService', () => {
  let service: ContactsService;

  const mockExec = jest.fn();
  const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
  const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
  const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
  const mockFind = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
  const mockCountDocuments = jest.fn().mockReturnValue({ exec: mockExec });
  const mockSave = jest.fn();

  class MockContactModel {
    constructor(private data: any) {}
    save = mockSave;
    static find = mockFind;
    static countDocuments = mockCountDocuments;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getModelToken(Contact.name),
          useValue: MockContactModel,
        },
      ],
    }).compile();

    service = moduleRef.get(ContactsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return a paginated list of contacts with deterministic sorting', async () => {
      mockExec.mockResolvedValueOnce([{ _id: '1', name: 'John' }]); // for find
      mockExec.mockResolvedValueOnce(1); // for countDocuments

      const result = await service.list('user-1', { page: 2, limit: 10, sort: 'name' });

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(mockSort).toHaveBeenCalledWith({ name: 1, _id: 1 });
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockCountDocuments).toHaveBeenCalledWith({ userId: 'user-1' });

      expect(result).toEqual({
        items: [{ _id: '1', name: 'John' }],
        total: 1,
        page: 2,
        limit: 10,
      });
    });

    it('should apply search filters correctly', async () => {
      mockExec.mockResolvedValueOnce([]); // for find
      mockExec.mockResolvedValueOnce(0); // for countDocuments

      await service.list('user-1', { search: 'apple' });

      expect(mockFind).toHaveBeenCalledWith({
        userId: 'user-1',
        $or: [
          { name: { $regex: 'apple', $options: 'i' } },
          { company: { $regex: 'apple', $options: 'i' } },
        ],
      });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
    });
  });
});
