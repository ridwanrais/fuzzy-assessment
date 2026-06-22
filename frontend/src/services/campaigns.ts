import { request } from './api';

/**
 * STARTER service layer for campaigns. Extend with what your pages need
 * (create campaign, attach contacts, generate message).
 */

export interface CampaignContact {
  contactId: string;
  contact: { _id: string; name: string; email: string }; // populated
  status: 'not_generated' | 'pending' | 'finished' | 'failed';
  generatedMessage?: string;
  error?: string;
  history?: { promptTemplate: string; generatedMessage: string; createdAt: string }[];
}

export interface Campaign {
  _id: string;
  name: string;
  promptTemplate: string;
  contacts: CampaignContact[];
  createdAt?: string;
  stats?: { total: number; finished: number };
}

export const campaignsApi = {
  list(): Promise<Campaign[]> {
    return request<Campaign[]>('/campaigns');
  },

  getOne(id: string): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${id}`);
  },

  generate(
    campaignId: string,
    contactId: string,
    overrideTemplate?: string,
  ): Promise<{ status: string; message?: string; error?: string }> {
    return request(`/campaigns/${campaignId}/contacts/${contactId}/generate`, {
      method: 'POST',
      body: overrideTemplate ? JSON.stringify({ overrideTemplate }) : undefined,
    });
  },

  create(body: { name: string; promptTemplate: string }): Promise<Campaign> {
    return request<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  attachContacts(
    campaignId: string,
    contactIds: string[],
  ): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${campaignId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ contactIds }),
    });
  },
};
