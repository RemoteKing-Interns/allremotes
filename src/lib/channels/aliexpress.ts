import type { ChannelAdapter, ChannelCredentials, ChannelOrder, ListingPayload } from "./core";

export const aliexpressAdapter: ChannelAdapter = {
  name: "aliexpress",

  getAuthUrl(state: string) {
    throw new Error("AliExpress Open Platform auth not implemented. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET first.");
  },

  async exchangeCode(code: string) {
    throw new Error("AliExpress token exchange not implemented.");
  },

  async refreshCredentials(credentials: ChannelCredentials) {
    throw new Error("AliExpress token refresh not implemented.");
  },

  async publishListing(payload: ListingPayload, creds: ChannelCredentials) {
    throw new Error("AliExpress product publish not implemented.");
  },

  async updateInventory(sku: string, price: number, quantity: number, creds: ChannelCredentials) {
    throw new Error("AliExpress inventory update not implemented.");
  },

  async fetchOrders(since: Date, creds: ChannelCredentials) {
    return [];
  },
};
