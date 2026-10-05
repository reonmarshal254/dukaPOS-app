# Implementation Plan

## Project Context

This is an Expo SDK 57 / React Native mobile POS application. The project uses:
- **Framework**: Expo Router for navigation (file-based routing in `src/app/`)
- **State Management**: TanStack Query (React Query) for server state, Zustand for client state
- **Database**: expo-sqlite with custom repository pattern
- **Forms**: react-hook-form with zod validation
- **Styling**: StyleSheet with centralized design tokens (COLORS, SPACING, TYPOGRAPHY)
- **Build Commands**: 
  - Type check: `npx tsc --noEmit`
  - Lint: `npx expo lint`
  - Dev server: `npx expo start`

**Verification Pattern**: After each change, run `npx tsc --noEmit` to verify type safety, then test the affected screen in the Expo dev server.

---

## Task Summary

The user reported three issues with the products feature:
1. When adding a product, there's no input field for initial stock quantity (currently hardcoded to 0)
2. Variants feature is mentioned but not implemented in the add form
3. The products listing page needs a 2-column grid layout with redesigned product cards

---

- [ ] 1. **Add missing grid styles to products index page**
      
      The FlatList in `src/app/(tabs)/products/index.tsx` already references `styles.gridContent` and `styles.columnWrapper` (line ~150) but these styles are not defined in the StyleSheet, causing a runtime error.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\app\(tabs)\products\index.tsx`
      
      **Changes**:
      - Add `gridContent` style to StyleSheet: `{ padding: SPACING.lg }`
      - Add `columnWrapper` style to StyleSheet: `{ gap: SPACING.md, paddingHorizontal: SPACING.lg }`
      - Remove the unused `listContent` style definition (it's defined but never used)
      
      **Verify**: 
      1. Run `npx tsc --noEmit` — should pass with no errors
      2. Start dev server with `npx expo start` and navigate to Products tab
      3. Confirm products display in a 2-column grid with proper spacing

---

- [ ] 2. **Redesign ProductCard component for 2-column grid layout**
      
      Current ProductCard is designed for a single-column list. Redesign it for a 2-column grid with a compact card format: square image at top (1:1 aspect ratio), product name below (max 2 lines with ellipsis), selling price prominently displayed, and compact Low Stock / Out of Stock badges. Remove category display to save space.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\components\products\ProductCard.tsx`
      
      **Changes**:
      - Import `Image` from `expo-image` (not react-native) and add to package if not present: `npx expo install expo-image`
      - Restructure layout: vertical stack instead of horizontal
      - Add image section at top:
        - Square aspect ratio container (width: 100%, aspectRatio: 1)
        - Use `<Image>` component with `source={{ uri: product.localImagePath || product.imageUrl }}` 
        - Set `contentFit="cover"` and `transition={200}`
        - Fallback: if no image, show placeholder view with 📦 emoji (fontSize: 48)
        - Border radius: `BORDER_RADIUS.lg` on top corners only
      - Product name: 2 lines max with `numberOfLines={2}`, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: semibold
      - Price: fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: bold, color: COLORS.primary
      - Remove category display entirely
      - Remove stock quantity display (save space)
      - Badges: position at bottom, smaller size (fontSize: TYPOGRAPHY.fontSize.xs), compact padding
      - Remove outer marginBottom from card (grid wrapper handles spacing)
      - Update card styling for grid: remove explicit height, let content determine it
      
      **Verify**:
      1. Run `npx tsc --noEmit` — should pass
      2. In dev server, navigate to Products tab
      3. Confirm cards show images in 1:1 square at top, name below (truncates at 2 lines), price is prominent, badges are compact at bottom

---

- [ ] 3. **Add initialQuantity parameter to productRepository.create()**
      
      The repository currently hardcodes `current_quantity` to 0. Add an optional parameter to accept initial stock quantity.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\services\repositories\productRepository.ts`
      
      **Changes**:
      - Add `initialQuantity?: number` to the `create()` method's data parameter interface (line ~72)
      - Update the INSERT statement: change hardcoded `0` to `data.initialQuantity ?? 0` (line ~96)
      - Update the returned Product object: change `currentQuantity: 0` to `currentQuantity: data.initialQuantity ?? 0` (line ~112)
      
      **Verify**: 
      1. Run `npx tsc --noEmit` — should pass with no type errors
      2. Test: create a product with initialQuantity via the repository directly in a test context (or wait for form integration in next step)

---

- [ ] 4. **Update useCreateProduct mutation type to accept initialQuantity**
      
      The hook's mutation function type must match the repository's updated signature.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\hooks\useProducts.ts`
      
      **Changes**:
      - Add `initialQuantity?: number` to the mutationFn data parameter interface (line ~36)
      - The parameter is passed through to `productRepository.create(data)` — no other changes needed since it spreads the data object
      
      **Verify**: 
      1. Run `npx tsc --noEmit` — should pass
      2. Verify the type signature accepts the new field

---

- [ ] 5. **Add Initial Stock field to add-product form**
      
      Add an input field to let users specify the starting quantity when creating a product.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\app\(tabs)\products\add.tsx`
      
      **Changes**:
      - Add `initialStock: z.string().min(1, 'Initial stock is required')` to `productSchema` (line ~24) with default value '0'
      - Update defaultValues in useForm: add `initialStock: '0'` (line ~44)
      - Add a Controller field after the `minStockThreshold` field (after line ~269):
        - label: "Initial Stock Quantity"
        - placeholder: "0"
        - keyboardType: "number-pad"
        - error: `errors.initialStock?.message`
        - required: true
        - helperText: "Starting quantity in stock"
      - In `saveProduct()` function (line ~121):
        - Parse initialStock: `const initialStock = parseInt(data.initialStock);`
        - Validate: if `isNaN(initialStock) || initialStock < 0`, show alert and return
        - Pass to mutation: add `initialQuantity: initialStock` to the `createProduct.mutateAsync()` call
      
      **Verify**:
      1. Run `npx tsc --noEmit` — should pass
      2. Start dev server, navigate to Add Product screen
      3. Fill form with initialStock = 50, submit
      4. Navigate back to Products list, tap the new product, confirm currentQuantity is 50

---

- [ ] 6. **Add Variants section UI to add-product form (non-functional)**
      
      Add a "Variants" section with add/remove UI and explanatory text. This step adds the UI structure only — variants are not saved to the database or functional yet. The UI serves as a placeholder for future implementation.
      
      **Files**: `c:\Users\oyooo\POS\mobile\src\app\(tabs)\products\add.tsx`
      
      **Changes**:
      - Add state: `const [variants, setVariants] = useState<{name: string; price: string}[]>([]);` (after line ~29)
      - Add variants section UI after the initialStock field (after the new Controller from step 5):
        - Section label: "Product Variants (Optional)" with helper text in gray: "E.g., sizes, colors, or flavors. Note: Variants are not fully functional yet."
        - For each variant in the array, render:
          - Row with two Input fields side-by-side (name and price)
          - Remove button (red X or trash icon)
        - "Add Variant" button at bottom of section (outline style, not primary)
        - Button onPress: `setVariants([...variants, { name: '', price: '' }])`
        - Remove onPress: filter out the variant at that index
      - **Important**: Do NOT include variants in the save logic — they are UI-only for now
      
      **Verify**:
      1. Run `npx tsc --noEmit` — should pass
      2. In dev server, navigate to Add Product screen
      3. Confirm "Add Variant" button appears, can add/remove variant rows
      4. Confirm variants are NOT saved when creating product (check database or product detail screen)
      5. Add helper text clearly states variants are not functional yet

---

## Notes

- **Expo Image**: The project uses expo SDK 57. According to package.json, expo-image is already installed at version 57.0.5, so import directly from 'expo-image'.
- **Category prop**: ProductCard currently receives an optional category prop. After removing category display, the prop can remain (backward compatible) but won't be rendered.
- **Grid spacing**: The columnWrapper style handles horizontal spacing between columns. Each ProductCard should not have horizontal margins to avoid double spacing.
- **Variants**: This is a placeholder feature. Full implementation would require database schema changes (variants table), inventory tracking per variant, and POS integration. The UI in step 6 is a visual mockup only.
- **Testing**: After all changes, run the full test suite if available: check package.json scripts for test commands. At minimum, verify type safety with `npx tsc --noEmit` and manual testing in Expo dev server.
