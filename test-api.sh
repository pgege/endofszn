#!/usr/bin/env bash
set -eo pipefail

API="http://localhost:3000/api"
COOKIE_JAR="/tmp/endofszn_test_cookies.txt"
RESP_BODY="/tmp/endofszn_resp_body.txt"
PASS=0
FAIL=0
FAIL_NAMES=""

req() {
  local method="$1" path="$2" body="${3:-}"

  if [ -n "$body" ]; then
    STATUS=$(curl -s -o "$RESP_BODY" -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -X "$method" "${API}${path}" \
      -H 'Content-Type: application/json' \
      -d "$body")
  else
    STATUS=$(curl -s -o "$RESP_BODY" -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -X "$method" "${API}${path}")
  fi

  BODY=$(cat "$RESP_BODY")
}

check() {
  local name="$1" expected="$2"
  if [ "$STATUS" = "$expected" ]; then
    echo "  PASS  $name (HTTP $STATUS)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name (expected $expected, got $STATUS)"
    echo "        Body: $(echo "$BODY" | head -c 300)"
    FAIL=$((FAIL + 1))
    FAIL_NAMES="$FAIL_NAMES\n    - $name (expected $expected, got $STATUS)"
  fi
}

jq_val() {
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); $1" 2>/dev/null || echo ""
}

echo "=== Login ==="
req POST /auth/login '{"email":"gege.temi@gmail.com","password":"test1234"}'
if [ "$STATUS" != "201" ]; then
  echo "FATAL: Login failed (HTTP $STATUS). Body: $BODY"
  exit 1
fi
echo "  Login OK"

echo ""
echo "=== Stores ==="
req GET /stores
check "List Stores" "200"

STORE_ID=$(jq_val "print(d['stores'][0]['id'])")
if [ -z "$STORE_ID" ]; then
  echo "FATAL: No store found"; exit 1
fi
echo "  Using store: $STORE_ID"

req GET "/stores/$STORE_ID"
check "Get Store" "200"

req PUT "/stores/$STORE_ID" '{"name":"Test Store Updated"}'
check "Update Store" "200"

req GET "/stores?limit=5&offset=0&q=test"
check "List Stores (pagination)" "200"

echo ""
echo "=== Categories ==="
req GET "/stores/$STORE_ID/categories"
check "List Categories" "200"

req GET "/stores/$STORE_ID/categories?limit=5&offset=0&q=basket"
check "List Categories (pagination+search)" "200"

req POST "/stores/$STORE_ID/categories" '{"name":"Test Category API"}'
check "Create Category" "201"
CAT_ID=$(jq_val "print(d['categories'][0]['id'])")

if [ -n "$CAT_ID" ]; then
  req PUT "/stores/$STORE_ID/categories" "{\"id\":\"$CAT_ID\",\"name\":\"Test Category Updated\"}"
  check "Update Category" "200"

  req DELETE "/stores/$STORE_ID/categories" "{\"ids\":[\"$CAT_ID\"]}"
  check "Delete Category" "200"
else
  echo "  SKIP  Update/Delete Category (create failed)"
fi

echo ""
echo "=== Products ==="
req GET "/stores/$STORE_ID/products"
check "List Products" "200"

req GET "/stores/$STORE_ID/products?limit=5&offset=0&q=test&order=-title"
check "List Products (pagination+search+sort)" "200"

req GET "/stores/$STORE_ID/categories?limit=200"
LEAF_CAT_ID=$(jq_val "
cats = d.get('categories',[])
for c in cats:
  children = c.get('category_children',[])
  if len(children) == 0:
    print(c['id'])
    break
")

if [ -n "$LEAF_CAT_ID" ]; then
  req POST "/stores/$STORE_ID/products" "{\"title\":\"Test Product API\",\"status\":\"draft\",\"category_ids\":[\"$LEAF_CAT_ID\"],\"options\":[{\"title\":\"Default\",\"values\":[\"Default\"]}]}"
  check "Create Product" "201"
  PROD_ID=$(jq_val "print(d['products'][0]['id'])")

  if [ -n "$PROD_ID" ]; then
    req PUT "/stores/$STORE_ID/products" "{\"id\":\"$PROD_ID\",\"title\":\"Test Product Updated\"}"
    check "Update Product" "200"

    req DELETE "/stores/$STORE_ID/products" "{\"ids\":[\"$PROD_ID\"]}"
    check "Delete Product" "200"
  else
    echo "  SKIP  Update/Delete Product (create failed)"
  fi
else
  echo "  SKIP  Create/Update/Delete Product (no leaf category)"
fi

echo ""
echo "=== Promotions ==="
req GET "/stores/$STORE_ID/promotions"
check "List Promotions" "200"

req GET "/stores/$STORE_ID/promotions?limit=5&offset=0&q=test&order=-created_at"
check "List Promotions (pagination+search+sort)" "200"

req POST "/stores/$STORE_ID/promotions" '{"code":"APITEST10","type":"standard","status":"active","is_automatic":false,"application_method":{"type":"percentage","target_type":"order","value":"10","max_quantity":1,"allocation":"each"}}'
check "Create Promotion" "201"
PROMO_ID=$(jq_val "print(d['promotions'][0]['id'])")

if [ -n "$PROMO_ID" ]; then
  req PUT "/stores/$STORE_ID/promotions" "{\"id\":\"$PROMO_ID\",\"code\":\"APITEST10UPD\"}"
  check "Update Promotion" "200"

  req DELETE "/stores/$STORE_ID/promotions" "{\"ids\":[\"$PROMO_ID\"]}"
  check "Delete Promotion" "200"
else
  echo "  SKIP  Update/Delete Promotion (create failed)"
fi

echo ""
echo "=== Collections ==="
req GET "/stores/$STORE_ID/collections"
check "List Collections" "200"

req GET "/stores/$STORE_ID/collections?limit=5&offset=0&q=test&order=-created_at"
check "List Collections (pagination+search+sort)" "200"

req POST "/stores/$STORE_ID/collections" '{"title":"Test Collection API"}'
check "Create Collection" "201"
COLL_ID=$(jq_val "print(d['collections'][0]['id'])")

if [ -n "$COLL_ID" ]; then
  req PUT "/stores/$STORE_ID/collections" "{\"id\":\"$COLL_ID\",\"title\":\"Test Collection Updated\"}"
  check "Update Collection" "200"

  req DELETE "/stores/$STORE_ID/collections" "{\"ids\":[\"$COLL_ID\"]}"
  check "Delete Collection" "200"
else
  echo "  SKIP  Update/Delete Collection (create failed)"
fi

echo ""
echo "=== Shipping Options ==="
req GET "/stores/$STORE_ID/shipping"
check "List Shipping Options" "200"

req GET "/stores/$STORE_ID/shipping?limit=5&offset=0&q=test&order=-created_at"
check "List Shipping Options (pagination+search+sort)" "200"

echo ""
echo "=== Price Lists ==="
req GET "/stores/$STORE_ID/price-lists"
check "List Price Lists" "200"

req GET "/stores/$STORE_ID/price-lists?limit=5&offset=0&q=test&order=-created_at"
check "List Price Lists (pagination+search+sort)" "200"

req POST "/stores/$STORE_ID/price-lists" '{"title":"Test Price List API","description":"Test price list","type":"sale","status":"active"}'
check "Create Price List" "201"
PL_ID=$(jq_val "print(d['price_lists'][0]['id'])")

if [ -n "$PL_ID" ]; then
  req PUT "/stores/$STORE_ID/price-lists" "{\"id\":\"$PL_ID\",\"title\":\"Test Price List Updated\"}"
  check "Update Price List" "200"

  req DELETE "/stores/$STORE_ID/price-lists" "{\"ids\":[\"$PL_ID\"]}"
  check "Delete Price List" "200"
else
  echo "  SKIP  Update/Delete Price List (create failed)"
fi

echo ""
echo "=== Orders ==="
req GET "/stores/$STORE_ID/orders"
check "List Orders" "200"

req GET "/stores/$STORE_ID/orders?limit=5&offset=0&q=test&order=-created_at"
check "List Orders (pagination+search+sort)" "200"

echo ""
echo "=== Inventory ==="
req GET "/stores/$STORE_ID/inventory"
check "List Inventory" "200"

req GET "/stores/$STORE_ID/inventory?limit=5&offset=0&q=test&order=-created_at"
check "List Inventory (pagination+search+sort)" "200"

echo ""
echo "=== Customers ==="
req GET "/stores/$STORE_ID/customers"
check "List Customers" "200"

req GET "/stores/$STORE_ID/customers?limit=5&offset=0&q=test&order=-created_at"
check "List Customers (pagination+search+sort)" "200"

echo ""
echo "=== Batch Operations ==="
req POST "/stores/$STORE_ID/categories" '[{"name":"Batch Cat A"},{"name":"Batch Cat B"}]'
check "Batch Create Categories" "201"
BATCH_CAT_IDS=$(jq_val "print(','.join([c['id'] for c in d['categories']]))")

if [ -n "$BATCH_CAT_IDS" ]; then
  IFS=',' read -r BCAT_A BCAT_B <<< "$BATCH_CAT_IDS"

  req PUT "/stores/$STORE_ID/categories" "[{\"id\":\"$BCAT_A\",\"name\":\"Batch Cat A Updated\"},{\"id\":\"$BCAT_B\",\"name\":\"Batch Cat B Updated\"}]"
  check "Batch Update Categories" "200"

  req DELETE "/stores/$STORE_ID/categories" "{\"ids\":[\"$BCAT_A\",\"$BCAT_B\"]}"
  check "Batch Delete Categories" "200"
fi

req POST "/stores/$STORE_ID/promotions" '[{"code":"BATCHTEST1","type":"standard","status":"active","is_automatic":false,"application_method":{"type":"percentage","target_type":"order","value":"5","max_quantity":1,"allocation":"each"}},{"code":"BATCHTEST2","type":"standard","status":"active","is_automatic":false,"application_method":{"type":"percentage","target_type":"order","value":"15","max_quantity":1,"allocation":"each"}}]'
check "Batch Create Promotions" "201"
BATCH_PROMO_IDS=$(jq_val "print(','.join([p['id'] for p in d['promotions']]))")

if [ -n "$BATCH_PROMO_IDS" ]; then
  IFS=',' read -r BPRO_A BPRO_B <<< "$BATCH_PROMO_IDS"

  req PUT "/stores/$STORE_ID/promotions" "[{\"id\":\"$BPRO_A\",\"code\":\"BATCHTEST1UPD\"},{\"id\":\"$BPRO_B\",\"code\":\"BATCHTEST2UPD\"}]"
  check "Batch Update Promotions" "200"

  req DELETE "/stores/$STORE_ID/promotions" "{\"ids\":[\"$BPRO_A\",\"$BPRO_B\"]}"
  check "Batch Delete Promotions" "200"
fi

req POST "/stores/$STORE_ID/collections" '[{"title":"Batch Coll A"},{"title":"Batch Coll B"}]'
check "Batch Create Collections" "201"
BATCH_COLL_IDS=$(jq_val "print(','.join([c['id'] for c in d['collections']]))")

if [ -n "$BATCH_COLL_IDS" ]; then
  IFS=',' read -r BCOL_A BCOL_B <<< "$BATCH_COLL_IDS"

  req PUT "/stores/$STORE_ID/collections" "[{\"id\":\"$BCOL_A\",\"title\":\"Batch Coll A Updated\"},{\"id\":\"$BCOL_B\",\"title\":\"Batch Coll B Updated\"}]"
  check "Batch Update Collections" "200"

  req DELETE "/stores/$STORE_ID/collections" "{\"ids\":[\"$BCOL_A\",\"$BCOL_B\"]}"
  check "Batch Delete Collections" "200"
fi

echo ""
echo "==============================="
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo -e "Failed tests:$FAIL_NAMES"
fi
echo "==============================="
