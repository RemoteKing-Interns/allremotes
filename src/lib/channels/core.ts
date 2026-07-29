/**
 * Marketplace adapter core types and contracts.
 * All platform-specific adapters implement the ChannelAdapter interface.
 */

export type Marketplace = "ebay" | "amazon" | "temu" | "aliexpress";

export interface ChannelCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string; // ISO timestamp
  sellerId?: string;
  marketplaceId?: string;
  scopes?: string[];
}

export interface MarketplaceAccount {
  channel: Marketplace;
  connected: boolean;
  credentials: ChannelCredentials;
  updatedAt: string;
}

export interface ChannelListing {
  productId: string;
  sku: string;
  channel: Marketplace;
  externalId?: string;
  externalUrl?: string;
  status: "draft" | "listed" | "error" | "paused";
  lastError?: string;
  lastSyncedAt?: string;
}

export interface ChannelOrder {
  orderId: string;
  channel: Marketplace;
  externalOrderId: string;
  externalStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    fullName: string;
    email?: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  pricing: {
    currency: string;
    subtotal: number;
    total: number;
  };
}

export interface ListingPayload {
  sku: string;
  title: string;
  description: string;
  brand: string;
  condition: string;
  price: number;
  currency: string;
  quantity: number;
  images: string[];
  category?: string;
  mpn?: string;
  gtin?: string;
  type?: string;
  aspects?: Record<string, string[]>;
  packageWeight?: { value: number; unit: string };
  packageDimensions?: { length: number; width: number; height: number; unit: string };
}

export interface ChannelAdapter {
  name: Marketplace;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<ChannelCredentials>;
  refreshCredentials(credentials: ChannelCredentials): Promise<ChannelCredentials>;
  publishListing(payload: ListingPayload, creds: ChannelCredentials): Promise<{ externalId: string; externalUrl?: string }>;
  updateListing?(externalId: string, payload: ListingPayload, creds: ChannelCredentials): Promise<{ externalId: string; externalUrl?: string }>;
  updateInventory(sku: string, price: number, quantity: number, creds: ChannelCredentials): Promise<void>;
  fetchOrders(since: Date, creds: ChannelCredentials): Promise<ChannelOrder[]>;
}
