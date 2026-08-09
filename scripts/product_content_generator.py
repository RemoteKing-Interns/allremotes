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
import atexit
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from typing import Any

try:
    from openai import OpenAI, RateLimitError
except ImportError:
    raise SystemExit("openai not installed. In Colab run: !pip install openai")

try:
    from pymongo import MongoClient, errors as mongo_errors
except ImportError:
    raise SystemExit("pymongo not installed. In Colab run: !pip install pymongo[srv]")


def _load_dotenv_local(path: str = ".env.local"):
    """Load variables from .env.local into os.environ if present."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.join(root, path)
    if not os.path.exists(full):
        return
    with open(full, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_dotenv_local()

DEFAULT_BASE_URL = "https://api.mistral.ai/v1"
DEFAULT_MODEL = "open-mixtral-8x22b"
DEFAULT_REFERER = os.environ.get("OPENROUTER_REFERER", "https://allremotes.com.au")
DEFAULT_TITLE = os.environ.get("OPENROUTER_TITLE", "All Remotes")
DEFAULT_MONGO_URI = os.environ.get("MONGODB_URI", "")
DEFAULT_DB = os.environ.get("MONGODB_DB", "allremotes")
DEFAULT_COLLECTION = os.environ.get("MONGODB_COLLECTION", "products")
DEFAULT_RPM = 30
DEFAULT_TPM = 14_400
MAX_DB_RETRIES = 5


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
        "Return ONLY a valid JSON object with these EXACT keys: 'description', 'features', 'specification', 'compatibility', 'instructions'. "
        "Every key must be present and contain a non-empty HTML string. "
        "Each value is an HTML string for that product tab. "
        "Use HTML tags such as <h1>, <h2>, <h3>, <h4>, <ul>, <li>, <ol>, <table>, <tr>, <th>, <td>, <p>, <strong>, <br/>. "
        "Be specific and technical where the product title, brand or existing data allows; use '—' for unknown values. "
        "Naturally weave the provided SEO search terms into the text. "
        "Do not use emojis, checkmarks, warning symbols, or decorative characters. "
        "Use clean, minimal HTML with <h2> for section headings, <ul>/<li> for lists, and <p> for paragraphs. "
        "Avoid <br/> chains and inline styles. "
        "The store is now called All Remotes. "
        "Do not use 'Remote King', 'RemoteKing', 'RK', or any abbreviation of the old brand. "
        "Do not omit keys. Do not return empty values. Do not include any text outside the JSON."
    )

    user = f"""Product: {name}
Brand: {brand or "—"}
SKU: {sku or "—"}
Price: ${price}
Existing description: {existing or "—"}

SEO search terms: {', '.join(terms)}.

Generate a JSON object with these 5 HTML fields. Follow the exact structure below.

1. "description": Start with <h1>[Product full name]</h1>. Then a short customer-friendly intro paragraph. Then:
   <h2>What's Included</h2> <ul> (1 × Genuine/Compatible Remote, Battery Included, Key Ring if applicable, Programming Instructions if applicable).
   <h2>Important Information</h2> <ul> (check model before ordering, appearance does not determine compatibility, contact team if unsure).
   <h2>Why Choose All Remotes?</h2> <ul> (Australian owned, fast shipping, battery included, quality tested, friendly local support).

2. "features": Do NOT include a "Features" heading. Just a <ul> of concrete product-specific features (genuine/compatible, rolling/fixed code, controls X doors, compact durable, battery included, easy programming, Australian stock).

3. "specification": Do NOT include a "Specifications" heading. Just a <table> with columns Specification | Details. Rows exactly: Brand, Model, Remote Series, Frequency, Number of Buttons, Operating Modes, Coding Type, Battery, Battery Included, Dimensions, Colour, Warranty. Use '—' if unknown.

4. "compatibility": Do NOT include a "Compatibility" heading. Just an intro <p> then a clean <ul> with plain list items. Highlight important notes with <strong>Important:</strong>.

5. "instructions": Do NOT include a "Programming Instructions" heading. Just <h4> sub-sections and numbered <ol> steps if known. Otherwise use the fallback: "Programming varies depending on your garage door opener model. Please refer to your opener manual or contact us if you require assistance."

Return only:
{{
  "description": "<h1>...</h1>...<h2>What's Included</h2>...",
  "features": "<ul><li>...<li></ul>",
  "specification": "<table>...</table>",
  "compatibility": "<p>...</p><ul><li>...</li>...</ul>",
  "instructions": "<h4>...</h4><ol><li>...</li>...</ol>"
}}"""
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
    max_retries: int = 5,
) -> tuple[dict[str, Any], int, str]:
    """Call the LLM and return (parsed_json, total_tokens_used, raw_output)."""
    system, user = build_prompt(product)
    required_keys = {"description", "features", "specification", "compatibility", "instructions"}
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
            if not isinstance(parsed, dict):
                raise ValueError("response is not a JSON object")
            missing = required_keys - parsed.keys()
            if missing:
                raise ValueError(f"missing keys: {missing}")
            for key in list(parsed.keys()):
                if isinstance(parsed[key], str):
                    parsed[key] = _format_html(parsed[key])
            usage = response.usage
            tokens = usage.total_tokens if usage else _estimate_tokens(system + user + raw)
            return parsed, tokens, raw
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
                print(f"[failed] {product.get('name')} after {max_retries} retries: {e}")
                return {}, 0, ""
            print(f"[retry {attempt + 1}/{max_retries}] {product.get('name')}: {e}")
            time.sleep(2)
    return {}, 0, ""


def _format_html(html: str) -> str:
    """Add spacing and Tailwind-friendly styling to generated HTML."""
    if not html:
        return html
    # spacing after block elements
    for tag in ("p", "ul", "ol", "table", "h1", "h3", "h4"):
        html = html.replace(f"</{tag}>", f"</{tag}><br/>")

    # style and class map for opening tags (font sizes via Tailwind classes)
    tag_attrs = {
        "h1": 'class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem"',
        "h3": 'class="text-lg font-semibold text-neutral-900" style="margin-top:1.25rem;margin-bottom:0.5rem"',
        "h4": 'class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem"',
        "p": 'style="margin-bottom:0.75rem"',
        "ul": 'style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:disc"',
        "ol": 'style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:decimal"',
        "li": 'style="margin-bottom:0.35rem"',
        "table": 'style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:1rem"',
        "th": 'style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb;background-color:#f3f4f6;font-weight:700"',
        "td": 'style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb"',
    }
    for tag, attrs in tag_attrs.items():
        html = re.sub(rf"<{tag}\b[^>]*>", f"<{tag} {attrs}>", html, flags=re.IGNORECASE)
    return html


def _load_checkpoint(path: str) -> int:
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return max(0, int(f.read().strip()))
        except ValueError:
            pass
    return 0


def _save_checkpoint(path: str, index: int):
    with open(path, "w") as f:
        f.write(str(index))


def _log_output(path: str, entry: dict):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")


def _has_bordered_table(product: dict) -> bool:
    """Return True if the specification field already contains a bordered table."""
    spec = product.get("specification", "")
    if not isinstance(spec, str):
        return False
    return "<table" in spec.lower() and "border" in spec.lower()


def _has_proper_description(product: dict) -> bool:
    """Return True if the description has the expected generated format."""
    desc = product.get("description", "")
    if not isinstance(desc, str):
        return False
    return "<h1" in desc.lower() and "What's Included" in desc


def _needs_content_fix(product: dict) -> bool:
    """Return True if the product is missing the expected generated style."""
    return not _has_proper_description(product) or not _has_bordered_table(product)


def _update_and_verify(products_col, product: dict, result: dict) -> tuple[bool, int]:
    """Update product and verify the document was actually changed."""
    content_fields = ("description", "features", "specification", "compatibility", "instructions")
    for attempt in range(MAX_DB_RETRIES):
        products_col.update_one(
            {"_id": product["_id"]},
            {
                "$set": {
                    "description": result.get("description", ""),
                    "features": result.get("features", ""),
                    "specification": result.get("specification", ""),
                    "compatibility": result.get("compatibility", ""),
                    "instructions": result.get("instructions", ""),
                    "lastUpdated": datetime.now(timezone.utc),
                    "lastUpdatedBy": "collab",
                },
            },
        )
        stored = products_col.find_one({"_id": product["_id"]})
        if stored and all(stored.get(f) == result.get(f, "") for f in content_fields):
            return True, attempt + 1
        print(f"[db retry {attempt + 1}/{MAX_DB_RETRIES}] {product.get('name')}")
    return False, MAX_DB_RETRIES


def get_db(uri: str, db_name: str, collection_name: str):
    client = MongoClient(uri)
    return client[db_name][collection_name]


def _is_process_alive(pid: int) -> bool:
    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                capture_output=True,
                text=True,
            )
            return str(pid) in res.stdout
        except Exception:
            return True
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def _acquire_instance_lock(force: bool = False) -> str:
    lock_path = os.path.join(tempfile.gettempdir(), "product_content_generator.lock")
    if os.path.exists(lock_path) and not force:
        try:
            with open(lock_path, "r") as f:
                pid = int(f.read().strip())
            if pid != os.getpid() and _is_process_alive(pid):
                print(f"Another instance is already running (PID {pid}). Use --force to override.")
                raise SystemExit(1)
        except ValueError:
            pass
    with open(lock_path, "w") as f:
        f.write(str(os.getpid()))
    atexit.register(_release_instance_lock, lock_path)
    return lock_path


def _release_instance_lock(lock_path: str):
    try:
        if os.path.exists(lock_path):
            os.remove(lock_path)
    except OSError:
        pass


def main():
    parser = argparse.ArgumentParser(description="Generate product content with a free LLM and save to MongoDB")
    parser.add_argument("--mode", choices=["single", "all", "check", "fix"], default="single")
    parser.add_argument("--index", type=int, default=0, help="Product index for single mode")
    parser.add_argument("--start", type=int, default=0, help="Start index for all mode (resume)")
    parser.add_argument("--checkpoint", default="product_content_checkpoint.txt", help="File to store/restore last processed index")
    parser.add_argument("--delay", type=float, default=0.0, help="Extra seconds to sleep between products")
    parser.add_argument("--log", default="product_content_log.jsonl", help="File to append per-product AI output")
    parser.add_argument("--uri", default=DEFAULT_MONGO_URI)
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--collection", default=DEFAULT_COLLECTION)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--api-key", default=None)
    parser.add_argument("--rpm", type=int, default=DEFAULT_RPM)
    parser.add_argument("--tpm", type=int, default=DEFAULT_TPM)
    parser.add_argument("--force", action="store_true", help="Force run even if another instance appears to be running")
    args = parser.parse_args()

    _acquire_instance_lock(args.force)

    cloudflare_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    cloudflare_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    response_format = {"type": "json_object"}

    def _resolve_api_key(base_url: str) -> str:
        if args.api_key:
            return args.api_key
        if "mistral" in base_url:
            return os.environ.get("MISTRAL_API_KEY", "")
        if "cloudflare" in base_url:
            return cloudflare_token or ""
        if "openrouter" in base_url:
            return os.environ.get("OPENROUTER_API_KEY", "")
        if "openai" in base_url:
            return os.environ.get("OPENAI_API_KEY", "")
        if "groq" in base_url:
            return os.environ.get("GROQ_API_KEY", "")
        if "google" in base_url or "generativelanguage" in base_url:
            return os.environ.get("GOOGLE_API_KEY", "")
        # Fallback: try any available key
        return (
            os.environ.get("MISTRAL_API_KEY", "")
            or cloudflare_token
            or os.environ.get("OPENROUTER_API_KEY", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or os.environ.get("GROQ_API_KEY", "")
            or os.environ.get("GOOGLE_API_KEY", "")
        )

    api_key = _resolve_api_key(args.base_url)

    # If Cloudflare or Google is explicitly configured, disable JSON response_format
    if "cloudflare" in args.base_url:
        if args.model == DEFAULT_MODEL and cloudflare_account:
            args.model = "@cf/meta/llama-3.1-70b-instruct-awq"
        response_format = None
    elif "google" in args.base_url or "generativelanguage" in args.base_url:
        response_format = None

    print(f"DEBUG: using {args.base_url}, API key found: {bool(api_key)}")
    if not api_key:
        raise SystemExit(
            "Set the env var for your chosen provider (MISTRAL_API_KEY, CLOUDFLARE_API_TOKEN, OPENROUTER_API_KEY, OPENAI_API_KEY, GROQ_API_KEY or GOOGLE_API_KEY), or pass --api-key. "
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
        result, _, raw = generate_content(llm, args.model, product, response_format=response_format)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        update_info = {"updated": False, "modified_count": None, "acknowledged": False}
        if result and "_id" in product:
            update_res = products_col.update_one(
                {"_id": product["_id"]},
                {
                    "$set": {
                        "description": result.get("description", ""),
                        "features": result.get("features", ""),
                        "specification": result.get("specification", ""),
                        "compatibility": result.get("compatibility", ""),
                        "instructions": result.get("instructions", ""),
                        "lastUpdated": datetime.now(timezone.utc),
                        "lastUpdatedBy": "collab",
                    },
                },
            )
            update_info = {
                "updated": update_res.acknowledged,
                "modified_count": getattr(update_res, "modified_count", None),
                "acknowledged": update_res.acknowledged,
                "matched_count": getattr(update_res, "matched_count", None),
            }
            print(f"Updated product {product['_id']} in MongoDB. {update_info}")
        _log_output(
            args.log,
            {
                "mode": "single",
                "index": args.index,
                "product_id": str(product.get("_id", "")),
                "name": product.get("name"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "success": bool(result),
                "tokens": 0,
                "raw": raw,
                "result": result,
                "update_info": update_info,
            },
        )
        return

    # all / check mode
    last_call = 0.0
    success = 0
    failed = 0
    products = list(products_col.find({}))
    if args.mode == "check":
        products = [p for p in products if not _has_bordered_table(p)]
        total = len(products)
        if total == 0:
            print("No products missing styled specification tables.")
            return
        print(f"Check mode: {total} product(s) need updates.")
    if args.mode == "fix":
        products = [p for p in products if _needs_content_fix(p)]
        total = len(products)
        if total == 0:
            print("No products need content fixes.")
            return
        print(f"Fix mode: {total} product(s) need content updates.")
    total = len(products)
    start = max(args.start, _load_checkpoint(args.checkpoint))
    products = products[start:]

    for i, product in enumerate(products, start + 1):
        try:
            print(f"[{i}/{total}] {product.get('name')}")
            last_call = _wait_for_rate_limit(last_call, 0, args.rpm, args.tpm)
            result, tokens, raw = generate_content(llm, args.model, product, response_format=response_format)
            if result:
                print(json.dumps(result, indent=2, ensure_ascii=False))
            update_info = {"updated": False, "db_attempts": 0}
            if result and "_id" in product:
                updated, db_attempts = _update_and_verify(products_col, product, result)
                update_info = {
                    "updated": updated,
                    "db_attempts": db_attempts,
                }
                if updated:
                    success += 1
                    _save_checkpoint(args.checkpoint, i)
                    print(f"[ok] product {i} ({product.get('name')}) updated.")
                else:
                    failed += 1
                    print(f"[warn] product {i} ({product.get('name')}) DB verification failed after {db_attempts} attempts, continuing.")
                last_call = _wait_for_rate_limit(last_call, tokens, args.rpm, args.tpm)
            else:
                failed += 1
                print(f"[warn] product {i} ({product.get('name')}) no LLM result, continuing.")

            _log_output(
                args.log,
                {
                    "mode": args.mode,
                    "index": i,
                    "product_id": str(product.get("_id", "")),
                    "name": product.get("name"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "success": bool(result and update_info.get("updated")),
                    "tokens": tokens,
                    "raw": raw,
                    "result": result,
                    "update_info": update_info,
                    "error": None if (result and update_info.get("updated")) else (update_info.get("error") or "failed"),
                },
            )
        except Exception as err:
            failed += 1
            print(f"[error] product {i} ({product.get('name')}) raised {type(err).__name__}: {err}")
            _log_output(
                args.log,
                {
                    "mode": args.mode,
                    "index": i,
                    "product_id": str(product.get("_id", "")),
                    "name": product.get("name"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "success": False,
                    "tokens": 0,
                    "raw": "",
                    "result": None,
                    "update_info": {"updated": False, "db_attempts": 0},
                    "error": f"{type(err).__name__}: {err}",
                },
            )

        if args.delay:
            time.sleep(args.delay)

    print(f"\nDone. Updated {success}/{total} products, failed {failed}.")


if __name__ == "__main__":
    main()
