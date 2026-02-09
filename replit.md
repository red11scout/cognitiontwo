# Cognitive Zero-Base Analysis Platform

## Overview
An AI-powered business transformation platform that implements the Cognitive Zero-Base framework. The application helps organizations redesign business models using Agentic AI instead of optimizing legacy processes.

**Current State:** MVP Complete
**Stack:** React + TypeScript + Express + Anthropic Claude AI
**Brand:** BlueAlly styling (Navy Blue, Bright Blue, Green, DM Sans)

## Recent Changes
- **February 6, 2026:** Added Password Protection with BlueAlly branding
  - Login screen with BlueAlly logo and "AI" label
  - Server-side password verification, all API routes protected
  - Session token persists in localStorage across refreshes
  - Password: BlueAlly45
  - Public routes: /share/:id and /report-print/:id bypass password gate
  - Share API endpoints accept ?share=true to bypass auth for read-only access
  - Database save happens BEFORE response to survive Cloudflare connection drops
  - Client-side timeout recovery: checks /api/analyses/latest after timeout to recover saved analyses
  - Database driver: standard pg (not @neondatabase/serverless)
- **January 28, 2026:** Hardened Report Generation with Null Safety
  - Added `decodeHtmlEntities()`, `safeArray()`, and `safeNumber()` utilities
  - All report components now degrade gracefully with fallback UI when data is missing
  - ECharts components show "Chart data unavailable" instead of crashing
  - PDF generation returns 503 status when Chromium is not available
- **December 22, 2025:** Implemented Multi-Agent Crew Analysis Framework
  - CrewAI-style TypeScript-native multi-agent system using Anthropic Claude
  - Four specialized agents work sequentially:
    1. Document Intelligence Agent - Extracts key findings from uploaded PDFs
    2. Business Strategy Agent - Applies Cognitive Zero-Base framework
    3. Financial Analyst Agent - Calculates unit economics and ROI
    4. Executive Orchestrator - Synthesizes outputs into final report
  - Each agent's output feeds the next for comprehensive analysis
  - Document evidence explicitly tracked and cited throughout results
  - Agent outputs with robust null-guards and value clamping
  - Pattern detection with fallbacks for use case categorization
  - Tone editor applied to executive summary for professional polish
  - New agent modules in `server/agents/` directory
- **December 22, 2025:** Added PDF Document Upload for Enhanced Analysis
  - Users can upload PDF documents (up to 2MB) to provide additional context
  - New `/api/parse-pdf` endpoint extracts text from uploaded PDFs
  - Document content integrated into AI analysis prompt for more targeted insights
  - Schema includes `uploadedDocumentContent` and `uploadedDocumentName` fields
  - Multer middleware with proper error handling for file size/type validation
  - Text truncated to 50K characters max for AI context window
- **December 22, 2025:** Added Shareable HTML Reports with dub.co URL Shortening
  - New `/share/:id` page for publicly viewable HTML reports
  - Dub.co integration for professional short URLs (requires DUB_API_KEY secret)
  - New API endpoint `POST /api/reports/:id/share` for generating share links
  - Report Builder now includes "Share Report" card with copy-to-clipboard
  - Fallback to direct share URLs when dub.co is not configured
  - Server-side dub-service.ts with retry logic and error handling
- **December 20, 2025:** Added Report Builder with Puppeteer PDF Generation and ECharts
  - New `/report-builder` page for interactive report preview and customization
  - ECharts visualization components (`charts-echarts/`) for high-quality financial charts
  - Puppeteer-based PDF generation endpoint (`POST /api/reports/:id/pdf`)
  - HTML-first template approach: one template renders to both web and PDF
  - Report print page (`/report-print/:id`) for Puppeteer to capture
  - Added "Report Builder" button to analysis results
- **December 20, 2025:** Implemented Neon Database and HyperFormula Calculation Engine
  - Upgraded database driver to Neon's serverless driver (@neondatabase/serverless)
  - Uses WebSocket connection for better serverless performance
  - Added HyperFormula spreadsheet calculation engine for financial projections
  - New API endpoints for calculations:
    - POST /api/calculate/trust-tax - Calculate Trust Tax breakdown
    - POST /api/calculate/cognitive-metrics - Aggregate cognitive node metrics
    - POST /api/calculate/total-savings - Sum use case savings by horizon
    - POST /api/calculate/roi - Calculate ROI, payback period, NPV
    - POST /api/calculate/formula - Evaluate custom spreadsheet formulas
- **December 18, 2025:** Integrated Executive-Grade Tone Editor
  - All generated reports now pass through a two-step AI workflow:
    1. Raw analysis generation using Cognitive Zero-Base framework
    2. Executive-grade tone editing for board-ready, professional language
  - Removes inflammatory/combative language, calibrates certainty statements
  - Preserves all data while improving readability and professionalism
  - Improved markdown export with HTML entity decoding and error handling
- **December 10, 2025:** Enhanced reports and added AI Form Assistant
  - Added helpful explanations to all report sections (Executive Summary, Charts, Use Cases)
  - Improved PDF export with better page breaks and formatting
  - Created AI Form Assistant that auto-fills form fields based on company name
  - Updated BlueAlly logo with proper light/dark mode variants
  - Added summary statistics to Cognitive Nodes and Charts
- **December 10, 2025:** Replaced authentication with anonymous workspace tokens
  - Removed Replit Auth - no login/signup required
  - Analyses saved/retrieved using anonymous workspace tokens stored in localStorage
  - Simplified database schema (removed users/sessions tables)
  - Each browser gets a unique token for saving and viewing their analyses
- **December 10, 2025:** Added BlueAlly logo and initial authentication
  - Updated BlueAlly logo to use official brand image
  - Dashboard for viewing and managing saved analyses
- **December 10, 2025:** Initial MVP implementation
  - Built complete 5-phase analysis workflow
  - Integrated Anthropic Claude for AI-powered analysis
  - Created professional data visualizations (Heatmap, Waterfall, Bubble charts)
  - Implemented BlueAlly brand styling throughout
  - Added PDF export functionality
  - Responsive design for mobile and desktop

## Project Architecture

### Frontend (`client/src/`)
- **pages/home.tsx** - Main page with landing, form, and results views
- **pages/report-builder.tsx** - Interactive report builder with section toggles and sharing
- **pages/report-print.tsx** - Print-optimized page for Puppeteer PDF generation
- **pages/share-report.tsx** - Public shareable report page
- **components/** - Reusable UI components
  - `organization-form.tsx` - Input form for company details
  - `analysis-results.tsx` - Complete analysis display with PDF export
  - `executive-summary.tsx` - AI-generated summary card
  - `use-case-card.tsx` - Use case comparison cards
  - `cognitive-nodes-display.tsx` - Cognitive nodes list
  - `processing-overlay.tsx` - Loading state with phase progression
  - `phase-stepper.tsx` - Desktop sidebar and mobile progress bar
  - `report-template.tsx` - HTML-first report template for web/PDF
  - `charts/` - Chart.js visualizations (Heatmap, Waterfall, Bubble)
  - `charts-echarts/` - ECharts visualizations for Report Builder
  - `blueally-logo.tsx` - Brand logo component
  - `theme-toggle.tsx` - Dark/light mode toggle

### Backend (`server/`)
- **routes.ts** - API endpoints for analysis, calculations, PDF generation, sharing
- **anthropic.ts** - Anthropic Claude integration with retry logic
- **dub-service.ts** - Dub.co URL shortening service with retry logic
- **pdf-generator.ts** - Puppeteer-based PDF generation service
- **calculation-engine.ts** - HyperFormula calculation engine
- **db.ts** - Neon serverless database connection

### Shared (`shared/`)
- **schema.ts** - TypeScript interfaces and Zod schemas

## Key Features
1. **Organization Profile Input** - Form to capture company details, pain points, data landscape
2. **AI-Powered Analysis** - Anthropic Claude analyzes using Cognitive Zero-Base framework
3. **5-Phase Framework:**
   - Cognitive Audit (identify cognitive nodes)
   - Agentic Design (map to patterns: Drafter-Critic, Reasoning Engine, Orchestrator, Tool User)
   - EPOCH Filter (filter by Empathy, Physicality, Opinion, Leadership)
   - Unit Economics (calculate LCOAI and Trust Tax)
   - Horizons Portfolio (allocate to H1, H2, H3)
4. **Data Visualizations:**
   - Cognitive Load Heatmap
   - Trust Tax Waterfall
   - Horizons Bubble Chart
5. **PDF Export** - Download complete analysis report
6. **Dark/Light Mode** - Theme toggle

## API Endpoints
- `POST /api/analyze` - Submit organization profile, receive complete analysis
- `POST /api/suggestions` - Get AI-generated form suggestions based on company name
- `GET /api/analyses` - Get saved analyses for owner token
- `GET /api/analyses/:id` - Get a specific analysis
- `DELETE /api/analyses/:id` - Delete a saved analysis
- `POST /api/reports/:id/pdf` - Generate PDF report using Puppeteer
- `POST /api/calculate/trust-tax` - Calculate Trust Tax breakdown
- `POST /api/calculate/cognitive-metrics` - Aggregate cognitive node metrics
- `POST /api/calculate/total-savings` - Sum use case savings by horizon
- `POST /api/calculate/roi` - Calculate ROI and payback period
- `POST /api/calculate/formula` - Evaluate custom spreadsheet formulas
- `POST /api/reports/:id/share` - Generate shareable short link for report

## Environment Variables
Uses Replit AI Integrations for Anthropic access:
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (auto-configured)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (auto-configured)

Optional for URL shortening:
- `DUB_API_KEY` - Dub.co API key for short links (format: `dub_xxxxxxxx`)

## User Preferences
- BlueAlly brand colors: Navy Blue (#001278), Bright Blue (#02a2fd), Green (#36bf78)
- DM Sans typography
- Professional, enterprise-grade design
- Mobile-first responsive layout

## Running the Application
The app runs via the "Start application" workflow which executes `npm run dev`.
Frontend is served on port 5000.
