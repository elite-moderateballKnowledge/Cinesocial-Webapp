# CineSocial Design System
*Source: Stitch MCP*

## 1. Overview & Creative North Star
This design system is built upon the "Raw Logic" of Neo-Brutalism, transformed through the lens of high-end editorial design. The Creative North Star is **"The Digital Zine"**—an aesthetic that rejects the soft, rounded, and gradient-heavy "friendly" web in favor of something sharp, loud, and unapologetically intentional.

The system breaks the "standard template" look by utilizing **intentional asymmetry** and **brutal visual hierarchy**. We do not hide our structure; we celebrate it. By combining the technical precision of a Figma canvas with the raw energy of a physical zine, we create an experience that feels engineered rather than merely "styled." 

The goal is to provide a UI that feels like a curated exhibition—where every border, shadow, and dot matrix pattern is a deliberate architectural choice.

---

## 2. Colors & Surface Architecture
While the palette is limited, its application must be surgical. We use high-contrast pairings to define function and focus.

### Color Palette
- **Primary (`#FFE500` / `#FFD300` per project rules):** High-energy yellow. Used for the most critical actions and focus states. (Note: Project rule overrides primary to `#FFD300`).
- **Secondary (`#FF3D00`):** Orange-Red. Used for high-alert signals, destructive actions, or "accent" breaks in a monochromatic flow.
- **Neutral/Surface (`#F5F5F0`):** A sophisticated off-white that prevents the screen from feeling clinical. 
- **Text/Borders (`#0A0A0A` / `#000000`):** Near-black. The "ink" that defines the skeleton of the system.

### Surface Hierarchy: The Stacking Rule
In this system, depth is not simulated with light; it is simulated with **Physical Offsets**. 
- **Base Layer:** `surface` (#F5F5F0).
- **Secondary Containers:** `surface_container` (#EEEEE9). Use this for sidebars or nested content areas to create a subtle shift in tone without breaking the brutalist aesthetic.
- **The "Heavy Line" Law:** Prohibit 1px borders. All structural boundaries must use a **4px solid black border** (`#000000`) per project rules.

### Textural Accents
To prevent large layouts from feeling empty, use the `outline_variant` token to render **Dot Matrix** or **Grid Patterns**. These should be used in the background of hero sections or within empty states to provide a "blueprint" aesthetic.

---

## 3. Typography
Typography is the primary driver of the brand's voice. We use a high-contrast scale to ensure a clear distinction between "Instructional" and "Editorial" content.

- **Display & Headings:** Serif (Georgia or Playfair Display Black) per project rules.
    - **Letter Spacing:** -2% to -4% for `display-lg`. This creates a tight, "printed" feel.
    - **Style:** All-caps should be reserved for `label-md` or `headline-sm` to create a technical, utility-first look.
- **Body & Titles:** Monospace for all UI labels and buttons per project rules.
    - **Letter Spacing:** 0% for readability.
    - **Usage:** Use `body-md` for standard prose and `title-md` for interactive labels.

---

## 4. Elevation & Depth: The Offset Principle
Traditional shadows are forbidden. We achieve elevation through **Raw Offset Shadows**.

- **The Standard Lift:** Any "elevated" component (Cards, Buttons, Modals) must use an `8px 8px 0px 0px #000000` shadow per project rules. No blur, no transparency.
- **Interaction (The "Click" State):** To provide tactile feedback, the shadow must disappear on `:active` or hover states, and the element should physically shift `4px down and 4px right` to meet the shadow, mimicking a physical button being pressed into a surface.
- **The Layering Principle:** When stacking elements, use the `surface_container` tiers. A `surface_container_highest` card sitting on a `surface` background creates a "tonal lift" that complements the heavy borders.

---

## 5. Components

### Buttons
- **Primary:** `primary` (#FFD300) background, 4px black border, 8px 8px 0px 0px black offset shadow. Text in Monospace. Zero border radius (except navbar pill button).
- **Secondary:** `surface` (#F5F5F0) background, 4px black border, 8px black offset shadow.
- **State Change:** On hover, shadow disappears, element shifts 4px down-right.

### Form Elements
- **Inputs:** `surface_container_lowest` (#FFFFFF) background with a 4px black border. 0px border-radius.
- **Focus State:** When an input is active, it receives a 4px "ghost" offset in `primary` (#FFD300) or a heavy yellow outer stroke.
- **Checkboxes/Radios:** Pure geometric shapes. Checkboxes are squares; Radio buttons are nested squares (no circles).

### Cards & Layout Blocks
- **No Dividers:** Forbid the use of 1px horizontal lines to separate content within a card. Instead, use a background color shift (e.g., a `primary` header block sitting directly on a `surface` card body, separated by a 4px border).
- **Asymmetrical Padding:** To achieve an editorial look, use a spacing scale that favors larger horizontal padding than vertical padding (e.g., `px-8 py-4`).

### Decorative Grid Accents
- Use a 20px x 20px dot matrix or a 40px grid overlay on the `surface_dim` background to fill dead space in the layout, reinforcing the "Figma-meets-zine" tone.

---

## 6. Do's and Don'ts

### Do:
- **Do** embrace the "0px border-radius" (except navbar pill). Every corner in the application must be a sharp 90-degree angle.
- **Do** ensure the "CINE" logo is always visible — use black text or black text-stroke on yellow backgrounds.
- **Do** keep spacing generous but "rigid." Use a base-8 grid (8px, 16px, 24px, 32px) for all margins and padding.

### Don't:
- **Don't** use gradients or blur. The design system relies on flat, hard-edged confidence.
- **Don't** use standard "drop shadows." If it's not a solid 0-blur offset, it doesn't belong here.
- **Don't** use generic UI sans-serif fonts for headings. Use Serif for headings and Monospace for UI labels.
- **Don't** place yellow text on a yellow background.
