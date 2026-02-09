# Design Guidelines: BlueAlly Cognitive Zero-Base Analysis Platform

## Design Approach
This application follows the **BlueAlly Web and Mobile Styling Guide** with adaptations for a sophisticated enterprise analytics platform. The design emphasizes professional credibility, data clarity, and guided workflow progression.

## Core Brand Application

### Color System (BlueAlly Palette)
- **Primary Actions**: Bright Blue (#02a2fd) for CTAs, active states, progress indicators
- **Professional Foundation**: Navy Blue (#001278) for headers, primary text, data labels
- **Success States**: Green (#36bf78) for completed phases, positive metrics
- **Backgrounds**: White (#ffffff) for main content, Light Blue (#cde5f1) for subtle section differentiation
- **Typography**: Black (#040822) for body text
- **Accent Overlays**: Deep Navy at 80% opacity for image overlays with white text

### Typography Hierarchy (DM Sans)
- **H1 (Page Titles)**: Bold, 32px desktop / 24px mobile, Navy Blue
- **H2 (Section Headers)**: Bold, 24px desktop / 20px mobile, Navy Blue
- **H3 (Subsections)**: Medium, 18px desktop / 16px mobile, Navy Blue
- **Body Text**: Regular, 16px desktop / 14px mobile, Black
- **Data Labels**: Medium, 14px, Navy Blue
- **Metrics/Numbers**: Bold, 20-28px, Bright Blue or Green (depending on context)
- **Secondary Info**: Light, 14px, Navy Blue at 70% opacity

### Spacing System (4px Grid)
- **Component Padding**: 16px (inputs, cards)
- **Section Spacing**: 32px between major sections
- **Form Field Gaps**: 16px vertical spacing
- **Card Margins**: 24px between cards
- **Page Margins**: 48px desktop / 24px mobile

## Layout Architecture

### Application Structure
**Progressive Multi-Step Workflow Pattern** with clear phase navigation:
- Persistent header with logo (left), progress indicator (center), phase navigation (right on desktop, hamburger on mobile)
- Main content area with max-width: 1200px, centered
- Sticky phase indicator sidebar (desktop only) showing 5 framework phases
- Footer with BlueAlly branding and secondary navigation

### Hero Section (Landing/Welcome Screen)
- **No large hero image** - this is a business tool, not marketing
- Clean header with BlueAlly logo (145px width minimum)
- Concise value proposition: H1 + supporting paragraph in centered layout
- Primary CTA button (Bright Blue) "Begin Analysis" with prominent placement
- Secondary supporting elements: Trust indicators (client logos using Light Blue tint), key benefits (3-column grid on desktop, stack on mobile)

## Component Design

### Input Forms (Organization Profile Capture)
- White background cards with 8px border-radius, subtle shadow
- Input fields: White background, 1px Light Blue border, 4px border-radius
- Focus state: Bright Blue border
- Labels: Medium weight, Black, positioned above inputs
- Helper text: Light weight, Navy Blue 70% opacity, 12px
- Multi-line text areas for pain points/data landscape
- Required field indicators: Bright Blue asterisk

### Phase Navigation
- Vertical stepper (desktop sidebar): Navy Blue circles with white numbers, Bright Blue for active phase, Green checkmark for completed
- Horizontal progress bar (mobile): Bright Blue fill showing completion percentage
- Phase titles: Medium weight when inactive, Bold when active

### Data Visualization Dashboard
- Three-chart layout: Stacked on mobile, 2-column then full-width on desktop
- Chart containers: White background cards, 16px padding, 8px border-radius, shadow
- Chart.js styling: Navy Blue primary bars/lines, Bright Blue secondary, Green for positive metrics
- Chart titles: Bold, 18px, Navy Blue
- Axis labels: Regular, 12px, Black
- Grid lines: Light Blue at 30% opacity

### Analysis Output Display
- Executive Summary card: Light Blue background, 24px padding, Navy Blue text
- Use case cards: White background, numbered badges (Bright Blue circles), organized in vertical list
- "Old Way vs. Agentic Way" comparison: Two-column layout with Navy Blue (Old) and Bright Blue (Agentic) accent borders
- Metric callouts: Large Bold numbers in Bright Blue/Green, smaller labels below
- Collapsible sections for detailed methodology

### Buttons
- **Primary (Begin Analysis, Generate Report)**: Bright Blue background, white text, Bold font, 16px padding vertical, 32px horizontal, 4px border-radius
- **Secondary (Save Draft, Back)**: Navy Blue background, white text
- **Tertiary (Edit, Cancel)**: White background, Navy Blue text and 1px border
- **Export PDF**: Green background, white text with download icon
- Hover: Darken background 10%
- Disabled: Light Blue background, white text at 70% opacity

## Unique Brand Elements

### BlueAlly Logo Mark Integration
- Use angular logo mark shapes as section dividers between phases
- Apply logo mark mask to data visualization containers (subtle watermark effect at 5% opacity)
- Header includes full BlueAlly logo with proper clear space

### Professional Enhancements
- Tooltips for complex terms (e.g., "LCOAI", "Trust Tax"): White background, Navy Blue text, subtle shadow
- Loading states during AI analysis: Bright Blue spinner, "Analyzing..." text in Medium weight
- Success confirmations: Green checkmark icon, celebratory micro-animations (subtle scale)
- Error states: Red (#dc2626) for critical alerts, inline validation messages

## Responsive Behavior
- **Desktop (1200px+)**: Sidebar navigation, three-column chart layout capability, expanded forms
- **Tablet (768-1199px)**: Collapsible sidebar, two-column layouts, touch-optimized form controls
- **Mobile (<768px)**: Hamburger menu, single column, bottom navigation for phase progression, larger tap targets (minimum 44px)

## Accessibility
- WCAG 2.1 AA compliant color contrasts (validated per BlueAlly guide)
- Semantic HTML for screen readers
- Keyboard navigation for all interactive elements
- Focus indicators: 2px Bright Blue outline with 2px offset
- Alt text for all logo instances and data visualizations

## Images
**No hero images**. This is a data-driven business application where credibility comes from professionalism and clarity, not photography. Any imagery limited to:
- BlueAlly logo (required in header)
- Optional: Small client logo badges in trust indicator section (grayscale with Light Blue tint)
- Chart visualizations (generated, not static images)