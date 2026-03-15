# House of Prax Developer Specification

This document consolidates all of the design and engineering decisions for the House of Prax project. It serves as both a **design dossier** and a **developer specification** for building a premium, single‑page marketing website. The dossier is organized into numbered sections for easy reference and shows the locked decisions and implementation details agreed upon so far.

---

## 1\. Brand Identity

* **Brand name:** **House of Prax** (shorthand for UI and favicon: **HOP**).

* **Positioning:** Premium plant‑based protein designed for gym‑focused performance and recovery.

* **Brand personality:** Minimal luxury wellness blended with athletic energy. The feel should be **clean**, **modern**, and **performance‑driven**.

* **Comparables:** Inspired by brands like AG1, Alo Wellness, and Huel but with a stronger gym focus.

---

## 2\. Target Customer

* **Primary audience:** Gym‑focused buyers aged roughly 20–35 who lift regularly and value clean, transparent ingredients.

* **Profile traits:** Drinks protein shakes daily, appreciates premium brand aesthetics, uses fitness apps and meal prep.

* **Lifestyle signals:** Training sessions, fitness apps, meal prep, supplement stacks.

---

## 3\. Product Strategy

* **Product model:** Single hero product (no clutter of multiple SKUs).

* **Flavors:** **Chocolate** and **Vanilla**. These two cover most of the market demand.

* **Price tier:** Premium; expected retail price is roughly **$45–$60**.

* **Conversion model:** Direct purchase from the landing page to checkout (no store browsing).

---

## 4\. Visual Style

* **Design philosophy:** Apple‑style minimalism.

* **Core characteristics:** Large whitespace, big typography, calm and subtle animation, limited color palette.

* **Visual tone:** Premium, clean, calm, and performance‑focused. Avoid clutter and busy backgrounds.

---

## 5\. Color System

* **Primary palette:**

* Deep Forest Green (\#0F3D2E)

* Soft Cream (\#F4F2EA)

* Protein Beige (\#D7C5A3)

* Pure White (\#FFFFFF)

* Dark Graphite (\#1C1C1C)

* **Usage rule:** Green should be an accent color occupying no more than 10% of the interface. Backgrounds alternate between white and cream to maintain a calm rhythm and prevent fatigue.

---

## 6\. Typography

* **Headline font:** **Satoshi** (modern, strong, and minimal).

* **Body font:** **Inter** (clean and highly readable).

* **Rules:** Use large headline scales (around 56–72px) with generous line spacing. Limit paragraphs to a few sentences to maintain clarity and avoid dense text blocks.

---

## 7\. Website Architecture

* **Site type:** Single‑page scroll narrative with 10 major sections.

* **Story flow:**

* **Hero** – Introduce the product with a strong headline, supporting copy, CTA buttons, and a floating jar visual.

* **Problem** – Highlight common issues with most protein powders (junk ingredients, fillers, bad digestion).

* **Solution** – Present House of Prax as the answer, emphasizing plant‑based ingredients and smooth digestion.

* **Benefits** – Display key benefits in a grid (e.g., Clean Energy, Smooth Digestion, High Protein, Natural Flavor).

* **Ingredients** – Reveal and explain core ingredients (Pea Protein, Brown Rice Protein, Cocoa, Natural Flavors).

* **How It Works** – Illustrate the equation: 1 scoop \+ water/milk \+ shake \= clean fuel.

* **Lifestyle** – Use imagery to place the product in contexts like gym workouts, smoothies, and daily routines.

* **Product Selection** – Offer Chocolate and Vanilla jars with hover interactions.

* **Social Proof** – Show metrics (e.g., 4.8★ rating, 10k+ servings) and build trust.

* **Final CTA** – Encourage visitors to upgrade their protein with a bold headline and a prominent purchase button.

---

## 8\. Background Rhythm

Sections should alternate between pure white and soft cream backgrounds. This creates a visual rhythm and prevents monotony. Each section should have generous vertical padding (around **120px**) to convey a premium feel.

---

## 9\. Animation Philosophy

* **Motion feel:** Slow, calm, and smooth – similar to Apple product pages or Stripe landing pages. Avoid fast or bouncy effects.

* **Technologies:** Use Framer Motion, GSAP, CSS transforms, or SVG animations. Avoid heavy WebGL or complex particle systems.

* **Performance:** Animations should not detract from clarity; they should support focus and flow.

---

## 10\. Visual Centerpiece

* **Hero object:** The floating protein jar is the star of the hero section.

* **Motion pattern:** Slow rotation and gentle vertical float. Animation should be barely noticeable, evoking a calm and premium aesthetic.

* **Shadow:** A soft elliptical shadow beneath the jar enhances depth without distracting from the product.

---

## 11\. Product Presentation System

This system defines how the product appears across the site to ensure a consistent, premium look.

### Photography Style

* Neutral, minimalist backgrounds.

* Soft studio lighting with controlled highlights and shadows.

* No clutter around the product.

### Placement and Spacing

* Maintain at least 25% whitespace around the product in containers.

* Ensure the product remains the focal point; avoid busy surrounding elements.

### Floating Animation

* Vertical float: 6–10px movement.

* Rotation: extremely slow (±2°) with a 6–8 second cycle.

* Stop rotation and increase scale slightly on hover.

### Shadow System

* Use high blur and low opacity (10–15%) for shadows, with wide spread to give a sense of floating.

### Powder Effect

* Light protein powder particles may drift near the jar with very low opacity.

* Keep particles slow and limited (no more than 6 visible at once).

### Flavor Differentiation

* Use subtle accent colors for each flavor: cocoa tones for Chocolate and cream tones for Vanilla.

* Jar labels remain consistent; flavors are differentiated via color accents and text.

### Rotation Behavior

* Idle rotation should be almost imperceptible.

* Hover state adds slight tilt and deepens shadow, with a smooth scale increase.

### Image Assets

* Required: hero-product.webp, product-chocolate.webp, product-vanilla.webp, product-shadow.webp, hop-mark.svg.

* Optional: ingredient icons such as ingredient-pea.webp, ingredient-rice.webp, ingredient-cocoa.webp, and powder-particle.png.

* All product images should be at least 2,000px wide, with transparent backgrounds (PNG/WebP) where applicable.

---

## 12\. Conversion Framework

The page is designed to guide visitors through the following psychological steps:

1. **Attention** – Capture interest with a striking hero section.

2. **Problem Awareness** – Highlight why most protein powders are problematic.

3. **Trust** – Emphasize ingredient transparency and clean formulation.

4. **Desire** – Present benefits that appeal to gym users’ performance goals.

5. **Proof** – Show metrics (ratings, servings delivered) or testimonials.

6. **Purchase** – Provide a clear and compelling call to action.

### Hero Copy Examples

* **Primary headline:** “Clean Plant Protein – Built for Real Training”

* **Subtext:** “Plant‑based protein designed for strength, recovery, and everyday performance.”

### Problem Section Copy

* **Headline:** “Most Protein Powders Are Junk”

* **Bullets:** Artificial sweeteners, dairy bloat, cheap fillers, harsh digestion

* **Transition:** “Your body deserves better fuel.”

### Solution Section Copy

* **Headline:** “Meet House of Prax”

* **Subtext:** “A clean plant‑based protein designed for performance, recovery, and smooth digestion.”

* **Trust indicators:** Plant‑Based, Clean Ingredients, Easy Digestion, No Artificial Sweeteners

### Benefits Cards

* Clean Energy: Fuel workouts without heavy digestion.

* Smooth Digestion: Plant protein that’s gentle on the stomach.

* High Protein: Support muscle growth and recovery.

* Naturally Flavored: No artificial aftertaste.

### Ingredient Section Copy

* **Headline:** “Nothing Hidden. Nothing Fake.”

* **Subtext:** “Every ingredient serves a purpose.”

### How It Works

* **Headline:** “Simple Daily Fuel”

* **Equation:** 1 scoop \+ water/milk \+ shake \= clean performance

* **Subtext:** “Takes less than 30 seconds.”

### Lifestyle Section Copy

* **Headline:** “Fuel Your Training”

* **Subtext:** “From early workouts to late nights, clean protein keeps you going.”

### Product Selection

* **Headline:** “Choose Your Flavor”

* **Options:** Chocolate – Rich, smooth, classic; Vanilla – Light, clean, versatile

### Social Proof

* 4.8★ average rating

* 10,000+ servings delivered

* Trusted by athletes

### Final CTA

* **Headline:** “Upgrade Your Protein”

* **Subtext:** “Clean plant‑based protein for real performance.”

* **Button:** “Buy Now”

* **Micro‑trust lines:** Plant‑based ingredients, No artificial sweeteners, Easy digestion

---

## 13\. Homepage Wireframe

The site is composed of modular sections with generous spacing. Each section performs a single purpose.

* **Navbar:** Minimal navigation bar with the HOP logo on the left and links (Shop, Ingredients, Science, Cart) on the right. Transparent over the hero; turns solid on scroll.

* **Hero Section:** Full‑screen height. Contains headline, subtext, primary and secondary CTAs, and the floating jar visual.

* **Problem Section:** Cream background. Contains headline, problem bullets, and transition statement.

* **Solution Section:** White background. Introduces House of Prax with a centered product image and trust indicators.

* **Benefits Grid:** A three‑column grid on desktop (single column on mobile) with icons, headings, and descriptions.

* **Ingredient Section:** Cream background. Ingredient cards with hover reveals.

* **How It Works:** A visual equation illustrating the scoop, liquid, shake, and result.

* **Lifestyle Section:** Full‑width image gallery showing real‑life contexts (gym, smoothie prep, desk work, post‑workout).

* **Product Selection:** Two jars representing Chocolate and Vanilla. Hover effect highlights each jar. User can select a flavor.

* **Social Proof:** Metrics and optional testimonials.

* **Final CTA:** Bold call to action encouraging immediate purchase.

* **Footer:** Simple footer with links and the HOP logo.

Spacing guidelines: \~120px vertical padding between sections (160px in the hero) to maintain a luxurious feel.

---

## 14\. Product Selection

* Display Chocolate and Vanilla jars side by side.

* Hover effect: jar slightly lifts or glows to indicate interactivity.

* Click effect: selected flavor receives an active state indicator (e.g., border, checkmark) and updates the product copy and pricing if needed.

---

## 15\. Social Proof

Use simple metrics to instill trust, such as:

* **4.8★ Rating:** Showcase the average rating from customers.

* **10,000+ Servings Delivered:** Demonstrate popularity and usage scale.

* **Trusted by Athletes:** Include icons or short text to reinforce credibility.

---

## 16\. Final CTA

Conclude the page with a bold call to action. Use concise and compelling copy and include micro‑trust lines to reassure visitors.

Example:

**Upgrade Your Protein**

Clean plant‑based protein for real performance.

\[Buy Now\]

• Plant‑based ingredients • No artificial sweeteners • Easy digestion

---

## 17\. Performance Rules

* **Images:** Optimize all images to be under 200 KB where possible; use WebP format for compression. Use PNG only when transparency is required. Lazy‑load below‑the‑fold images.

* **Animations:** Use transform and opacity properties to prevent layout thrashing. Reuse motion presets; avoid new animations unless justified.

* **Code splitting:** Use Next.js dynamic import for heavy components to improve initial load times.

* **Avoid bloat:** Don’t import heavy libraries when native CSS or small utilities suffice.

---

## 18\. UI Component Blueprint

Define components clearly to support reusable and consistent UI development.

**Component List:**

1. Navbar – A sticky bar with logo and navigation links. Transparent on the hero; solid on scroll.

2. SectionContainer – A wrapper that applies max width, horizontal padding, and vertical spacing.

3. HeroSection – Contains headline, subtext, buttons, and floating jar visual.

4. ProblemSection – Contains problem headline, bullet list, and transitional text.

5. SolutionSection – Introduces product solution and features trust indicators.

6. BenefitsGrid – A grid of benefit cards with icons, headings, and descriptions.

7. IngredientSection – Displays ingredients in a grid; cards reveal details on hover.

8. HowItWorks – Illustrates the process of consuming the product with an equation graphic.

9. LifestyleGallery – A full‑width gallery of lifestyle images with optional parallax.

10. ProductSelector – Allows the user to choose between Chocolate and Vanilla. Handles state and visuals for selected flavor.

11. SocialProof – Shows ratings, servings delivered, and other trust metrics.

12. CTASection – Final call to action with headline, subtext, button, and micro‑trust lines.

13. Footer – Contains basic links and brand logo.

Each component should be built as a self‑contained React component using Tailwind classes for styling and Framer Motion for animations where necessary. Data used by components should be imported from a central data.ts file.

---

## 19\. Animation Blueprint

A unified animation system ensures consistency and premium feel.

### Motion Philosophy

* **Tone:** Slow, calm, and smooth. Avoid flashy transitions and bouncy springs.

* **Standard durations:** 0.2–0.3 s for micro interactions, 0.5–0.8 s for component animations, 0.8–1.2 s for section transitions.

* **Easing:** Use ease‑out or ease‑in‑out; avoid linear or bounce.

### Scroll Reveal

* Elements fade in and move upwards on scroll.

* Animations triggered when the element enters 20% of the viewport.

* Example parameters: opacity 0→1, translateY 40px→0 over 0.6 s.

### Hero Product Animation

* Slow vertical float (6–10 px) and idle rotation (±2°) with a 6–8 s cycle.

* Stops on hover while slightly enlarging and tilting the jar.

### Card Hover Motion

* Cards lift by \~6 px with increased shadow on hover.

* Animate over 0.3 s to give a tactile feel.

### Parallax

* Subtle parallax on hero background and lifestyle images. Scroll speed at 80–90% of page scroll.

### Section Transitions

* Headline appears first; subsequent elements stagger in with 0.1–0.2 s delays.

* Minimum vertical padding per section: 120 px.

### CTA Button Interactions

* Buttons darken and lift by 2 px on hover over 0.2 s. Maintain visible focus states for accessibility.

### Flavor Selection Interaction

* Crossfade between product images when switching flavors (0.5 s crossfade).

### Scroll Progress Awareness

* Optionally highlight navigation links as the user scrolls through the page to enhance orientation.

### Mobile Motion Rules

* Reduce animation complexity: remove powder particles and heavy parallax on mobile.

* Slightly shorten durations to accommodate performance on lower‑powered devices.

---

## 20\. Implementation Blueprint

This section translates the design system into concrete development instructions.

### Recommended Stack

* **Framework:** Next.js

* **Styling:** Tailwind CSS

* **Animation:** Framer Motion

* **Utility:** clsx (optional for conditionally applying classes)

* **Image handling:** next/image

### Project Architecture

A suggested folder structure:

/src  
  /app  
    layout.tsx  
    page.tsx  
    globals.css

  /components  
    Navbar.tsx  
    HeroSection.tsx  
    ProblemSection.tsx  
    SolutionSection.tsx  
    BenefitsGrid.tsx  
    IngredientSection.tsx  
    HowItWorks.tsx  
    LifestyleGallery.tsx  
    ProductSelector.tsx  
    SocialProof.tsx  
    CTASection.tsx  
    Footer.tsx

  /components/ui  
    Button.tsx  
    SectionContainer.tsx  
    SectionHeading.tsx  
    BenefitCard.tsx  
    IngredientCard.tsx  
    StatCard.tsx

  /lib  
    constants.ts  
    motion.ts  
    data.ts

  /public  
    /images  
      hero-product.webp  
      product-chocolate.webp  
      product-vanilla.webp  
      product-shadow.webp  
      lifestyle-1.webp  
      lifestyle-2.webp  
      lifestyle-3.webp  
      ingredient-pea.webp  
      ingredient-rice.webp  
      ingredient-cocoa.webp  
      hop-mark.svg

### Page Assembly

The homepage should be constructed in the following order:

\<Navbar /\>  
\<HeroSection /\>  
\<ProblemSection /\>  
\<SolutionSection /\>  
\<BenefitsGrid /\>  
\<IngredientSection /\>  
\<HowItWorks /\>  
\<LifestyleGallery /\>  
\<ProductSelector /\>  
\<SocialProof /\>  
\<CTASection /\>  
\<Footer /\>

### Data Strategy

Store content in /lib/data.ts to avoid hardcoding copy in components. This file can include text for headlines, descriptions, benefits, ingredients, product flavors, and trust metrics. It simplifies updates and makes it easier to integrate with AI or CMS systems later.

### Constants and Motion Configuration

* /lib/constants.ts should define global values for section spacing, max widths, color tokens, and brand names.

* /lib/motion.ts should store motion presets like fadeUp, staggerContainer, slowFloat, hoverLift, and crossFade. This ensures consistent animations throughout the site.

### Global Styling

In globals.css:

* Define base typography and color variables.

* Set body background to white and text color to dark graphite.

* Apply smooth scrolling and text rendering enhancements.

* Include utility classes for consistent spacing and rhythm.

Extend Tailwind’s default theme with custom tokens:

// tailwind.config.js  
module.exports \= {  
  theme: {  
    extend: {  
      colors: {  
        forest: '\#0F3D2E',  
        cream: '\#F4F2EA',  
        beige: '\#D7C5A3',  
        graphite: '\#1C1C1C',  
      },  
      spacing: {  
        section: '120px',  
        hero: '160px',  
      },  
      borderRadius: {  
        xl: '1rem',  
        '2xl': '1.5rem',  
      },  
      boxShadow: {  
        soft: '0 4px 10px rgba(0, 0, 0, 0.05)',  
        float: '0 20px 30px rgba(0, 0, 0, 0.08)',  
        card: '0 10px 15px rgba(0, 0, 0, 0.05)',  
      },  
    },  
  },  
};

### Core UI Rules for Developers

1. Each component has a single responsibility.

2. Maintain consistent section heights and widths.

3. Use transform and opacity for animations (avoid expensive layout animations).

4. Limit usage of green to accents only; keep backgrounds neutral.

5. Alternate white and cream backgrounds consistently.

6. Implement mobile-first responsive design.

7. Build with accessibility in mind: semantic headings, alt text, focus states, sufficient contrast.

### Image Asset Rules

* Use WebP wherever possible; use PNG only for transparent icons/logos.

* Ensure file sizes stay under 200 KB and dimensions are appropriate for retina displays.

* Lazy‑load images below the fold.

### Product Image Requirements

* Include hero and flavor images plus variant assets.

* Provide a separate shadow asset if needed.

* If actual product photography is missing, use a cleaned and enhanced version of the current jar image (remove noise, add soft shadows, adjust lighting).

### Responsive Breakpoints

* Design mobile first; use breakpoints for tablet and desktop.

* On mobile: stack layouts, reduce copy length, and simplify galleries.

* On tablet: use two‑column grids where suitable.

* On desktop: full white‑space and side‑by‑side content.

### Navbar Behavior

* Transparent background over hero.

* Solid background (white or cream) after the hero section scrolls out of view.

* Sticky to the top of the viewport.

* Smooth scroll to each section on click.

* Collapse into a hamburger menu on mobile.

### Product Selector Logic

* Manage selected flavor state (e.g., using useState in React).

* Crossfade images on flavor change.

* Ensure selection indicator and copy update accordingly.

### Accessibility Requirements

* Use semantic HTML elements (e.g., \<nav\>, \<main\>, \<footer\>).

* Provide aria labels for buttons and interactive elements.

* Include alt text for all images.

* Ensure all interactive elements have focus states.

* Respect reduced motion preferences; disable non‑essential animations if user prefers reduced motion.

### Performance Requirements

* Prioritize fast loading: compress and preload above‑the‑fold assets.

* Use code splitting to reduce bundle size.

* Lazy‑load images and heavy components.

* Avoid heavy third‑party libraries unless necessary.

* Reuse motion and styling tokens.

### Build Sequence

**Phase 1 – Foundation:** \- Initialize a new Next.js project with TypeScript support. \- Install Tailwind CSS and Framer Motion. \- Configure global fonts and custom theme in Tailwind.

**Phase 2 – Core Layout:** \- Create layout.tsx with global providers and CSS imports. \- Build Navbar and SectionContainer components. \- Define a button component in /components/ui/Button.tsx.

**Phase 3 – Page Sections:** \- Implement each section component (Hero, Problem, Solution, Benefits, Ingredients, How It Works, Lifestyle, Product Selector, Social Proof, CTA, Footer) using data from /lib/data.ts.

**Phase 4 – Motion Layer:** \- Integrate scroll reveals, hero float, card hover effects, and crossfades using Framer Motion and motion presets from /lib/motion.ts.

**Phase 5 – Polish:** \- Ensure responsiveness across breakpoints. \- Optimize images (compress, export to WebP). \- Add alt text, focus states, and other accessibility features. \- Test page speed and optimize as needed.

### AI Build Prompt Compatibility

The dossier is structured so that AI tools (like Cursor or VS Code coding assistants) can read and generate code. Developers or AI assistants can issue a prompt such as:

*“Build a premium, single‑page Next.js landing page for the House of Prax using the design and implementation guidelines outlined in the project dossier.”*

The site should then be generated according to the specifications documented here.

### Final Engineering Principle

All decisions should prioritize:

clarity  
→ performance  
→ consistency  
→ polish

rather than chasing flashy visuals or unnecessary complexity. Keeping clarity and performance first ensures the resulting website looks premium and functions smoothly.

---

## Conclusion

This specification consolidates every locked decision and guideline required to build the House of Prax website. It covers brand identity, target audience, product strategy, visual and animation systems, conversion copy, wireframes, reusable components, animation details, and a development blueprint. This comprehensive dossier allows any developer or AI code assistant to build a premium single‑page site that matches the strategic and aesthetic vision of the House of Prax brand.

---

