import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountService } from "@/services/account";
import type { Product, WishlistItem } from "@/types/api";

import { useAuth } from "./useAuth";

export const wishlistQueryKey = ["wishlist"] as const;

const upsertWishlistItem = (items: WishlistItem[], nextItem: WishlistItem) => [
  nextItem,
  ...items.filter((item) => item.product.id !== nextItem.product.id)
];

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const wishlistQuery = useQuery({
    queryKey: wishlistQueryKey,
    queryFn: () => accountService.getWishlist(),
    enabled: isAuthenticated
  });

  const items = isAuthenticated ? (wishlistQuery.data?.items ?? []) : [];
  const isWishlisted = (productId: string) => items.some((item) => item.product.id === productId);

  const addMutation = useMutation({
    mutationFn: (product: Product) => accountService.addToWishlist(product.id),
    onSuccess: ({ item }) => {
      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: upsertWishlistItem(current?.items ?? [], item)
      }));
    }
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => accountService.removeFromWishlist(productId),
    onSuccess: (_data, productId) => {
      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: (current?.items ?? []).filter((item) => item.product.id !== productId)
      }));
    }
  });

  const toggleWishlist = async (product: Product) => {
    if (isWishlisted(product.id)) {
      await removeMutation.mutateAsync(product.id);
      return false;
    }

    await addMutation.mutateAsync(product);
    return true;
  };

  return {
    ...wishlistQuery,
    items,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist: removeMutation.mutateAsync,
    isUpdating: addMutation.isPending || removeMutation.isPending
  };
};
