# Initial stock input and 2-column product grid

The add-product form now accepts an initial stock quantity when creating products, and the products index displays items in a 2-column grid with card-style layouts showing image, name, and price. The ProductCard was redesigned to prioritize visual presentation over metadata density — category and stock count were removed from the card face in favor of a prominent image and cleaner typography.

**Watch for:** Missing variants UI (confirmed) — the original request asked for a variants section with add/remove functionality, but the implementation does not include it. Category display removed from ProductCard (confirmed) — this may confuse users who filter by category and then can't see which category each product belongs to when scanning the grid.

**Verdict**: CHANGES_REQUESTED

## High-level view

The add-product form schema, validation, and mutation call all correctly handle the `initialStock` field. The form collects the value, validates it as a positive integer, and passes it as `initialQuantity` to the repository.

The productRepository.create method accepts `initialQuantity` as an optional parameter and uses it to set `current_quantity` in the database, defaulting to 0 when not provided.

The useCreateProduct hook's mutationFn type signature includes `initialQuantity`, so TypeScript enforces the contract between the form and the repository.

The products index renders a 2-column FlatList with `numColumns={2}`, `gridContent` contentContainerStyle, and `columnWrapper` columnWrapperStyle. The grid layout is properly configured.

The ProductCard now uses expo-image's Image component with a 1:1 aspect ratio container, displays name and price prominently, and shows stock badges only when there's a concern (low or out of stock). The category prop is passed to the card but not rendered anywhere.

<details>
<summary>Issues (3)</summary>

1. **Variants UI missing** — The original user request explicitly asked for "variants" in the add-product form, but no variants section or add/remove UI exists in the implementation. Add a variants array field to the schema with controls to add/remove variant rows (size, color, etc.) if the requirement is still active, or confirm with the user that variants are deferred.

2. **Category removed from ProductCard but still passed as prop** — The ProductCard receives a `category` prop but doesn't display it. Users who filter by category in the products index will see a filtered list but won't know which category each product belongs to when scanning the grid. Either remove the unused prop or restore a subtle category indicator (badge or small label) to the card.

3. **Stock count removed from ProductCard** — The redesign removed the "Stock: X pcs" line that previously appeared alongside the price. Users must now tap into a product to see its stock level unless it's low or out of stock. Consider whether this trade-off (cleaner card vs. hidden stock info) aligns with the workflow — if stock visibility is important during product selection, restore it as a small secondary text line.

</details>

<details>
<summary>Details</summary>

## Initial stock field wired end-to-end

The add-product form collects `initialStock` as a required string field in the Zod schema, with a default value of '0'. The form parses it as an integer, validates that it's non-negative, and passes it as `initialQuantity` to the `createProduct.mutateAsync` call. The productRepository.create method accepts `initialQuantity` as an optional parameter and writes it to the `current_quantity` column, falling back to 0 if not provided. The useCreateProduct hook's mutationFn type signature includes `initialQuantity?: number`, so the type contract is enforced across the stack.

## ProductCard redesigned for grid layout

The card now has a `flex: 1` style so it fills its column proportionally, and the image container uses `aspectRatio: 1` to enforce a square aspect ratio regardless of device width. The Image component from expo-image uses `contentFit="cover"` to fill the square without distortion.

The name text uses `numberOfLines={2}` and `ellipsizeMode="tail"` with a `minHeight` calculated as `fontSize * 2 * 1.5` to reserve space for two lines even when the name is short, preventing inconsistent card heights.

The category prop is received but not rendered — the category chip or label that might have been in the prior design is gone.

## 2-column grid layout configured

The products index FlatList has `numColumns={2}`, `contentContainerStyle={styles.gridContent}` for padding around the list, and `columnWrapperStyle={styles.columnWrapper}` with `gap: SPACING.sm` between columns.

## Variants UI not implemented

The diff shows no code related to variants — no schema field for an array of variants, no UI for adding or removing variant rows, no state management for variant entries. The original user message asked for "variants" in the product form, but the implementation skipped this entirely. This is either a deliberate deferral or an oversight.

## Category removed from card face but still passed

The ProductCard component receives a `category?: Category | null` prop from the products index, which looks it up with `categories.find((cat) => cat.id === item.categoryId)`. But the card renders only the image, name, price, and badges. The category is never displayed. This creates a disconnect: the products index does the work to fetch and pass the category, but the card ignores it. Users who filter by category will see a filtered list but won't see the category name on each card, which might be confusing when scrolling a mixed list later.

## Stock count hidden unless critical

The prior ProductCard design showed "Stock: X pcs" on every card. The new design only shows badges when stock is low or out. For products with healthy stock levels, the user must tap into the detail view to see the count. This is a trade-off for a cleaner card but reduces at-a-glance stock visibility.

</details>

<details>
<summary>File map</summary>

- **src/app/(tabs)/products/add.tsx** — added `initialStock` to schema, form default values, validation, and mutateAsync call as `initialQuantity`
- **src/app/(tabs)/products/index.tsx** — new file; 2-column FlatList with gridContent and columnWrapper styles, renders ProductCard for each item
- **src/components/products/ProductCard.tsx** — replaced horizontal layout with vertical image-on-top card, removed category and stock text, added 1:1 aspect image container with expo-image, kept badges
- **src/hooks/useProducts.ts** — added `initialQuantity?: number` to useCreateProduct mutationFn type signature
- **src/services/repositories/productRepository.ts** — new file; create method accepts `initialQuantity` and uses it for `current_quantity`, defaults to 0
- **.agents/tasks/tsc-output.txt** — TypeScript compilation passed with no errors

Full diff: `git diff bf1277b..HEAD`

</details>
