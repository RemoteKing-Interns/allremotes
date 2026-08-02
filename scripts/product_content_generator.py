#!/usr/bin/env python3
"""
Generate product content (Description, Features, Specification, Compatibility, Instructions)
for All Remotes using any OpenAI-compatible free LLM API (default: Groq),
and write the output directly to MongoDB.

Colab usage:
1. Upload this script to the Colab runtime.
2. In a cell, install deps and set env vars:
   !pip install openai pymongo[srv]
   !export GROQ_API_KEY="gsk_..." MONGODB_URI="mongodb+srv://..." MONGODB_DB="allremotes"
3. Test on one product:
   !python product_content_generator.py --mode single --index 0
4. Generate for all products:
   !python product_content_generator.py --mode all

The script updates each product document with description, features, specification,
compatibility and instructions fields. It paces calls to respect Groq RPM/TPM limits.
"""

import argparse
import json
import os
import time
from typing import Any

try:
    from openai import OpenAI, RateLimitError
except ImportError:
    raise SystemExit("openai not installed. In Colab run: !pip install openai")

try:
    from pymongo import MongoClient, errors as mongo_errors
except ImportError:
    raise SystemExit("pymongo not installed. In Colab run: !pip install pymongo[srv]")

DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_MONGO_URI = os.environ.get("MONGODB_URI", "")
DEFAULT_DB = os.environ.get("MONGODB_DB", "allremotes")
DEFAULT_COLLECTION = os.environ.get("MONGODB_COLLECTION", "products")
DEFAULT_RPM = 30
DEFAULT_TPM = 14_400


def search_terms(product: dict) -> list[str]:
    """Return relevant SEO keywords from the product title/brand."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    sku = product.get("sku", "")
    terms = [name]
    if brand:
        terms.extend([brand, f"{brand} Garage Door Remote", f"{brand} Replacement Remote"])
    if sku:
        terms.append(sku)
    if name:
        terms.append(name.split()[0] + " Remote")
    terms = [t.strip() for t in terms if t.strip()]
    return list(set(terms))


def build_prompt(product: dict) -> tuple[str, str]:
    """Build the system + user prompt for the LLM."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    sku = product.get("sku", "")
    price = product.get("price", "")
    existing = product.get("description", "")
    terms = search_terms(product)

    system = (
        "You are an e-commerce copywriter for All Remotes, an Australian garage door remote retailer. "
        "You write accurate, customer-friendly, SEO-aware product content. "
        "Return ONLY a valid JSON object with these five keys: "
        "description, features, specification, compatibility, instructions. "
        "Use Markdown for formatting. Do not include any text outside the JSON."
    )

    user = f"""Product: {name}
Brand: {brand or "—"}
SKU: {sku or "—"}
Price: ${price}
Existing description: {existing or "—"}

Use the product title and any existing information to fill the fields below.
Naturally include these SEO search terms where relevant: {', '.join(terms)}.

Return a JSON object with this structure:
{{
  "description": "The customer-friendly intro + what's included + why choose All Remotes. Use short sections with headings.",
  "features": "Markdown bullet list of key features.",
  "specification": "Markdown table with Specification | Details columns. Include rows: Brand, Model, Frequency, Coding Type, Number of Buttons, Battery, Battery Included, Dimensions, Colour, Warranty. Use '—' if unknown.",
  "compatibility": "Markdown bullet list of compatible models, with notes where needed. Use '✅' bullets.",
  "instructions": "Simple programming / setup steps. If unknown, say 'Programming varies depending on your garage door opener model. Please refer to your opener manual or contact us if you require assistance.'"
}}

Format to closely follow this example:

Description

A short, customer-friendly introduction explaining what the remote is, who it's for, and why it's a good replacement.

📦 What's Included
- 1 × Genuine/Compatible Remote
- Battery Included
- Key Ring (if included)
- Programming Instructions (if applicable)

⭐ Why choose All Remotes?
- 🇦🇺 Australian owned & operated
- 🚚 Fast Australia-wide shipping
- 🔋 Battery included
- ⭐ Quality tested products
- 📞 Friendly local support

⭐ Features
- Genuine or high-quality compatible replacement
- Secure rolling code/fixed code technology
- Controls up to X doors
- Compact, durable design
- Battery included
- Easy programming
- Australian stock

📋 Specifications
| Specification | Details |
| --- | --- |
| Brand | ... |
| Model | ... |
| Frequency | ... |
| Coding Type | ... |
| Number of Buttons | ... |
| Battery | ... |
| Battery Included | Yes |
| Dimensions | ... |
| Colour | ... |
| Warranty | 12 Months |

✔ Compatibility
- ✅ Compatible model 1 (note)
- ✅ Compatible model 2 (note)

📖 Programming Instructions
...

⚠️ Important Information
- Please check your garage door opener model before ordering.
- The appearance of your existing remote does not always determine compatibility.
- If you're unsure which remote you need, contact our team before purchasing.
"""
    return system, user


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _wait_for_rate_limit(last_call: float, tokens: int, rpm: int, tpm: int) -> float:
    """Sleep long enough to stay under both RPM and TPM limits."""
    now = time.time()
    elapsed = now - last_call
    rpm_wait = 60.0 / rpm
    tpm_wait = (tokens / tpm) * 60.0
    wait = max(rpm_wait, tpm_wait) - elapsed
    if wait > 0:
        time.sleep(wait)
    return time.time()


def generate_content(
    client: OpenAI,
    model: str,
    product: dict,
    max_retries: int = 3,
) -> tuple[dict[str, Any], int]:
    """Call the LLM and return (parsed_json, total_tokens_used)."""
    system, user = build_prompt(product)
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=2000,
            )
            raw = response.choices[0].message.content
            parsed = json.loads(raw)
            usage = response.usage
            tokens = usage.total_tokens if usage else _estimate_tokens(system + user + raw)
            return parsed, tokens
        except RateLimitError as e:
            retry_after = 2 ** attempt
            if e.response and "retry-after" in e.response.headers:
                try:
                    retry_after = float(e.response.headers["retry-after"])
                except ValueError:
                    pass
            print(f"Rate limited for {product.get('name')}: sleeping {retry_after}s")
            time.sleep(retry_after)
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Error generating for {product.get('name')}: {e}")
                return {}, 0
            time.sleep(2)
    return {}, 0


def get_db(uri: str, db_name: str, collection_name: str):
    client = MongoClient(uri)
    return client[db_name][collection_name]


def main():
    parser = argparse.ArgumentParser(description="Generate product content with a free LLM and save to MongoDB")
    parser.add_argument("--mode", choices=["single", "all"], default="single")
    parser.add_argument("--index", type=int, default=0, help="Product index for single mode")
    parser.add_argument("--uri", default=DEFAULT_MONGO_URI)
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--collection", default=DEFAULT_COLLECTION)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--api-key", default=None)
    parser.add_argument("--rpm", type=int, default=DEFAULT_RPM)
    parser.add_argument("--tpm", type=int, default=DEFAULT_TPM)
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set GROQ_API_KEY or OPENAI_API_KEY, or pass --api-key. "
            "In Colab: !export GROQ_API_KEY='...'"
        )

    if not args.uri:
        raise SystemExit(
            "Set MONGODB_URI, or pass --uri. "
            "In Colab: !export MONGODB_URI='...'"
        )

    llm = OpenAI(base_url=args.base_url, api_key=api_key)
    products_col = get_db(args.uri, args.db, args.collection)

    if args.mode == "single":
        product = products_col.find_one({}, skip=args.index)
        if not product:
            raise SystemExit(f"No product found at index {args.index}")
        print(f"\n=== Testing: {product.get('name')} (index {args.index}) ===")
        result, _ = generate_content(llm, args.model, product)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if result and "_id" in product:
            products_col.update_one({"_id": product["_id"]}, {"$set": result})
            print(f"Updated product {product['_id']} in MongoDB.")
        return

    # all mode
    last_call = 0.0
    success = 0
    failed = 0
    cursor = products_col.find({})
    total = products_col.count_documents({})

    for i, product in enumerate(cursor, 1):
        print(f"[{i}/{total}] {product.get('name')}")
        last_call = _wait_for_rate_limit(last_call, 0, args.rpm, args.tpm)
        result, tokens = generate_content(llm, args.model, product)
        if result and "_id" in product:
            products_col.update_one({"_id": product["_id"]}, {"$set": result})
            success += 1
            last_call = _wait_for_rate_limit(last_call, tokens, args.rpm, args.tpm)
        else:
            failed += 1

    print(f"\nDone. Updated {success} products, failed {failed}.")


if __name__ == "__main__":
    main()
