/**
 * Add transponder products from Unleashed to the products collection.
 * For each SKU: fetches live price/stock/image from Unleashed, mirrors the
 * image to S3 (next/image only allows S3 hosts), and inserts a product doc
 * with generated description/features/specification/compatibility/instructions
 * matching the existing house format.
 *
 * Usage: npx tsx scripts/add-transponders.ts [--sku J-TPX2] [--dry]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const UNLEASHED_BASE = "https://api.unleashedsoftware.com";

// ---------- Unleashed ----------
const sign = (key: string, qs: string) =>
  crypto.createHmac("sha256", key).update(qs).digest("base64");

async function uGet(path: string, qs: string) {
  const res = await fetch(`${UNLEASHED_BASE}/${path}?${qs}`, {
    headers: {
      Accept: "application/json",
      "api-auth-id": process.env.UNLEASHED_API_ID!,
      "api-auth-signature": sign(process.env.UNLEASHED_API_KEY!, qs),
    },
  });
  return res.json();
}

async function getProduct(sku: string) {
  const d = await uGet("Products", `productCode=${encodeURIComponent(sku)}`);
  return d?.Items?.[0] || null;
}

async function getStock(sku: string) {
  const d = await uGet("StockOnHand", `productCode=${encodeURIComponent(sku)}`);
  const items = d?.Items || [];
  return items.reduce((a: number, i: any) => a + (i.AvailableQty ?? i.QtyOnHand ?? 0), 0);
}

// ---------- S3 ----------
function s3Config() {
  return {
    region: process.env.S3_REGION || process.env.AWS_REGION || "",
    bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  };
}

async function mirrorImage(imageUrl: string, sku: string): Promise<string | null> {
  const cfg = s3Config();
  const res = await fetch(imageUrl);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (res.headers.get("content-type") || "image/jpeg").includes("png") ? "png" : "jpg";
  const key = `images/${sku}-1.${ext}`;
  const client = new S3Client({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buf,
      ContentType: ext === "png" ? "image/png" : "image/jpeg",
      CacheControl: "public, max-age=31536000",
    })
  );
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
}

// ---------- HTML content builders (house format) ----------
const ul = (items: string[]) =>
  `<ul style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:disc">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") +
  `</ul>`;

const ol = (items: string[]) =>
  `<ol style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:decimal">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") +
  `</ol>`;

const td = (v: string) =>
  `<td style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb">${v}</td>`;
const th = (v: string) =>
  `<th style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb;background-color:#f3f4f6;font-weight:700">${v}</th>`;

const specTable = (rows: [string, string][]) =>
  `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:1rem">` +
  `<tr>${th("Specification")}${th("Details")}</tr>` +
  rows.map(([k, v]) => `<tr>${td(k)}${td(v)}</tr>`).join("") +
  `</table>`;

const WHY_ALLREMOTES = [
  "Australian owned and operated with fast Australia-wide shipping",
  "Quality-tested products backed by a 12-month warranty",
  "Friendly local support from a team that knows keys and remotes",
  "Trade and wholesale pricing available for locksmiths and workshops",
];

const TRANSPONDER_IMPORTANT = [
  "<strong>Important:</strong> Transponder chips are blank or clonable chips only — they are not programmed keys. The chip must be cloned or programmed into your vehicle by an automotive locksmith or key-cutting professional.",
  "Always confirm the exact transponder type your vehicle requires before ordering — appearance does not determine compatibility.",
  "If you are unsure which chip your key uses, contact the All Remotes team with your vehicle make, model and year for guidance.",
];

interface ContentSpec {
  intro: string;
  included: string[];
  features: string[];
  specs: [string, string][];
  compatIntro: string;
  compat: string[];
  instrSections: { title: string; steps: string[] }[];
}

function buildDescription(name: string, spec: ContentSpec): string {
  return (
    `<h1 class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem">${name}</h1><br/>` +
    `<p style="margin-bottom:0.75rem">${spec.intro}</p><br/>` +
    `<h2>What's Included</h2>` + ul(spec.included) + `<br/>` +
    `<h2>Important Information</h2>` + ul(TRANSPONDER_IMPORTANT) + `<br/>` +
    `<h2>Why Choose All Remotes?</h2>` + ul(WHY_ALLREMOTES)
  );
}

// ---------- Product definitions ----------
interface ProductDef {
  sku: string;
  name: string;
  brand: string;
  seoTitle: string;
  tags: string;
  content: ContentSpec;
}

const PRODUCTS: ProductDef[] = [
  {
    sku: "J-4D67",
    name: "4D67 Transponder Chip for Toyota & Lexus Keys",
    brand: "JMA",
    seoTitle: "Toyota Lexus 4D67 Transponder Chip - Texas Crypto 80-Bit",
    tags: "TRANSPONDER, AUTOMOTIVE, TOYOTA, LEXUS",
    content: {
      intro:
        "The 4D67 Transponder Chip is a Texas Crypto 80-bit glass transponder used in a wide range of Toyota and Lexus transponder keys. As a direct replacement for lost or damaged key chips, this 4D67 chip restores the immobiliser function of your key shell or remote head when programmed by a qualified automotive locksmith.",
      included: ["1 x 4D67 Texas Crypto Transponder Chip (Glass)"],
      features: [
        "Genuine 4D67 Texas Crypto 80-bit transponder chip",
        "Glass-encapsulated chip for durability inside the key head",
        "Direct replacement for Toyota and Lexus transponder keys using ID67 / 4D67",
        "Suitable for transponder cloning or immobiliser programming",
        "Supplied blank, ready for professional programming",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "4D67"],
        ["Chip Type", "Texas Crypto (80-bit)"],
        ["Transponder ID", "4D67 / ID67"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes — clonable with compatible tools"],
        ["Programming", "Key programmer or cloning device required"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The 4D67 transponder is used across many Toyota and Lexus vehicles. It is commonly found in remote head keys and standard transponder keys for the models below.",
      compat: [
        "Toyota: Camry, Aurion, Corolla, Hilux, LandCruiser, Prado, RAV4, Kluger, Yaris and more (model and year dependent)",
        "Lexus: selected IS, GS, RX and LX series keys using 4D67",
        "Also used in some Daihatsu and Scion keys",
        "<strong>Important:</strong> Toyota uses several chip types (4C, 4D60, 4D66, 4D67, 4D68, G and H chips) — confirm your required chip ID before ordering.",
      ],
      instrSections: [
        {
          title: "Programming or Cloning the 4D67 Chip",
          steps: [
            "Confirm the vehicle requires a 4D67 / ID67 transponder (check the original key or use a chip reader).",
            "Using a compatible cloning device (e.g. JMA TRS-5000 or equivalent), read the original key's transponder data.",
            "Write the data to the new 4D67 chip, or program the chip to the vehicle using a diagnostic key programmer.",
            "Insert the chip into the key head or remote shell and test starting the vehicle.",
          ],
        },
        {
          title: "Professional Programming Recommended",
          steps: [
            "If the vehicle has no working key, the transponder must be programmed via the OBD diagnostic port by an automotive locksmith or dealer.",
            "Cloning is only possible when a working original key is available.",
          ],
        },
      ],
    },
  },
  {
    sku: "J-TP02",
    name: "JMA TP02 Re-Writable Transponder Cloning Chip",
    brand: "JMA",
    seoTitle: "JMA TP02 Re-Writable Transponder Cloning Chip",
    tags: "TRANSPONDER, AUTOMOTIVE, JMA, CLONING",
    content: {
      intro:
        "The JMA TP02 is a re-writable transponder cloning chip designed for duplicating fixed-code transponder keys. When used with a JMA TRS-5000 or compatible cloning machine, the TP02 can be written over and over, making it the go-to chip for locksmiths who cut and clone automotive keys daily.",
      included: ["1 x JMA TP02 Re-Writable Transponder Chip (Glass)"],
      features: [
        "Genuine JMA TP02 re-writable transponder chip",
        "Clones fixed-code transponders — can be erased and rewritten multiple times",
        "Glass capsule form factor fits most standard key heads",
        "Works with JMA TRS-5000 series and compatible cloning machines",
        "Cost-effective chip for high-volume key duplication",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "TP02"],
        ["Chip Type", "Fixed-code clonable transponder"],
        ["Transponder ID", "TP02"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes — multiple times"],
        ["Programming", "JMA TRS-5000 or compatible cloning device"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The JMA TP02 clones a wide range of fixed-code transponder chips found in automotive keys.",
      compat: [
        "Clones Texas Instruments fixed-code transponders (4C type) and other fixed-code chips supported by your cloning machine",
        "Suitable for most keys that use a glass transponder capsule",
        "Compatible with JMA TRS-5000, TRS-5000 EVO and equivalent cloning devices",
        "<strong>Important:</strong> The TP02 cannot clone crypto transponders — verify the chip type in the original key before cloning.",
      ],
      instrSections: [
        {
          title: "Cloning a Key with the TP02",
          steps: [
            "Place the original key in your cloning machine and read the transponder.",
            "Confirm the transponder is a supported fixed-code type.",
            "Insert the TP02 chip into the machine and write the copied data.",
            "Fit the TP02 chip into the new key shell and test the key in the vehicle.",
          ],
        },
      ],
    },
  },
  {
    sku: "T-005",
    name: "T5 Cloneable Transponder Chip (JMA TP05 Compatible)",
    brand: "Tecspro",
    seoTitle: "T5 Cloneable Transponder Chip Compatible JMA TP05",
    tags: "TRANSPONDER, AUTOMOTIVE, T5, CLONING",
    content: {
      intro:
        "The T5 Cloneable Transponder Chip is a fixed-code transponder compatible with JMA TP05 and T5 chips. It is the standard choice for duplicating older fixed-code automotive transponder keys and is re-writable, allowing repeated use with compatible cloning equipment.",
      included: ["1 x T5 Cloneable Transponder Chip"],
      features: [
        "Cloneable fixed-code transponder chip",
        "Direct equivalent of JMA TP05 / T5 chips",
        "Re-writable — can be erased and re-cloned",
        "Suits a wide range of older vehicles using fixed-code keys",
        "Compatible with common transponder cloning machines",
      ],
      specs: [
        ["Brand", "Tecspro"],
        ["Model", "T5"],
        ["Chip Type", "Fixed-code clonable transponder"],
        ["Equivalent To", "JMA TP05, T5"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes"],
        ["Programming", "Transponder cloning device required"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The T5 chip duplicates fixed-code transponders used in many older vehicle keys.",
      compat: [
        "Compatible with keys that use JMA TP05 or T5 type chips",
        "Clones Texas fixed-code transponders and other supported fixed-code types",
        "Works with JMA TRS-5000 series and compatible cloning machines",
        "<strong>Important:</strong> Not suitable for crypto transponders (4D, 46, 48 series) — check the original key's chip type first.",
      ],
      instrSections: [
        {
          title: "Cloning with the T5 Chip",
          steps: [
            "Read the original key's transponder with your cloning device.",
            "Verify the transponder is a fixed-code type supported by the T5.",
            "Write the data to the T5 chip using the cloning machine.",
            "Install the chip in the replacement key and test the vehicle starts.",
          ],
        },
      ],
    },
  },
  {
    sku: "T-021",
    name: "Texas Crypto 4D62 Transponder Chip (TPX2/TP28 Compatible)",
    brand: "Tecspro",
    seoTitle: "Texas Crypto 4D62 Transponder Chip TPX2 TP28",
    tags: "TRANSPONDER, AUTOMOTIVE, TEXAS, 4D",
    content: {
      intro:
        "The Texas Crypto 4D62 Transponder Chip is a genuine-style crypto transponder used in Toyota, Lexus and other vehicles running Texas 4D immobiliser systems. Equivalent to JMA TPX2, TPX5 and TP28 chips, it can be cloned or programmed by a professional locksmith.",
      included: ["1 x Texas Crypto 4D62 Transponder Chip (Glass)"],
      features: [
        "Texas Crypto 4D transponder, ID 4D62 (ID62)",
        "Equivalent to JMA TPX2, TPX5 and TP28 chips",
        "Glass-encapsulated for durability inside the key head",
        "Suits Toyota, Lexus and other vehicles using Texas 4D crypto keys",
        "Supplied blank for cloning or immobiliser programming",
      ],
      specs: [
        ["Brand", "Tecspro"],
        ["Model", "T-021"],
        ["Chip Type", "Texas Crypto 4D"],
        ["Transponder ID", "4D62 / ID62"],
        ["Equivalent To", "JMA TPX2, TPX5, TP28"],
        ["Form Factor", "Glass capsule"],
        ["Programming", "Cloning device or key programmer required"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "This Texas 4D crypto transponder suits a wide range of vehicles that use Texas 4D immobiliser chips.",
      compat: [
        "Toyota and Lexus keys using Texas Crypto 4D / 4D62 transponders",
        "Direct substitute for JMA TPX2, TPX5 and TP28 equivalent chips",
        "Also used in various other makes running Texas 4D crypto systems",
        "<strong>Important:</strong> Texas 4D comes in 40-bit and 80-bit variants — confirm the chip ID required for your vehicle before ordering.",
      ],
      instrSections: [
        {
          title: "Cloning or Programming the 4D62 Chip",
          steps: [
            "Read the original key with a cloning machine to confirm it is a Texas 4D crypto transponder.",
            "Write the transponder data to this chip using a compatible cloning device, or program it via OBD with a key programmer.",
            "Fit the chip into the key head and test the vehicle starts.",
            "If no working key exists, programming must be completed via the vehicle's diagnostic port by a locksmith.",
          ],
        },
      ],
    },
  },
  {
    sku: "T-025",
    name: "ID48 Megamos Crypto Transponder Chip — Precoded for Audi CAN (TP25)",
    brand: "Tecspro",
    seoTitle: "ID48 Megamos Crypto Transponder Precoded Audi CAN TP25",
    tags: "TRANSPONDER, AUTOMOTIVE, ID48, AUDI, VW",
    content: {
      intro:
        "The ID48 Megamos Crypto Transponder Chip is precoded for Audi CAN systems and compatible with TP25 and A2 equivalent chips. ID48 transponders are used across the Volkswagen Audi Group range — this precoded variant simplifies programming for supported Audi models.",
      included: ["1 x ID48 Megamos Crypto Transponder Chip (Precoded, Audi CAN)"],
      features: [
        "Megamos Crypto ID48 transponder chip",
        "Precoded for Audi CAN systems — reduces programming steps on supported vehicles",
        "Compatible with TP25 and A2 equivalent chips",
        "Used widely across VW, Audi, Skoda and Seat keys",
        "Supplied ready for professional programming",
      ],
      specs: [
        ["Brand", "Tecspro"],
        ["Model", "T-025"],
        ["Chip Type", "Megamos Crypto ID48"],
        ["Transponder ID", "ID48"],
        ["Precoded For", "Audi CAN systems"],
        ["Equivalent To", "TP25, A2"],
        ["Programming", "Key programmer required (OBD)"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "ID48 Megamos transponders are standard across the Volkswagen Audi Group and many other makes.",
      compat: [
        "Audi: A3, A4, A6, Q7 and other CAN-based Audi models (year dependent)",
        "Volkswagen, Skoda and Seat keys using ID48 transponders",
        "Also used in various Honda, Ford, Volvo and other ID48 applications",
        "<strong>Important:</strong> This chip is precoded for Audi CAN systems — for other vehicles, confirm whether a precoded or standard blank ID48 is required.",
      ],
      instrSections: [
        {
          title: "Programming the ID48 Chip",
          steps: [
            "Confirm the vehicle uses an ID48 Megamos transponder and that the Audi CAN precoding suits your application.",
            "Program the chip to the vehicle via the OBD port using a compatible key programmer (e.g. Xhorse, Autel, Lonsdor).",
            "Fit the programmed chip into the key head or remote shell.",
            "Test the vehicle starts and the immobiliser recognises the new key.",
          ],
        },
        {
          title: "Professional Programming Required",
          steps: [
            "ID48 transponders cannot be cloned with a standard cloning machine — they must be programmed to the vehicle.",
            "We recommend using an automotive locksmith or dealership for programming.",
          ],
        },
      ],
    },
  },
  {
    sku: "T-085",
    name: "ID79 Transponder Chip PCF7930/PCF7931 (Blank)",
    brand: "Tecspro",
    seoTitle: "ID79 Transponder Chip PCF7930 PCF7931 Blank",
    tags: "TRANSPONDER, AUTOMOTIVE, PCF7931, ID79",
    content: {
      intro:
        "The ID79 Transponder Chip is a blank Philips PCF7930/PCF7931 transponder used in a range of older Asian and European vehicle keys. Supplied blank and ready for professional programming or cloning by an automotive locksmith.",
      included: ["1 x ID79 Transponder Chip PCF7930/PCF7931 (Glass)"],
      features: [
        "Blank Philips PCF7930 / PCF7931 transponder chip",
        "Transponder ID79 as used in various older vehicle keys",
        "Glass capsule for easy installation inside the key head",
        "Suitable for transponder replacement or key duplication",
        "Supplied blank, ready for programming",
      ],
      specs: [
        ["Brand", "Tecspro"],
        ["Model", "T-085"],
        ["Chip Type", "Philips PCF7930 / PCF7931"],
        ["Transponder ID", "ID79"],
        ["Form Factor", "Glass capsule"],
        ["Programming", "Key programmer or cloning device required"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "PCF7930/PCF7931 transponders are found in a variety of older vehicle keys.",
      compat: [
        "Vehicles using Philips PCF7930 or PCF7931 transponder chips (ID79)",
        "Common in selected older Toyota, Mitsubishi and European models",
        "Also used in some motorcycle and scooter keys",
        "<strong>Important:</strong> Read the chip in your original key to confirm ID79 / PCF7931 before ordering.",
      ],
      instrSections: [
        {
          title: "Programming the PCF7930/7931 Chip",
          steps: [
            "Confirm the original key contains a PCF7930/PCF7931 (ID79) transponder.",
            "Clone the transponder data with a compatible cloning machine, or program via OBD with a key programmer.",
            "Install the chip in the key shell and test starting the vehicle.",
          ],
        },
      ],
    },
  },
  {
    sku: "J-TPX2",
    name: "JMA TPX2 Glass Transponder Chip — Clones 4D Texas Crypto",
    brand: "JMA",
    seoTitle: "JMA TPX2 Glass Transponder Cloning Chip 4D Texas Crypto",
    tags: "TRANSPONDER, AUTOMOTIVE, JMA, TPX2, CLONING",
    content: {
      intro:
        "The JMA TPX2 is a glass transponder cloning chip used for cloning 4D (40-bit) Texas Crypto transponders. Paired with a JMA TRS-5000 EVO or compatible cloning machine, it lets locksmiths duplicate 4D transponder keys without needing the vehicle present.",
      included: ["1 x JMA TPX2 Glass Transponder Chip"],
      features: [
        "Genuine JMA TPX2 glass transponder chip",
        "Clones 4D (40-bit) Texas Crypto transponders",
        "Glass capsule form factor",
        "Works with JMA TRS-5000 EVO and compatible cloning machines",
        "Supplied blank, ready for cloning",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "TPX2"],
        ["Chip Type", "Clonable transponder — 4D Texas Crypto (40-bit)"],
        ["Transponder ID", "TPX2"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes"],
        ["Programming", "JMA TRS-5000 EVO or compatible cloning device"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The TPX2 clones Texas 4D (40-bit) crypto transponders used across many vehicle keys.",
      compat: [
        "Clones Texas Crypto 4D (40-bit) transponders found in Toyota, Lexus, Ford and other keys",
        "Suitable for keys that accept a glass transponder capsule",
        "Requires a JMA TRS-5000 EVO or compatible cloning machine",
        "<strong>Important:</strong> The TPX2 clones 40-bit 4D chips — 80-bit 4D variants (4D67/4D68/4D72) require a different chip such as TPX4/TPX5.",
      ],
      instrSections: [
        {
          title: "Cloning a 4D Key with the TPX2",
          steps: [
            "Read the original key's transponder with the cloning machine to confirm it is a 4D (40-bit) Texas Crypto chip.",
            "Insert the TPX2 chip and write the cloned data.",
            "Fit the chip into the replacement key shell.",
            "Test the key starts the vehicle.",
          ],
        },
      ],
    },
  },
  {
    sku: "J-TPX5",
    name: "JMA TPX5 All-in-One Glass Transponder Chip (4C/4D/ID46)",
    brand: "JMA",
    seoTitle: "JMA TPX5 All In One Glass Transponder Chip 4C 4D ID46",
    tags: "TRANSPONDER, AUTOMOTIVE, JMA, TPX5, CLONING",
    content: {
      intro:
        "The JMA TPX5 is the all-in-one glass transponder cloning chip that combines TPX1, TPX2, TPX3 and TPX4 into a single chip. One TPX5 covers fixed-code 4C, Texas Crypto 4D (40-bit) and ID46 Philips Crypto transponders — reducing the chip stock a locksmith needs to carry.",
      included: ["1 x JMA TPX5 All-in-One Glass Transponder Chip"],
      features: [
        "Genuine JMA TPX5 all-in-one glass transponder chip",
        "Replaces TPX1, TPX2, TPX3 and TPX4 in a single chip",
        "Clones 4C fixed-code, 4D (40-bit) Texas Crypto and ID46 Philips Crypto transponders",
        "Glass capsule form factor",
        "Works with JMA TRS-5000 EVO and compatible cloning machines",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "TPX5"],
        ["Chip Type", "All-in-one clonable transponder"],
        ["Clones", "4C (fixed), 4D 40-bit (Texas Crypto), ID46 (Philips Crypto)"],
        ["Equivalent To", "TPX1 + TPX2 + TPX3 + TPX4"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes"],
        ["Programming", "JMA TRS-5000 EVO or compatible cloning device"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "One TPX5 chip covers the most common transponder types found in automotive keys.",
      compat: [
        "Clones 4C fixed-code transponders (older Toyota, Lexus and others)",
        "Clones Texas Crypto 4D (40-bit) transponders",
        "Clones ID46 Philips Crypto transponders (Honda, Hyundai, Kia, Mitsubishi, Nissan and more)",
        "<strong>Important:</strong> These chips need to be programmed using a cloning machine — the TPX5 does not cover 80-bit Texas or all crypto variants.",
      ],
      instrSections: [
        {
          title: "Cloning with the TPX5",
          steps: [
            "Read the original key's transponder with your cloning machine and confirm the chip type (4C, 4D 40-bit or ID46).",
            "Insert the TPX5 and write the cloned data — the machine automatically selects the correct emulation mode.",
            "Fit the chip into the replacement key shell.",
            "Test the key in the vehicle.",
          ],
        },
      ],
    },
  },
  {
    sku: "J-TPX5W",
    name: "JMA TPX5 Wedge Transponder Chip — All-in-One (4C/4D/ID46)",
    brand: "JMA",
    seoTitle: "JMA TPX5 Wedge Transponder Chip All In One 4C 4D ID46",
    tags: "TRANSPONDER, AUTOMOTIVE, JMA, TPX5, WEDGE",
    content: {
      intro:
        "The JMA TPX5 Wedge is the carbon wedge version of the all-in-one TPX5 chip, combining TPX1, TPX2 and TPX4 into one wedge-shaped transponder. It clones 4C, 4D (40-bit) and 46 transponders and suits keys designed for wedge-style chips.",
      included: ["1 x JMA TPX5 Wedge (Carbon) Transponder Chip"],
      features: [
        "Genuine JMA TPX5 wedge (carbon) transponder chip",
        "Wedge form factor for keys that do not accept glass capsules",
        "Combines TPX1, TPX2 and TPX4 into the one chip",
        "Clones 4C, 4D (40-bit) and 46 transponders",
        "Works with JMA TRS-5000 EVO and compatible cloning machines",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "TPX5 Wedge (TPX5W)"],
        ["Chip Type", "All-in-one clonable transponder"],
        ["Clones", "4C (fixed), 4D 40-bit (Texas Crypto), ID46 (Philips Crypto)"],
        ["Equivalent To", "TPX1 + TPX2 + TPX4"],
        ["Form Factor", "Carbon wedge"],
        ["Rewritable", "Yes"],
        ["Programming", "JMA TRS-5000 EVO or compatible cloning device"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The wedge version suits key heads designed for wedge-style transponders while covering the same chip types as the TPX5.",
      compat: [
        "Keys that require a wedge-style transponder rather than a glass capsule",
        "Clones 4C fixed-code, 4D (40-bit) Texas Crypto and ID46 Philips Crypto transponders",
        "Requires a JMA TRS-5000 EVO or compatible cloning machine",
        "<strong>Important:</strong> These chips need to be programmed using a cloning machine — confirm the original chip type before cloning.",
      ],
      instrSections: [
        {
          title: "Cloning with the TPX5 Wedge",
          steps: [
            "Read the original key's transponder with your cloning machine and confirm the chip type.",
            "Insert the TPX5 Wedge into the machine and write the cloned data.",
            "Install the wedge chip into the key head — ensure the key shell accepts wedge-style chips.",
            "Test the key in the vehicle.",
          ],
        },
      ],
    },
  },
  {
    sku: "J-TPX6",
    name: "JMA TPX6 Transponder Cloning Chip (ID46)",
    brand: "JMA",
    seoTitle: "JMA TPX6 Transponder Cloning Chip ID46",
    tags: "TRANSPONDER, AUTOMOTIVE, JMA, TPX6, ID46",
    content: {
      intro:
        "The JMA TPX6 is a transponder cloning chip designed for duplicating ID46 Philips Crypto transponders and other supported chip types. Used with a JMA TRS-5000 EVO or compatible cloning machine, it is the standard chip for cloning modern ID46 automotive keys.",
      included: ["1 x JMA TPX6 Transponder Cloning Chip (Glass)"],
      features: [
        "Genuine JMA TPX6 transponder cloning chip",
        "Clones ID46 Philips Crypto transponders and other supported types",
        "Glass capsule form factor",
        "Works with JMA TRS-5000 EVO and compatible cloning machines",
        "Supplied blank, ready for cloning",
      ],
      specs: [
        ["Brand", "JMA"],
        ["Model", "TPX6"],
        ["Chip Type", "Clonable transponder — ID46 Philips Crypto and supported types"],
        ["Transponder ID", "TPX6"],
        ["Form Factor", "Glass capsule"],
        ["Rewritable", "Yes"],
        ["Programming", "JMA TRS-5000 EVO or compatible cloning device"],
        ["Warranty", "12 Months"],
      ],
      compatIntro:
        "The TPX6 clones ID46 Philips Crypto transponders used widely across modern vehicle keys.",
      compat: [
        "Clones ID46 (Philips Crypto) transponders — Honda, Hyundai, Kia, Mitsubishi, Nissan, Suzuki and more",
        "Also covers other transponder types supported by your cloning machine",
        "Suitable for keys that accept a glass transponder capsule",
        "<strong>Important:</strong> Confirm the original key uses an ID46 or other TPX6-supported chip before cloning.",
      ],
      instrSections: [
        {
          title: "Cloning an ID46 Key with the TPX6",
          steps: [
            "Read the original key's transponder with the cloning machine to confirm it is a supported type (e.g. ID46).",
            "Insert the TPX6 chip and write the cloned data.",
            "Fit the chip into the replacement key shell.",
            "Test the key starts the vehicle.",
          ],
        },
      ],
    },
  },
];

// ---------- Main ----------
const DRY = process.argv.includes("--dry");
const skuArgIdx = process.argv.indexOf("--sku");
const onlySku = skuArgIdx > -1 ? process.argv[skuArgIdx + 1] : null;

async function main() {
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const db = process.env.MONGODB_DB ? mongo.db(process.env.MONGODB_DB) : mongo.db();
  const col = db.collection("products");

  const list = onlySku ? PRODUCTS.filter((p) => p.sku === onlySku) : PRODUCTS;
  if (list.length === 0) {
    console.log("No matching product defs.");
    return;
  }

  for (const def of list) {
    console.log(`\n=== ${def.sku} ===`);
    const existing = await col.findOne({ sku: def.sku });
    if (existing) {
      console.log("  already exists, skipping.");
      continue;
    }

    const u = await getProduct(def.sku);
    if (!u) {
      console.log("  NOT FOUND in Unleashed, skipping.");
      continue;
    }
    const price = Number(u.DefaultSellPrice) || 0;
    const stock = await getStock(def.sku);
    const imageUrl = u.ImageUrl || null;

    let s3Url: string | null = null;
    if (imageUrl && !DRY) {
      s3Url = await mirrorImage(imageUrl, def.sku);
      console.log("  image mirrored:", s3Url || "(failed, using source)");
    }
    const finalImage = s3Url || imageUrl || "";

    const c = def.content;
    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      id: crypto.randomUUID(),
      sku: def.sku,
      skuKey: def.sku.toLowerCase(),
      name: def.name,
      brand: def.brand,
      category: "automotive",
      cat1: "automotive",
      price,
      inStock: stock >= 1,
      stock,
      image: finalImage,
      images: finalImage ? [finalImage] : [],
      imgIndex: 0,
      description: buildDescription(def.name, c),
      features: ul(c.features),
      specification: specTable(c.specs),
      compatibility:
        `<p style="margin-bottom:0.75rem">${c.compatIntro}</p><br/>` + ul(c.compat),
      instructions: c.instrSections
        .map(
          (s) =>
            `<h4 class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem">${s.title}</h4><br/>` +
            ol(s.steps)
        )
        .join("<br/>"),
      condition: "Brand New",
      returns:
        "Returns accepted within 30 days. Must be in original, resaleable condition. Buyer pays return shipping.",
      seller: "AllRemotes (100% positive)",
      seo_title: def.seoTitle,
      tags: def.tags,
      inventoryRefreshedAt: now,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      lastUpdatedBy: "devin",
    };

    if (DRY) {
      console.log("  [dry] would insert:", def.name, "| $", price, "| stock", stock);
      continue;
    }
    await col.insertOne(doc);
    console.log(`  inserted: ${def.name} | $${price} | stock ${stock}`);
  }

  await mongo.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
