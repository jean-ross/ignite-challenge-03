import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`stock/${productId}`);
      if (response.data.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const existingProduct = cart.find(product => product.id === productId);
      if (existingProduct) {
        if (response.data.amount < existingProduct.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const updatedCart = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            };
          } else {
            return product;
          }
        });

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
      } else {
        const response = await api.get(`products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1
        };
        const updatedCart = [
          ...cart,
          newProduct
        ];
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.find(product => product.id === productId)) {
        throw new Error();
      }
      const updatedCart = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        throw new Error();
      }

      const response = await api.get<Stock>(`stock/${productId}`);
      if (response.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const existingProduct = cart.find(product => product.id === productId);
      if (existingProduct) {
        const updatedCart = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount
            };
          } else {
            return product;
          }
        });
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
