import { getDb, mongoEnabled } from "@/lib/mongo";
import { decrypt, encrypt } from "./crypto";
import { aliexpressAdapter } from "./aliexpress";
import { amazonAdapter } from "./amazon";
import type { ChannelCredentials, Marketplace, MarketplaceAccount, ChannelListing, ChannelOrder } from "./core";
import { eBayAdapter } from "./ebay";
import { temuAdapter } from "./temu";

function getAdapter(channel: Marketplace) {
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

const ACCOUNTS_COLLECTION = "marketplaceAccounts";
const LISTINGS_COLLECTION = "channelListings";
const ORDERS_COLLECTION = "channelOrders";

export async function getMarketplaceAccount(channel: Marketplace): Promise<MarketplaceAccount | null> {
  if (!mongoEnabled()) return null;
  const db = await getDb();
  const doc = await db.collection(ACCOUNTS_COLLECTION).findOne({ channel });
  if (!doc) return null;
  return {
    channel: doc.channel,
    connected: doc.connected,
    credentials: {
      ...doc.credentials,
      accessToken: decrypt(doc.credentials.accessToken),
      refreshToken: doc.credentials.refreshToken ? decrypt(doc.credentials.refreshToken) : undefined,
    },
    updatedAt: doc.updatedAt,
  } as MarketplaceAccount;
}

export async function saveMarketplaceAccount(account: MarketplaceAccount): Promise<void> {
  if (!mongoEnabled()) throw new Error("MongoDB required for marketplace accounts");
  const db = await getDb();
  await db.collection(ACCOUNTS_COLLECTION).updateOne(
    { channel: account.channel },
    {
      $set: {
        channel: account.channel,
        connected: account.connected,
        credentials: {
          ...account.credentials,
          accessToken: encrypt(account.credentials.accessToken),
          refreshToken: account.credentials.refreshToken ? encrypt(account.credentials.refreshToken) : undefined,
        },
        updatedAt: account.updatedAt,
      },
    },
    { upsert: true }
  );
}

export async function saveChannelListing(listing: ChannelListing): Promise<void> {
  if (!mongoEnabled()) return;
  const db = await getDb();
  await db.collection(LISTINGS_COLLECTION).updateOne(
    { productId: listing.productId, channel: listing.channel },
    { $set: { ...listing, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function getChannelListings(productId?: string): Promise<ChannelListing[]> {
  if (!mongoEnabled()) return [];
  const db = await getDb();
  const filter = productId ? { productId } : {};
  return db.collection(LISTINGS_COLLECTION).find(filter).toArray() as unknown as Promise<ChannelListing[]>;
}

export async function saveChannelOrder(order: ChannelOrder): Promise<void> {
  if (!mongoEnabled()) return;
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection(ORDERS_COLLECTION).updateOne(
    { orderId: order.orderId },
    { $set: { ...order, updatedAt: now } },
    { upsert: true }
  );

  // Also upsert into the main orders collection so channel orders show up
  // in the admin Orders UI (labels, Starshipit, Unleashed, status, etc.)
  // alongside site orders. Fields owned by the channel are always refreshed;
  // status/createdAt are only set on first insert so local admin changes
  // (e.g. marking shipped) aren't clobbered on resync.
  const id = `${order.channel.toUpperCase()}-${order.externalOrderId}`;
  await db.collection("orders").updateOne(
    { id },
    {
      $set: {
        channel: order.channel,
        externalOrderId: order.externalOrderId,
        externalStatus: order.externalStatus,
        customer: order.customer,
        shipping: order.shipping,
        items: order.items,
        pricing: order.pricing,
        updatedAt: now,
      },
      $setOnInsert: {
        id,
        status: order.status,
        createdAt: order.createdAt,
      },
    },
    { upsert: true }
  );
}

export async function getChannelOrders(channel: Marketplace, limit = 100): Promise<ChannelOrder[]> {
  if (!mongoEnabled()) return [];
  const db = await getDb();
  return db
    .collection(ORDERS_COLLECTION)
    .find({ channel })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as unknown as Promise<ChannelOrder[]>;
}

export async function getValidCredentials(channel: Marketplace): Promise<ChannelCredentials> {
  const account = await getMarketplaceAccount(channel);
  if (!account || !account.connected) {
    throw new Error(`No connected account for ${channel}`);
  }
  const expires = new Date(account.credentials.expiresAt).getTime();
  if (expires - Date.now() > 5 * 60 * 1000) {
    return account.credentials;
  }

  let refreshed: ChannelCredentials;
  try {
    refreshed = await getAdapter(channel).refreshCredentials(account.credentials);
  } catch (err) {
    throw new Error(`Refresh not implemented for ${channel}: ${err}`);
  }

  await saveMarketplaceAccount({
    channel,
    connected: true,
    credentials: refreshed,
    updatedAt: new Date().toISOString(),
  });
  return refreshed;
}
