# Teammato Design Guidelines

## Design Approach: Design System Foundation

**Selected System**: Linear-inspired minimalist productivity aesthetic with Material Design data components
**Rationale**: Enterprise SaaS tool requiring professional credibility, data density, and privacy-first visual language. Linear's clean typography and subtle interactions paired with Material's robust form/table patterns.

**Core Principles**:
- **Trust through clarity**: No visual tricks—transparent, straightforward UI builds confidence
- **Privacy-first aesthetic**: Muted palette reinforces discretion and anonymity
- **Information hierarchy**: Dense data presented clearly without overwhelming
- **Enterprise polish**: Professional, consistent, and accessible across all touchpoints

---

## Color Palette

### Dark Mode (Primary)
- **Background**: 220 15% 8% (deep slate)
- **Surface**: 220 14% 11% (elevated panels)
- **Surface Elevated**: 220 13% 14% (cards, modals)
- **Primary Brand**: 265 85% 58% (confident purple—trust/privacy connotation)
- **Primary Hover**: 265 85% 65%
- **Success**: 142 71% 45% (feedback submitted, approved)
- **Warning**: 38 92% 50% (flagged content)
- **Danger**: 0 84% 60% (removed content, destructive actions)
- **Text Primary**: 220 9% 92%
- **Text Secondary**: 220 9% 65%
- **Text Tertiary**: 220 9% 46%
- **Border**: 220 13% 18%

### Light Mode (Secondary)
- **Background**: 0 0% 100%
- **Surface**: 220 14% 98%
- **Primary Brand**: 265 100% 45%
- **Text Primary**: 220 15% 15%
- **Border**: 220 13% 91%

---

## Typography

**Font Stack**: 
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts CDN)
- Monospace: 'JetBrains Mono', monospace (for pseudonyms, IDs, code)

**Scale**:
- **Hero (Landing)**: text-6xl (60px), font-bold, tracking-tight
- **H1**: text-4xl (36px), font-semibold
- **H2**: text-2xl (24px), font-semibold
- **H3**: text-xl (20px), font-medium
- **Body**: text-base (16px), font-normal, leading-relaxed
- **Small**: text-sm (14px), text-secondary
- **Caption**: text-xs (12px), text-tertiary, uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units **2, 4, 8, 12, 16** for padding/margins
- **Tight spacing**: p-2, gap-2 (compact lists, inline elements)
- **Standard spacing**: p-4, gap-4 (cards, form fields)
- **Section spacing**: p-8, py-12 (page sections, modals)
- **Page margins**: p-16, max-w-7xl mx-auto (top-level containers)

**Grid System**:
- **Admin layouts**: 2-column sidebar (240px fixed) + main content (flex-1)
- **Card grids**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- **Form layouts**: Single column max-w-2xl for focused input

---

## Component Library

### Navigation
- **Top Bar**: Fixed height (64px), glass effect (bg-surface/80 backdrop-blur), shadow-sm, logo left, actions right
- **Sidebar**: Fixed 240px width, overflow-y-auto, nav items with icon + label, active state (bg-primary/10, border-l-2 border-primary)
- **Breadcrumbs**: text-sm, text-secondary, separated by / or chevrons

### Data Display
- **Thread Cards**: Border-l-4 (color by status: primary=visible, warning=flagged, danger=removed), p-4, hover:bg-surface-elevated transition
- **Moderation Queue**: Table with alternating row backgrounds, sticky header, fixed action column
- **Analytics Charts**: Card containers (p-6, rounded-lg, border), Chart.js or Recharts with brand colors
- **Suppressed Content Placeholder**: Dashed border, text-center, icon + "Visible when k≥5 participants" message

### Forms & Inputs
- **Text Fields**: Dark bg-surface-elevated, border-border, focus:border-primary, focus:ring-1 ring-primary/20, rounded-md, p-3
- **Textareas**: Same as text fields, min-h-32 for feedback body
- **Select Dropdowns**: Custom styled with chevron icon, max-h-64 overflow-auto for options
- **Buttons**: 
  - Primary: bg-primary hover:bg-primary-hover, text-white, px-6 py-2.5, rounded-md, font-medium
  - Secondary: border border-border hover:bg-surface-elevated
  - Danger: bg-danger hover:bg-danger/90
  - Over images: backdrop-blur-md bg-white/10 border border-white/20 (no custom hover states)

### Status Indicators
- **Badges**: Pill-shaped (rounded-full px-3 py-1 text-xs font-medium)
  - Visible: bg-success/10 text-success
  - Flagged: bg-warning/10 text-warning
  - Removed: bg-danger/10 text-danger
  - Suppressed: bg-border text-tertiary
- **Role Tags**: Similar pills with role colors (owner=primary, admin=blue, moderator=orange, member=gray)

### Overlays
- **Modals**: Centered, max-w-2xl, bg-surface-elevated, rounded-lg, p-8, shadow-2xl, backdrop with bg-black/50 backdrop-blur-sm
- **Drawers**: Slide from right, w-96 or w-1/3, for detail views (thread detail, flag triage)
- **Toasts**: Bottom-right, slide-up animation, auto-dismiss 4s, icon + message + close button

---

## Marketing Pages (Public)

### Landing Page
**Layout**: 
- **Hero**: Full-width (100vh), centered content (max-w-4xl), large hero image showing Slack integration or anonymous feedback concept (subtle, professional stock photo with overlay gradient from bg to transparent)
- **Feature Grid**: 3 columns (lg:grid-cols-3), icon + heading + description cards with subtle hover lift
- **Social Proof**: Logos in grayscale, 4-6 columns, "Trusted by teams at..." heading
- **Privacy Section**: 2-column (image left, content right), highlight k-anonymity and encryption
- **CTA Section**: Centered, gradient bg (primary to primary-hover diagonal), "Add to Slack" button (large, with Slack logo), secondary "Learn More" link

**Imagery**: 
- Hero: Large abstract/gradient background image representing privacy/security (lock, shield metaphor, or abstract network visualization), subtle overlay
- Feature sections: Tasteful illustrations or screenshots showing anonymized feedback interface

### Pricing Page
**Layout**: 3-tier cards (Free/Pro/Enterprise), vertical alignment, highlight recommended (Pro) with border-primary and scale-105 transform

### FAQ/Support Pages
**Layout**: 2-column on desktop (TOC left, content right), accordion-style Q&A, generous line-height for readability

---

## Admin Dashboard

**Overall Layout**: Persistent sidebar (240px) with logo, nav sections (Content, Moderation, Analytics, Settings), user menu at bottom. Main content area with page header (title + actions) and content below.

**Key Screens**:
- **Moderation Queue**: Full-width table, filters bar (topic/status/date), flag detail drawer on row click
- **Analytics**: Dashboard grid with metric cards (4 cols) above time-series charts, export button in page header
- **Settings**: Tabbed sections (SSO, Topics, Retention, Thresholds), form-heavy with clear save states

**Animations**: Minimal—subtle fade-ins on page load, smooth transitions on hover (150ms), no distracting motion

---

## Accessibility & Consistency

- All interactive elements meet WCAG AA contrast (4.5:1 minimum)
- Focus indicators: 2px outline, primary color, offset by 2px
- Dark mode maintained across all pages, including form inputs
- Keyboard navigation fully supported (Tab order, Enter/Space actions, Escape to close modals)