import type { ChannelAdapter, ChannelCredentials, ChannelOrder, ListingPayload } from "./core";

export const temuAdapter: ChannelAdapter = {
  name: "temu",

  getAuthUrl(state: string) {
    throw new Error("Temu Open API auth not implemented. Set TEMU_APP_KEY and TEMU_APP_SECRET first.");
  },

  async exchangeCode(code: string) {
    throw new Error("Temu Open API token exchange not implemented.");
  },

  async refreshCredentials(credentials: ChannelCredentials) {
    throw new Error("Temu Open API token refresh not implemented.");
  },

  async publishListing(payload: ListingPayload, creds: ChannelCredentials) {
    throw new Error("Temu product publish not implemented.");
  },

  async updateInventory(sku: string, price: number, quantity: number, creds: ChannelCredentials) {
    throw new Error("Temu inventory update not implemented.");
  },

  async fetchOrders(since: Date, creds: ChannelCredentials) {
    return [];
  },
};
