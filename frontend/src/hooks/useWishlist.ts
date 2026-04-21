import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [pendingActions, setPendingActions] = useState<Record<string, "add" | "remove">>({});

  const wishlistQuery = useQuery({
    queryKey: wishlistQueryKey,
    queryFn: () => accountService.getWishlist(),
    enabled: isAuthenticated
  });

  const items = isAuthenticated ? (wishlistQuery.data?.items ?? []) : [];
  const isWishlisted = (productId: string) => items.some((item) => item.product.id === productId);
  const isProductUpdating = (productId: string) => pendingProductIds.includes(productId);
  const getPendingAction = (productId: string) => pendingActions[productId] ?? null;

  const addMutation = useMutation({
    mutationFn: (product: Product) => accountService.addToWishlist(product.id),
    onMutate: async (product) => {
      setPendingProductIds((current) =>
        current.includes(product.id) ? current : [...current, product.id]
      );
      setPendingActions((current) => ({ ...current, [product.id]: "add" }));

      await queryClient.cancelQueries({ queryKey: wishlistQueryKey });
      const previous = queryClient.getQueryData<{ items: WishlistItem[] }>(wishlistQueryKey);

      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: upsertWishlistItem(current?.items ?? [], {
          id: `optimistic-${product.id}`,
          product
        })
      }));

      return { previous, productId: product.id };
    },
    onSuccess: ({ item }) => {
      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: upsertWishlistItem(current?.items ?? [], item)
      }));
    },
    onError: (_error, _product, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistQueryKey, context.previous);
      }
    },
    onSettled: (_data, _error, _product, context) => {
      if (context?.productId) {
        setPendingProductIds((current) => current.filter((id) => id !== context.productId));
        setPendingActions((current) => {
          const next = { ...current };
          delete next[context.productId];
          return next;
        });
      }
    }
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => accountService.removeFromWishlist(productId),
    onMutate: async (productId) => {
      setPendingProductIds((current) =>
        current.includes(productId) ? current : [...current, productId]
      );
      setPendingActions((current) => ({ ...current, [productId]: "remove" }));

      await queryClient.cancelQueries({ queryKey: wishlistQueryKey });
      const previous = queryClient.getQueryData<{ items: WishlistItem[] }>(wishlistQueryKey);

      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: (current?.items ?? []).filter((item) => item.product.id !== productId)
      }));

      return { previous, productId };
    },
    onSuccess: (_data, productId) => {
      queryClient.setQueryData<{ items: WishlistItem[] }>(wishlistQueryKey, (current) => ({
        items: (current?.items ?? []).filter((item) => item.product.id !== productId)
      }));
    },
    onError: (_error, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistQueryKey, context.previous);
      }
    },
    onSettled: (_data, _error, _productId, context) => {
      if (context?.productId) {
        setPendingProductIds((current) => current.filter((id) => id !== context.productId));
        setPendingActions((current) => {
          const next = { ...current };
          delete next[context.productId];
          return next;
        });
      }
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
    isProductUpdating,
    getPendingAction,
    toggleWishlist,
    removeFromWishlist: removeMutation.mutateAsync,
    isUpdating: addMutation.isPending || removeMutation.isPending
  };
};
