import type { ChannelAdapter, ChannelCredentials, ChannelOrder, ListingPayload } from "./core";

export const amazonAdapter: ChannelAdapter = {
  name: "amazon",

  getAuthUrl(state: string) {
    throw new Error("Amazon SP-API auth not implemented. Register an SP-API app and set env vars first.");
  },

  async exchangeCode(code: string) {
    throw new Error("Amazon SP-API token exchange not implemented.");
  },

  async refreshCredentials(credentials: ChannelCredentials) {
    throw new Error("Amazon SP-API token refresh not implemented.");
  },

  async publishListing(payload: ListingPayload, creds: ChannelCredentials) {
    throw new Error("Amazon SP-API listing publish not implemented.");
  },

  async updateInventory(sku: string, price: number, quantity: number, creds: ChannelCredentials) {
    throw new Error("Amazon SP-API inventory update not implemented.");
  },

  async fetchOrders(since: Date, creds: ChannelCredentials) {
    return [];
  },
};
