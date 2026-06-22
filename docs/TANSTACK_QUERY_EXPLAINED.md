# Understanding TanStack Query vs. Manual Fetching

When building React applications, fetching data from an API seems simple at first: just call `fetch()` when the component loads. However, as the app grows, you run into complex problems:
- **Loading States**: You need to manually track `isLoading`.
- **Error States**: You need to manually catch and display errors.
- **Race Conditions**: What if the user clicks "Next Page" twice quickly? 
- **Synchronization**: If you create a new contact, how do you tell the list to refresh?

In this project, we migrated from the "Old Approach" (manual `useState` and `useEffect` fetching) to the "New Approach" (using TanStack React Query). This document explains *why* and *how*, using the `useContacts` hook as a real-world example.

---

## 1. The Old Approach: Manual State Management

Before using TanStack Query, our `useContacts` hook looked like this:

```typescript
// THE OLD WAY
export function useContacts(initialParams) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactsApi.list(params);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load(); // Fetch data whenever parameters change
  }, [load]);

  return { data, loading, error, params, setParams, reload: load };
}
```

### The Problem with the Old Approach
1. **Boilerplate**: We had to write 30 lines of code just to manage `loading`, `data`, and `error` states.
2. **No Caching**: Every time you leave the page and come back, it shows a loading spinner and hits the API again, even if the data hasn't changed.
3. **Manual Refreshing**: If you submit the "Create Contact" form, you must manually call `reload()` to fetch the updated list. If you forget, the UI becomes out-of-sync with the database.

---

## 2. The New Approach: TanStack Query

TanStack Query acts as an automatic, intelligent cache. It handles all the boilerplate for you. Here is the exact same functionality rewritten with TanStack Query:

```typescript
// THE NEW WAY
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useContacts(initialParams) {
  const [params, setParams] = useState(initialParams);
  const queryClient = useQueryClient();

  // 1. Fetching Data (Queries)
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['contacts', params], // The unique ID for this data
    queryFn: () => contactsApi.list(params), // How to fetch it
  });

  // 2. Modifying Data (Mutations)
  const createMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      // 3. Automatic Synchronization
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return { data, loading, error, params, setParams, createMutation };
}
```

### Breaking Down the Magic

#### `useQuery` (Fetching Data)
Instead of managing states, we just tell TanStack:
- **`queryKey: ['contacts', params]`**: This is the unique "cache key". If `params.page` changes to `2`, the key becomes `['contacts', { page: 2 }]`. TanStack automatically recognizes the key changed and fetches the new data for you! If you go back to page 1, it instantly loads page 1 from memory (cache) without a loading spinner.
- **`queryFn`**: The actual API call to execute.

#### `useMutation` (Modifying Data)
Mutations are for `POST`, `PUT`, or `DELETE` operations. In our Contacts page, we use a mutation to create a new contact.

#### `invalidateQueries` (Automatic Synchronization)
This is the most powerful feature. Look at the `onSuccess` block in the mutation:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['contacts'] });
}
```
When you successfully create a new contact, this tells TanStack: *"Hey, the data cached under the key `['contacts']` is now stale (outdated)."* 
TanStack instantly throws away the old cache and re-fetches the list in the background. The table on your screen updates with the new contact automatically, without you having to manually trigger a refresh!

---

## 3. Real Example in the UI

Let's look at how this simplifies the actual `ContactsPage` component.

**Old UI Code:**
```tsx
const handleCreate = async (e) => {
  e.preventDefault();
  setCreating(true); // manual loading state
  try {
    await contactsApi.create(formState);
    reload(); // manual refresh
  } finally {
    setCreating(false);
  }
};

<button disabled={creating}>
  {creating ? 'Saving...' : 'Add Contact'}
</button>
```

**New UI Code (TanStack):**
```tsx
const handleCreate = (e) => {
  e.preventDefault();
  createMutation.mutate(formState); // Fire and forget!
};

// TanStack provides the `isPending` state automatically!
<button disabled={createMutation.isPending}>
  {createMutation.isPending ? 'Saving...' : 'Add Contact'}
</button>
```

### Summary
By migrating to TanStack Query, we achieved:
1. **Less Code**: We deleted all manual `useState` and `try/catch` boilerplate for loading/errors.
2. **Better UX**: The UI feels faster because data is cached in memory.
3. **Bulletproof Sync**: Using `invalidateQueries` ensures our frontend is always perfectly synchronized with the MongoDB backend.
