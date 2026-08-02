#!/usr/bin/env python3
"""
Generate product content (Description, Features, Specification, Compatibility, Instructions)
for All Remotes using any OpenAI-compatible free LLM API (default: Groq).

Colab usage:
1. Upload this script and your `allremotes.products.json` to the Colab runtime.
2. In a cell, set your API key:
   !export GROQ_API_KEY="gsk_..."
3. Test on one product:
   !python product_content_generator.py --mode single --index 0
4. Generate for all products:
   !python product_content_generator.py --mode all

The script writes `product_content_output.json` with the generated fields keyed by product id.
"""

import argparse
import json
import os
import time
from typing import Any

try:
    from openai import OpenAI
except ImportError:
    raise SystemExit(
        "openai not installed. In Colab run: !pip install openai"
    )

DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
INPUT_PATH = "allremotes.products.json"
OUTPUT_PATH = "product_content_output.json"


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
    terms.extend([name.split()[0] + " Remote" if name else ""])
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


def generate_content(client: OpenAI, model: str, product: dict, max_retries: int = 3) -> dict[str, Any]:
    """Call the LLM and return the parsed JSON fields."""
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
            return json.loads(raw)
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Error generating for {product.get('name')}: {e}")
                return {}
            time.sleep(2)
    return {}


def load_products(path: str) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Input JSON must be a list of products")
    return data


def save_results(path: str, results: dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Generate product content with a free LLM")
    parser.add_argument("--mode", choices=["single", "all"], default="single")
    parser.add_argument("--index", type=int, default=0, help="Product index for single mode")
    parser.add_argument("--input", default=INPUT_PATH)
    parser.add_argument("--output", default=OUTPUT_PATH)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--api-key", default=None)
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set GROQ_API_KEY or OPENAI_API_KEY, or pass --api-key. "
            "In Colab: !export GROQ_API_KEY='...' before running."
        )

    client = OpenAI(base_url=args.base_url, api_key=api_key)
    products = load_products(args.input)

    if args.mode == "single":
        if not (0 <= args.index < len(products)):
            raise SystemExit(f"Index out of range. There are {len(products)} products.")
        product = products[args.index]
        print(f"\n=== Testing: {product.get('name')} (index {args.index}) ===")
        result = generate_content(client, args.model, product)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    # all mode
    results = {}
    for i, product in enumerate(products):
        print(f"[{i+1}/{len(products)}] {product.get('name')}")
        result = generate_content(client, args.model, product)
        if result:
            results[product.get("id", f"index-{i}")] = result
            save_results(args.output, results)
        # Stay under 30 RPM free tier
        time.sleep(max(2.1, 60.0 / 30))

    print(f"\nDone. Wrote {len(results)} results to {args.output}")


if __name__ == "__main__":
    main()
