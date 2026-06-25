export type ApiResponse<T> = {
  success: boolean;
  message?: string | null;
  data?: T;
};

export type Product = {
  id: string;
  shopId?: string;
  categoryName?: string | null;
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  stockQuantity?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected" | string;
  rejectionReason?: string | null;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  displayOrder?: number;
  parentId?: string | null;
};

export type Shop = {
  id: string;
  ownerId: string;
  name: string;
  slug?: string;
  status?: "pending" | "active" | "suspended" | string;
  isVerified?: boolean;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  createdAt?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Cart = {
  id?: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
};

export type ForgotPasswordPayload = {
  identifier: string;
  newPassword: string;
  confirmPassword: string;
};

export type VerifySmsResetPayload = {
  phone: string;
  otpCode: string;
};

export type CreateOrderPayload = {
  shippingAddress: string;
  shippingFee?: number;
  paymentMethod?: "cod" | "bank_transfer" | "qr";
  note?: string;
  selectedItemIds?: string[];
};

export type UserProfile = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  shippingAddress?: string | null;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
  shippingAddress?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type OrderItem = {
  id?: string;
  productId?: string;
  productName?: string;
  priceAtOrder?: number;
  quantity: number;
  unitPrice?: number;
  subtotal: number;
};

export type Order = {
  id: string;
  status?: string;
  totalAmount?: number;
  shippingFee?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentExpiresAt?: string | null;
  shippingAddress?: string;
  note?: string;
  createdAt?: string;
  items?: OrderItem[];
};
