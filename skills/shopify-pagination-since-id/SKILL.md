# Shopify API Pagination with since_id

**Extracted:** 2026-02-13
**Context:** Fetching all customers/orders from Shopify Admin API

## Problem

Shopify's default pagination can miss records or return incomplete results when:
- Customer count is large (35,000+)
- Using `page` parameter (deprecated)
- Rate limiting causes gaps

Initial fetch returned only 499 customers instead of 35,789.

## Solution

Use `since_id` pagination pattern for reliable complete data:

```python
def get_all_customers(self, since_date: str) -> list:
    all_customers = []
    params = {
        "created_at_min": f"{since_date}T00:00:00+01:00",
        "limit": 250,  # Max allowed
        "fields": "id,email,tags,created_at"
    }

    while True:
        result = self._make_request("customers.json", params)
        customers = result.get("customers", [])

        if not customers:
            break

        all_customers.extend(customers)

        # Stop if we got fewer than limit (last page)
        if len(customers) < 250:
            break

        # Get next page using last customer's ID
        last_id = customers[-1]["id"]
        params["since_id"] = last_id

    return all_customers
```

## Key Points

1. **Start without since_id** - First request gets oldest records
2. **Use last record's ID** - Set `since_id` to continue from there
3. **Check for fewer than limit** - Indicates last page
4. **Max limit is 250** - Shopify API constraint
5. **Include only needed fields** - Faster response

## When to Use

- Fetching ALL records from Shopify (customers, orders, products)
- Data sync/export operations
- When customer/order counts exceed 250
- Building reports or analytics

## Common Mistakes

```python
# WRONG: Using page parameter (deprecated, unreliable)
params["page"] = page_num

# WRONG: Starting since_id at 0
params["since_id"] = 0  # Misses first batch

# WRONG: Not checking for empty response
while len(customers) == limit:  # Breaks on exact multiple
```

## Verification

Always verify total count:
```python
count_result = self._make_request("customers/count.json")
expected = count_result.get("count", 0)
actual = len(all_customers)
assert actual == expected, f"Mismatch: {actual} vs {expected}"
```
