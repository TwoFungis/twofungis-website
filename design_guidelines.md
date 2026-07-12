# TradeOS Design System

> **V2 Foundation Design Standards**
> 
> All components should follow these guidelines for consistency.

---

## Color System

### Primary Palette
```css
/* Background Layers */
--background: #000000;          /* Page background */
--surface: #0f0f12;             /* Card/panel background */
--surface-hover: #1a1a1e;       /* Interactive hover */
--border: #262626;              /* Borders and dividers */

/* Accent Colors */
--accent-primary: #10b981;      /* Emerald - primary actions */
--accent-muted: rgba(16, 185, 129, 0.15);  /* Emerald backgrounds */

/* Status Colors */
--status-success: #10b981;      /* Emerald green */
--status-warning: #f59e0b;      /* Amber */
--status-error: #ef4444;        /* Red */
--status-info: #3b82f6;         /* Blue */

/* Text Colors */
--text-primary: #ffffff;        /* Primary text */
--text-secondary: #a1a1aa;      /* Secondary text (zinc-400) */
--text-muted: #71717a;          /* Muted text (zinc-500) */
--text-disabled: #52525b;       /* Disabled (zinc-600) */
```

### Usage Guidelines
- Use black backgrounds for workspace mode
- Use subtle zinc borders (not gray)
- Emerald green for active states and CTAs
- Amber for warnings, red for errors
- No gradients on dark backgrounds (muddy)

---

## Typography

### Font Stack
```css
/* Primary font - UI elements */
font-family: 'IBM Plex Sans', system-ui, sans-serif;

/* Monospace - data, codes, timestamps */
font-family: 'JetBrains Mono', monospace;
```

### Size Hierarchy
| Element | Class | Weight |
|---------|-------|--------|
| Page Title | `text-2xl lg:text-3xl` | `font-bold` |
| Section Header | `text-lg lg:text-xl` | `font-semibold` |
| Card Header | `text-base lg:text-lg` | `font-semibold` |
| Body Text | `text-sm lg:text-base` | `font-normal` |
| Label | `text-xs` | `font-mono uppercase tracking-wider` |
| Caption | `text-xs` | `font-normal text-zinc-500` |

### Label Pattern
```jsx
<h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
  Section Label
</h2>
```

---

## Spacing System

### Base Unit: 4px
| Scale | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight inline spacing |
| `gap-2` | 8px | Icon/text pairs |
| `gap-3` | 12px | List items |
| `gap-4` | 16px | Section padding |
| `gap-6` | 24px | Card padding |
| `gap-8` | 32px | Section gaps |

### Card Padding Standard
```jsx
<div className="p-4 lg:p-6">
  {/* Content */}
</div>
```

---

## Component Patterns

### Cards
```jsx
<div className="bg-zinc-900 border border-zinc-800 rounded-lg">
  <div className="px-4 py-3 border-b border-zinc-800">
    <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
      Card Title
    </h2>
  </div>
  <div className="p-4">
    {/* Content */}
  </div>
</div>
```

### Interactive Rows
```jsx
<button className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left">
  <span className="text-white">Label</span>
  <div className="flex items-center gap-2">
    <span className="text-lg font-mono text-white">0</span>
    <ChevronRight className="w-4 h-4 text-zinc-500" />
  </div>
</button>
```

### Primary Button
```jsx
<button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Action
</button>
```

### Secondary Button
```jsx
<button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700">
  Secondary
</button>
```

### Ghost Button
```jsx
<button className="text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors">
  Ghost
</button>
```

---

## Navigation Patterns

### Sidebar Active State
```jsx
<NavLink
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`
  }
>
```

### Tab Navigation
```jsx
<button
  className={`px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? 'text-emerald-400 border-b-2 border-emerald-400'
      : 'text-zinc-400 hover:text-white'
  }`}
>
```

---

## Status Indicators

### Status Badge
```jsx
<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
  Active
</span>
```

### Priority Indicator
```jsx
// Urgent
<div className="w-2 h-2 rounded-full bg-red-500" />

// Warning
<div className="w-2 h-2 rounded-full bg-amber-500" />

// Success
<div className="w-2 h-2 rounded-full bg-emerald-500" />

// Default
<div className="w-2 h-2 rounded-full bg-zinc-500" />
```

---

## Loading States

### Spinner
```jsx
<Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
```

### Page Loading
```jsx
<div className="min-h-screen bg-black flex items-center justify-center">
  <div className="flex flex-col items-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
    <p className="text-zinc-400 text-sm">Loading...</p>
  </div>
</div>
```

### Skeleton
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
  <div className="h-4 bg-zinc-800 rounded w-1/2" />
</div>
```

---

## Empty States

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-12 h-12 text-zinc-700 mb-4" />
  <h3 className="text-lg font-medium text-zinc-400 mb-2">
    No items yet
  </h3>
  <p className="text-sm text-zinc-500 mb-4">
    Description of what will appear here
  </p>
  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium">
    Add First Item
  </button>
</div>
```

---

## Panel System

### Sliding Panel
```jsx
<div className={`fixed inset-y-0 right-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 transform transition-transform ${
  isOpen ? 'translate-x-0' : 'translate-x-full'
}`}>
  <div className="flex items-center justify-between p-4 border-b border-zinc-800">
    <h3 className="font-semibold text-white">Panel Title</h3>
    <button className="text-zinc-400 hover:text-white">
      <X className="w-5 h-5" />
    </button>
  </div>
  <div className="p-4 overflow-y-auto">
    {/* Content */}
  </div>
</div>
```

---

## Data Test IDs

All interactive elements must have `data-testid` attributes:

```jsx
// Navigation
data-testid="nav-home"
data-testid="nav-opportunities"

// Buttons
data-testid="submit-btn"
data-testid="cancel-btn"

// Cards/Sections
data-testid="projects-card"
data-testid="opportunities-card"

// Modals
data-testid="close-modal"
data-testid="confirm-modal"
```

---

## Icon Usage

### Recommended Library
Use `lucide-react` for all icons.

### Size Guidelines
| Context | Size |
|---------|------|
| Inline with text | `w-4 h-4` |
| Button icon | `w-5 h-5` |
| Card header | `w-5 h-5` |
| Empty state | `w-8 h-8` or `w-12 h-12` |
| Hero/feature | `w-16 h-16` |

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg - Desktop */ }
@media (min-width: 1280px) { /* xl */ }
```

### Common Patterns
```jsx
// Responsive padding
className="p-4 lg:p-6"

// Responsive text
className="text-sm lg:text-base"

// Responsive grid
className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"

// Hide on mobile
className="hidden lg:block"

// Show only on mobile
className="lg:hidden"
```

---

## Accessibility

### Focus States
```jsx
className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
```

### Screen Reader
```jsx
<span className="sr-only">Accessible label</span>
```

### ARIA
```jsx
aria-label="Close panel"
aria-expanded={isOpen}
aria-controls="panel-content"
```

---

## Animations

### Transitions
```jsx
// Standard transition
className="transition-colors"

// All properties
className="transition-all duration-200"

// Transform
className="transform transition-transform hover:scale-105"
```

### Hover Effects
```jsx
// Opacity
className="opacity-90 hover:opacity-100"

// Scale
className="hover:scale-[1.02] active:scale-[0.98]"

// Background
className="hover:bg-zinc-800/50"
```

---

## Document Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | ESTABLISHED |
| Last Updated | July 12, 2026 |
