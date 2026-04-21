import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";

import { accountService } from "@/services/account";
import { useAuthContext } from "./AuthContext";

type CartContextValue = {
  cartCount: number;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuthContext();
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      startTransition(() => setCartCount(0));
      return;
    }

    const { items } = await accountService.getCart();
    startTransition(() =>
      setCartCount(items.reduce((accumulator, item) => accumulator + item.cantidad, 0))
    );
  };

  useEffect(() => {
    void (async () => {
      if (!isAuthenticated) {
        startTransition(() => setCartCount(0));
        return;
      }

      const { items } = await accountService.getCart();
      startTransition(() =>
        setCartCount(items.reduce((accumulator, item) => accumulator + item.cantidad, 0))
      );
    })();
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }

  return context;
};
