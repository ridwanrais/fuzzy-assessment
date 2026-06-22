'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, ListContactsParams } from '@/services/contacts';
import { ApiError } from '@/services/api';

export function useContacts(initial: ListContactsParams = {}) {
  const [params, setParams] = useState<ListContactsParams>(initial);
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    data,
    loading,
    error: error instanceof ApiError ? error.message : error?.message || null,
    params,
    setParams,
    reload: refetch,
    createMutation,
  };
}
