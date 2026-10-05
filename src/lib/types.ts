export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  category: string | null;
  image_url: string | null;
  sizes?: string[] | string | null;
  stock?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  id: string;
  cart_id?: string | null;
  product_id?: string | null;
  product?: Product | null;
  quantity: number;
  size?: string | null;
  user_id?: string | null;
  created_at?: string;
};

export type OrderForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};
