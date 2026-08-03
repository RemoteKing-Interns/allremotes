#!/usr/bin/env python3
"""
Generate product content (Description, Features, Specification, Compatibility, Instructions)
for All Remotes using any OpenAI-compatible LLM API (default: OpenRouter gpt-4o),
and write the output directly to MongoDB.

Colab usage:
1. Upload this script to the Colab runtime.
2. In a cell, install deps and set env vars:
   !pip install openai pymongo[srv]
   !export OPENROUTER_API_KEY="sk-or-v1-..." MONGODB_URI="mongodb+srv://..." MONGODB_DB="allremotes"
3. Test on one product:
   !python product_content_generator.py --mode single --index 0
4. Generate for all products:
   !python product_content_generator.py --mode all

The script updates each product document with description, features, specification,
compatibility and instructions fields. It paces calls to respect provider RPM/TPM limits.
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

DEFAULT_BASE_URL = "https://api.mistral.ai/v1"
DEFAULT_MODEL = "open-mixtral-8x22b"
DEFAULT_REFERER = os.environ.get("OPENROUTER_REFERER", "https://allremotes.com.au")
DEFAULT_TITLE = os.environ.get("OPENROUTER_TITLE", "All Remotes")
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
        "You are a technical e-commerce copywriter for All Remotes, an Australian garage door remote retailer. "
        "You write accurate, detailed, customer-friendly and SEO-aware product content. "
        "Return ONLY a valid JSON object with the keys: 'description', 'features', 'specification', 'compatibility', 'instructions'. "
        "Each value is an HTML string for that product tab. "
        "Use HTML tags such as <h2>, <h3>, <h4>, <ul>, <li>, <ol>, <table>, <tr>, <th>, <td>, <p>, <strong>, <br/>. "
        "Be specific and technical where the product title, brand or existing data allows; use '—' for unknown values. "
        "Naturally weave the provided SEO search terms into the text. "
        "Do not include any text outside the JSON."
    )

    user = f"""Product: {name}
Brand: {brand or "—"}
SKU: {sku or "—"}
Price: ${price}
Existing description: {existing or "—"}

SEO search terms: {', '.join(terms)}.

Generate a JSON object with these 5 HTML fields for the product detail tabs:

1. "description": Product intro. Include <h2>[Product full name]</h2> with a factual paragraph (frequency, button count, coding type, opener series). Then <h3>What's Included</h3> <ul>, <h3>Important Information</h3> <ul>, <h3>Why Choose All Remotes?</h3> <ul>, and <h3>SEO Keywords</h3> <ul>.
2. "features": <h3>Features</h3> and a <ul> of concrete, product-specific features.
3. "specification": <h3>Specifications</h3> and a <table> with columns Specification | Details. Rows: Brand, Model, Remote Series, Frequency, Number of Buttons, Operating Modes, Coding Type, Battery, Battery Included, Dimensions, Colour, Warranty. Use '—' if unknown.
4. "compatibility": <h3>Compatibility</h3>, an intro <p>, and a <ul> of compatible receivers/models with ✅.
5. "instructions": <h3>Programming Instructions</h3> with <h4> sub-sections and numbered <ol> steps. If unknown, give a general safe guide and tell the user to refer to their opener manual.

Return only:
{{
  "description": "<h2>...</h2>...",
  "features": "<h3>Features</h3>...",
  "specification": "<h3>Specifications</h3>...",
  "compatibility": "<h3>Compatibility</h3>...",
  "instructions": "<h3>Programming Instructions</h3>..."
}}
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
    response_format: dict | None = None,
    max_retries: int = 3,
) -> tuple[dict[str, Any], int]:
    """Call the LLM and return (parsed_json, total_tokens_used)."""
    system, user = build_prompt(product)
    for attempt in range(max_retries):
        try:
            kwargs = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.4,
                "max_tokens": 4000,
            }
            if response_format:
                kwargs["response_format"] = response_format
            response = client.chat.completions.create(**kwargs)
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

    cloudflare_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    cloudflare_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    response_format = {"type": "json_object"}
    if cloudflare_account and cloudflare_token:
        args.base_url = f"https://api.cloudflare.com/client/v4/accounts/{cloudflare_account}/ai/v1"
        if args.model == DEFAULT_MODEL:
            args.model = "@cf/meta/llama-3.1-70b-instruct-awq"
        response_format = None

    api_key = args.api_key or os.environ.get("MISTRAL_API_KEY") or cloudflare_token or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("GROQ_API_KEY")
    print(f"DEBUG: using {args.base_url}, API key found: {bool(api_key)}")
    if not api_key:
        raise SystemExit(
            "Set MISTRAL_API_KEY, CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN, OPENROUTER_API_KEY, OPENAI_API_KEY or GROQ_API_KEY, or pass --api-key. "
            "In Colab: !export MISTRAL_API_KEY='...'"
        )

    if not args.uri:
        raise SystemExit(
            "Set MONGODB_URI, or pass --uri. "
            "In Colab: !export MONGODB_URI='...'"
        )

    default_headers = (
        {"HTTP-Referer": DEFAULT_REFERER, "X-Title": DEFAULT_TITLE}
        if "openrouter.ai" in args.base_url
        else {}
    )
    llm = OpenAI(
        base_url=args.base_url,
        api_key=api_key,
        default_headers=default_headers,
    )
    products_col = get_db(args.uri, args.db, args.collection)

    if args.mode == "single":
        product = products_col.find_one({}, skip=args.index)
        if not product:
            raise SystemExit(f"No product found at index {args.index}")
        print(f"\n=== Testing: {product.get('name')} (index {args.index}) ===")
        result, _ = generate_content(llm, args.model, product, response_format=response_format)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if result and "_id" in product:
            products_col.update_one(
                {"_id": product["_id"]},
                {
                    "$set": {
                        "description": result.get("description", ""),
                        "features": result.get("features", ""),
                        "specification": result.get("specification", ""),
                        "compatibility": result.get("compatibility", ""),
                        "instructions": result.get("instructions", ""),
                    },
                },
            )
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
        result, tokens = generate_content(llm, args.model, product, response_format=response_format)
        if result and "_id" in product:
            products_col.update_one(
                {"_id": product["_id"]},
                {
                    "$set": {
                        "description": result.get("description", ""),
                        "features": result.get("features", ""),
                        "specification": result.get("specification", ""),
                        "compatibility": result.get("compatibility", ""),
                        "instructions": result.get("instructions", ""),
                    },
                },
            )
            success += 1
            last_call = _wait_for_rate_limit(last_call, tokens, args.rpm, args.tpm)
        else:
            failed += 1

    print(f"\nDone. Updated {success} products, failed {failed}.")


if __name__ == "__main__":
    main()
