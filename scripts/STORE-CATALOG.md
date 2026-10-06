# Overdose dress catalog

From `Backend`, run `npm run seed:store-catalog` to add 16 demo dresses across
Everyday Dresses, Evening Edit, Summer Florals, and Premium Occasionwear.
The script uses the configured database and only the `store` tenant. Existing
products are preserved, and rerunning it does not duplicate products. Photos are
downloaded into `uploads/store-demo` and served by the backend.

Manage products at `http://localhost:3001/admin/products?store=store`:

- **Premium:** add the exact `Premium` tag.
- **Collections:** assign the product to a category. All active categories appear
  as collection filters; pagination makes every active product accessible.
- **Sales:** set a compare-at price higher than the selling price.
- **New Arrival:** enable `New arrival`. Products are ordered newest first.
- **Homepage:** products with sales or `Best seller` enabled appear after the hero,
  ordered by units sold. The seed supplies manual highlights, not fake orders,
  sales totals, or reviews.

Dashboard saves clear the catalog cache. After running the seed directly, allow
up to 60 seconds for an already-running backend's cached listings to expire,
or restart the backend. Refresh the Store page to see newly saved changes.
