import {
  resolveProductCategory,
  resolveProductsCategoryFromMenu,
  matchesProductToCategory,
  toProductsCategoryPath,
  getCategoryPageTitle,
} from "../src/lib/category";

const cases: Array<[string, string]> = [
  ["automotive", "automotive"],
  ["car", "automotive"],
  ["auto", "automotive"],
  ["vehicle", "automotive"],
  ["transponders", "automotive"],
  ["transponder", "automotive"],
  ["garage", "garage"],
  ["garage-gate", "garage"],
  ["home", "home"],
  ["locksmithing", "locksmith"],
  ["all", "all"],
];

let fail = 0;
for (const [input, expected] of cases) {
  const got = resolveProductCategory(input);
  if (got !== expected) {
    console.log(`FAIL resolve(${input}) = ${got}, expected ${expected}`);
    fail++;
  }
}

const checks: Array<[string, unknown]> = [
  ["menu automotive", resolveProductsCategoryFromMenu("automotive") === "automotive"],
  ["path automotive", toProductsCategoryPath("automotive") === "/products/automotive"],
  ["title automotive", getCategoryPageTitle("automotive") === "Automotive"],
  [
    "transponder product matches automotive",
    matchesProductToCategory({ name: "ID46 Transponder Chip for Car Key", category: "automotive" }, "automotive"),
  ],
  [
    "legacy car product matches automotive",
    matchesProductToCategory({ name: "Remote Key Fob", category: "car" }, "automotive"),
  ],
  [
    "garage product does not match automotive",
    !matchesProductToCategory({ name: "Merlin Garage Remote", category: "garage" }, "automotive"),
  ],
  [
    "automotive product still matches all",
    matchesProductToCategory({ category: "automotive" }, "all"),
  ],
];

for (const [name, ok] of checks) {
  if (!ok) {
    console.log(`FAIL ${name}`);
    fail++;
  }
}

if (fail) {
  console.log(`${fail} failure(s)`);
  process.exit(1);
}
console.log("ALL OK");
