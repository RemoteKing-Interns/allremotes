// Import remote images from Remotes folder
import remote1 from "../Remotes/001_s-l140.webp";
import remote2 from "../Remotes/002_s-l500.webp";
import remote3 from "../Remotes/003_s-l140.webp";
import remote4 from "../Remotes/004_s-l140.webp";
import remote5 from "../Remotes/005_s-l140.webp";
import remote6 from "../Remotes/006_s-l500.webp";
import remote7 from "../Remotes/007_s-l500.webp";
import remote8 from "../Remotes/008_s-l500.webp";
import remote9 from "../Remotes/009_s-l500.webp";
import remote10 from "../Remotes/010_s-l500.webp";
import remote11 from "../Remotes/011_s-l500.webp";
import remote12 from "../Remotes/012_s-l500.webp";
import remote13 from "../Remotes/013_s-l500.webp";
import remote14 from "../Remotes/014_sprds3_18.png";
import remote15 from "../Remotes/015_s-l140.webp";
import remote16 from "../Remotes/016_s-l500.webp";
import remote17 from "../Remotes/017_s-l500.webp";
import remote18 from "../Remotes/018_s-l140.webp";
import remote19 from "../Remotes/019_s-l500.webp";
import remote20 from "../Remotes/020_s-l500.webp";
import remote21 from "../Remotes/021_s-l500.webp";
import remote22 from "../Remotes/022_s-l500.webp";
import remote23 from "../Remotes/023_s-l500.webp";
import remote24 from "../Remotes/024_s-l500.webp";
import remote25 from "../Remotes/025_s-l140.webp";
import remote26 from "../Remotes/026_s-l500.webp";
import remote27 from "../Remotes/027_s-l500.webp";
import remote28 from "../Remotes/028_s-l500.webp";
import remote29 from "../Remotes/029_s-l500.webp";
import remote30 from "../Remotes/030_s-l500.webp";

// Array of remote images to cycle through (exported for StoreContext/product images)
export const remoteImages = [
  remote1,
  remote2,
  remote3,
  remote4,
  remote5,
  remote6,
  remote7,
  remote8,
  remote9,
  remote10,
  remote11,
  remote12,
  remote13,
  remote14,
  remote15,
  remote16,
  remote17,
  remote18,
  remote19,
  remote20,
  remote21,
  remote22,
  remote23,
  remote24,
  remote25,
  remote26,
  remote27,
  remote28,
  remote29,
  remote30,
];

// Helper function to get icon for menu item
const getIcon = (index) => remoteImages[index % remoteImages.length];

// Navigation menu data structure
export const navigationMenu = {
  "garage-gate": {
    title: "Garage & Gate",
    path: "/garage-gate",
    columns: [
      {
        title: "Transmitters",
        items: [
          {
            name: "Handheld Remotes",
            path: "/garage-gate/transmitters/handheld-remotes",
            icon: getIcon(0),
          },
          {
            name: "Keypads",
            path: "/garage-gate/transmitters/keypads",
            icon: getIcon(1),
          },
          {
            name: "Wall Buttons",
            path: "/garage-gate/transmitters/wall-buttons",
            icon: getIcon(2),
          },
          {
            name: "Cases & Shells",
            path: "/garage-gate/transmitters/cases-shells",
            icon: getIcon(3),
          },
          {
            name: "Upgrade Kits",
            path: "/garage-gate/transmitters/upgrade-kits",
            icon: getIcon(4),
          },
          {
            name: "Shop by Brand",
            path: "/garage-gate/transmitters/brands",
            icon: getIcon(5),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Accessories",
        items: [
          {
            name: "Visors & Wall Mounts",
            path: "/garage-gate/accessories/visors-mounts",
            icon: getIcon(6),
          },
          {
            name: "Receivers",
            path: "/garage-gate/accessories/receivers",
            icon: getIcon(7),
          },
          {
            name: "Smart Home Automation",
            path: "/garage-gate/accessories/smart-home",
            icon: getIcon(8),
          },
          {
            name: "Safety Beams",
            path: "/garage-gate/accessories/safety-beams",
            icon: getIcon(9),
          },
          {
            name: "Batteries",
            path: "/garage-gate/accessories/batteries",
            icon: getIcon(10),
          },
          {
            name: "Shop All",
            path: "/garage-gate/accessories",
            icon: getIcon(11),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Motors",
        items: [
          {
            name: "Roller Door Motors",
            path: "/garage-gate/motors/roller-door",
            icon: getIcon(12),
          },
          {
            name: "Sectional Door Motors",
            path: "/garage-gate/motors/sectional-door",
            icon: getIcon(13),
          },
          {
            name: "Slide Gate Motors",
            path: "/garage-gate/motors/slide-gate",
            icon: getIcon(14),
          },
          {
            name: "Swing Gate Motors",
            path: "/garage-gate/motors/swing-gate",
            icon: getIcon(15),
          },
          {
            name: "Commercial Motors",
            path: "/garage-gate/motors/commercial",
            icon: getIcon(16),
          },
          {
            name: "Spare Parts",
            path: "/garage-gate/motors/spare-parts",
            icon: getIcon(17),
          },
          {
            name: "Shop All",
            path: "/garage-gate/motors",
            icon: getIcon(18),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Garage Hardware",
        items: [
          {
            name: "Lock Hardware",
            path: "/garage-gate/garage-hardware/locks",
            icon: getIcon(19),
          },
          {
            name: "Hinges",
            path: "/garage-gate/garage-hardware/hinges",
            icon: getIcon(20),
          },
          {
            name: "Weather & Floor Seals",
            path: "/garage-gate/garage-hardware/seals",
            icon: getIcon(21),
          },
          {
            name: "Rollers",
            path: "/garage-gate/garage-hardware/rollers",
            icon: getIcon(22),
          },
          {
            name: "Springs",
            path: "/garage-gate/garage-hardware/springs",
            icon: getIcon(23),
          },
          {
            name: "Shop All",
            path: "/garage-gate/garage-hardware",
            icon: getIcon(24),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Gate Hardware",
        items: [
          {
            name: "Wheels",
            path: "/garage-gate/gate-hardware/wheels",
            icon: getIcon(25),
          },
          {
            name: "Racks",
            path: "/garage-gate/gate-hardware/racks",
            icon: getIcon(26),
          },
          {
            name: "Guide Blocks",
            path: "/garage-gate/gate-hardware/guide-blocks",
            icon: getIcon(27),
          },
          {
            name: "Support Rollers",
            path: "/garage-gate/gate-hardware/support-rollers",
            icon: getIcon(28),
          },
          {
            name: "Stops",
            path: "/garage-gate/gate-hardware/stops",
            icon: getIcon(29),
          },
          {
            name: "Shop All",
            path: "/garage-gate/gate-hardware",
            icon: getIcon(0),
            isShopAll: true,
          },
        ],
      },
    ],
  },
  automotive: {
    title: "Automotive",
    path: "/automotive",
    columns: [
      {
        title: "Keys & Remotes",
        items: [
          {
            name: "Key Shells",
            path: "/automotive/keys/key-shells",
            icon: getIcon(1),
          },
          {
            name: "Complete Keys",
            path: "/automotive/keys/complete-keys",
            icon: getIcon(2),
          },
          {
            name: "Replacement Buttons",
            path: "/automotive/keys/replacement-buttons",
            icon: getIcon(3),
          },
          {
            name: "Key Sleeves",
            path: "/automotive/keys/key-sleeves",
            icon: getIcon(4),
          },
          {
            name: "Batteries",
            path: "/automotive/keys/batteries",
            icon: getIcon(5),
          },
          {
            name: "Shop All",
            path: "/automotive/keys",
            icon: getIcon(6),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Key Blades",
        items: [
          {
            name: "Universal Blades",
            path: "/automotive/blades/universal",
            icon: getIcon(7),
          },
          {
            name: "Smart Blades",
            path: "/automotive/blades/smart",
            icon: getIcon(8),
          },
          {
            name: "Other Blades",
            path: "/automotive/blades/other",
            icon: getIcon(9),
          },
          {
            name: "Multi-Function Keys",
            path: "/automotive/blades/multi-function",
            icon: getIcon(10),
          },
          {
            name: "Shop All",
            path: "/automotive/blades",
            icon: getIcon(11),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Automotive Tools",
        items: [
          {
            name: "Battery Tools",
            path: "/automotive/tools/battery-tools",
            icon: getIcon(12),
          },
          {
            name: "Diagnostic Tools",
            path: "/automotive/tools/diagnostic",
            icon: getIcon(13),
          },
          {
            name: "Key Cutting Machines",
            path: "/automotive/tools/key-cutting",
            icon: getIcon(14),
          },
          {
            name: "Key Programmers",
            path: "/automotive/tools/key-programmers",
            icon: getIcon(15),
          },
          {
            name: "Shop All",
            path: "/automotive/tools",
            icon: getIcon(16),
            isShopAll: true,
          },
        ],
      },
    ],
  },
  "for-the-home": {
    title: "For The Home",
    path: "/for-the-home",
    columns: [
      {
        title: "Home Automation",
        items: [
          {
            name: "Safe & Lockboxes",
            path: "/for-the-home/safe-lockboxes",
            icon: getIcon(17),
          },
          {
            name: "Lock Hardware",
            path: "/for-the-home/lock-hardware",
            icon: getIcon(18),
          },
          {
            name: "Air Conditioning Remotes",
            path: "/for-the-home/ac-remotes",
            icon: getIcon(19),
          },
          {
            name: "TV Remotes",
            path: "/for-the-home/tv-remotes",
            icon: getIcon(20),
          },
          {
            name: "House Alarm Remotes",
            path: "/for-the-home/alarm-remotes",
            icon: getIcon(21),
          },
          {
            name: "Roller Blind Remotes",
            path: "/for-the-home/blind-remotes",
            icon: getIcon(22),
          },
          {
            name: "Shop All",
            path: "/for-the-home",
            icon: getIcon(23),
            isShopAll: true,
          },
        ],
      },
    ],
  },
  locksmithing: {
    title: "Locksmithing",
    path: "/locksmithing",
    columns: [
      {
        title: "Keys & Remotes",
        items: [
          {
            name: "Xhorse",
            path: "/locksmithing/keys/xhorse",
            icon: getIcon(24),
          },
          {
            name: "KeyDIY",
            path: "/locksmithing/keys/keydiy",
            icon: getIcon(25),
          },
          {
            name: "Autel",
            path: "/locksmithing/keys/autel",
            icon: getIcon(26),
          },
          {
            name: "Transponders",
            path: "/locksmithing/keys/transponders",
            icon: getIcon(27),
          },
          {
            name: "Shop All",
            path: "/locksmithing/keys",
            icon: getIcon(28),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Key Blades",
        items: [
          {
            name: "Universal Blades",
            path: "/locksmithing/blades/universal",
            icon: getIcon(29),
          },
          {
            name: "Smart Blades",
            path: "/locksmithing/blades/smart",
            icon: getIcon(0),
          },
          {
            name: "Other Blades",
            path: "/locksmithing/blades/other",
            icon: getIcon(1),
          },
          {
            name: "Multi-Function Keys",
            path: "/locksmithing/blades/multi-function",
            icon: getIcon(2),
          },
          {
            name: "Shop All",
            path: "/locksmithing/blades",
            icon: getIcon(3),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Automotive Tools",
        items: [
          {
            name: "Battery Tools",
            path: "/locksmithing/tools/battery-tools",
            icon: getIcon(4),
          },
          {
            name: "Diagnostic Tools",
            path: "/locksmithing/tools/diagnostic",
            icon: getIcon(5),
          },
          {
            name: "Key Cutting Machines",
            path: "/locksmithing/tools/key-cutting",
            icon: getIcon(6),
          },
          {
            name: "Key Programmers",
            path: "/locksmithing/tools/key-programmers",
            icon: getIcon(7),
          },
          {
            name: "Shop All",
            path: "/locksmithing/tools",
            icon: getIcon(8),
            isShopAll: true,
          },
        ],
      },
      {
        title: "Lock Picking",
        items: [
          {
            name: "Individual Picks",
            path: "/locksmithing/picking/individual-picks",
            icon: getIcon(9),
          },
          {
            name: "Sets",
            path: "/locksmithing/picking/sets",
            icon: getIcon(10),
          },
          {
            name: "Pick Guns",
            path: "/locksmithing/picking/pick-guns",
            icon: getIcon(11),
          },
          {
            name: "Tension Tools",
            path: "/locksmithing/picking/tension-tools",
            icon: getIcon(12),
          },
          {
            name: "Shop All",
            path: "/locksmithing/picking",
            icon: getIcon(13),
            isShopAll: true,
          },
        ],
      },
    ],
  },
  "shop-by-brand": {
    title: "Shop By Brand",
    path: "/shop-by-brand",
    columns: [
      {
        title: "Popular Brands",
        items: [
          { name: "Elsema", path: "/shop-by-brand/elsema", icon: getIcon(14) },
          {
            name: "Centurion",
            path: "/shop-by-brand/centurion",
            icon: getIcon(15),
          },
          { name: "B&D", path: "/shop-by-brand/bd", icon: getIcon(16) },
          { name: "Merlin", path: "/shop-by-brand/merlin", icon: getIcon(17) },
          {
            name: "Hormann",
            path: "/shop-by-brand/hormann",
            icon: getIcon(18),
          },
        ],
      },
    ],
  },
  support: {
    title: "Support",
    path: "/support",
    columns: [
      {
        title: "Instructions & Manuals",
        items: [
          {
            name: "Remote Instructions",
            path: "/support/instructions/remotes",
            icon: getIcon(20),
          },
          {
            name: "Motor Manuals",
            path: "/support/instructions/motors",
            icon: getIcon(21),
          },
        ],
      },
      {
        title: "Online Tools",
        items: [
          {
            name: "ATA TX to Elsema Calculator",
            path: "/support/tools/ata-calculator",
            icon: getIcon(22),
          },
          {
            name: "Gliderol TM-27 Calculator",
            path: "/support/tools/gliderol-calculator",
            icon: getIcon(23),
          },
          {
            name: "Receiver Wiring Guide",
            path: "/support/tools/wiring-guide",
            icon: getIcon(24),
          },
        ],
      },
      {
        title: "FAQ",
        items: [
          { name: "All FAQ", path: "/support/faq", icon: getIcon(25) },
          {
            name: "Order Queries",
            path: "/support/faq/orders",
            icon: getIcon(26),
          },
          {
            name: "Shipping Queries",
            path: "/support/faq/shipping",
            icon: getIcon(27),
          },
          {
            name: "Programming Queries",
            path: "/support/faq/programming",
            icon: getIcon(28),
          },
        ],
      },
      {
        title: "Instructional Videos",
        items: [
          {
            name: "Remote Coding Videos",
            path: "/support/videos/remote-coding",
            icon: getIcon(29),
          },
          {
            name: "Remote Battery Videos",
            path: "/support/videos/batteries",
            icon: getIcon(0),
          },
          {
            name: "Car Key Shell Videos",
            path: "/support/videos/key-shells",
            icon: getIcon(1),
          },
          {
            name: "Car Key Battery Videos",
            path: "/support/videos/key-batteries",
            icon: getIcon(2),
          },
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    path: "/contact",
    hasDropdown: false,
  },
};
