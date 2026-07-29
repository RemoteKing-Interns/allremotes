import { aliexpressAdapter } from "./aliexpress";
import { amazonAdapter } from "./amazon";
import type { ChannelAdapter, Marketplace } from "./core";
import { eBayAdapter } from "./ebay";
import { temuAdapter } from "./temu";

export * from "./core";
export { eBayAdapter, amazonAdapter, temuAdapter, aliexpressAdapter };

export function getAdapter(channel: Marketplace): ChannelAdapter {
  switch (channel) {
    case "ebay":
      return eBayAdapter;
    case "amazon":
      return amazonAdapter;
    case "temu":
      return temuAdapter;
    case "aliexpress":
      return aliexpressAdapter;
    default:
      throw new Error(`Unknown marketplace: ${channel}`);
  }
}
