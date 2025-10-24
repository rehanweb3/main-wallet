# MintraxChain Wallet Design Guidelines

## Design Approach

**Selected Approach:** Hybrid System - Drawing from modern crypto wallet leaders (Rainbow, Phantom, MetaMask) with glassmorphism aesthetic treatment for a trustworthy yet contemporary feel.

**Core Principles:**
- Security-first visual language: Clear confirmations, prominent warnings, visible transaction states
- Information clarity: Crypto data (addresses, amounts, gas fees) must be instantly scannable
- Progressive disclosure: Multi-step flows with clear navigation and confirmation stages
- Trust through transparency: All transaction details visible before commitment

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - for all UI text, data, and labels
- Monospace: JetBrains Mono - for wallet addresses, transaction hashes, and numerical data

**Type Scale:**
- Display: text-4xl (wallet balances, key metrics)
- Heading 1: text-2xl font-semibold (page titles)
- Heading 2: text-xl font-semibold (section headers)
- Heading 3: text-lg font-medium (card titles, token names)
- Body: text-base (standard content)
- Small: text-sm (labels, secondary info)
- Tiny: text-xs (timestamps, helper text)
- Mono: Use for addresses (truncated: 0x1234...5678), hashes, amounts with decimals

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent rhythm
- Micro spacing: p-2, gap-2 (tight elements)
- Standard spacing: p-4, gap-4, m-4 (cards, list items)
- Section spacing: p-6, py-8 (content containers)
- Page spacing: p-8, py-12 (main layouts)
- Large breaks: mb-16, py-16 (major section separations)

**Container Strategy:**
- App wrapper: max-w-7xl mx-auto (desktop centered layout)
- Content cards: max-w-2xl for focused flows (send/receive)
- Dashboard grid: Two-column on desktop (main content + sidebar), single column mobile
- Transaction modals: max-w-lg centered

## Component Library

### Navigation & Layout
**Top Navigation Bar:**
- Fixed header with glassmorphism treatment
- Left: MintraxChain logo and wallet name
- Center: Network indicator badge (MintraxChain with chain ID)
- Right: Wallet address (truncated with copy button), settings icon

**Sidebar (Desktop Dashboard):**
- Navigation items: Dashboard, Send, Receive, Tokens, History
- Active state: Subtle background with accent indicator
- Bottom section: Network status, sync indicator

### Dashboard Components

**Balance Card (Primary):**
- Large glass card with subtle gradient background
- Top: "Total Balance" label
- Center: Massive MTX amount (text-5xl or text-6xl) with symbol
- Bottom: USD equivalent (if available) in muted text
- Action buttons: Send MTX, Receive MTX, Add Token

**Wallet Address Card:**
- Glass card with QR code centered
- Full address below in monospace font
- Copy button with success feedback animation
- Share button option

**Token List:**
- Glass cards in vertical stack or grid (2 columns desktop, 1 mobile)
- Each token card: Icon/logo left, Name + Symbol, Balance right, USD value below
- Clickable to view token details
- Add Token button at bottom (prominent, dashed border style)

**Transaction History Widget:**
- List of recent 5-10 transactions
- Each row: Icon (send/receive arrow), Address (truncated), Amount, Timestamp
- "View All" link at bottom
- Click transaction opens glass modal with full receipt

### Send/Receive Flows

**Multi-Step Wizard Layout:**
- Progress indicator at top: Step 1/4 with visual dots
- Large content card with glass effect
- Navigation: Back button (top-left), Next/Confirm button (bottom-right)
- Each step occupies full card with clear heading

**Step 1 - Token Selection:**
- Radio card grid showing all tokens
- Each card: Token icon, name, balance, select indicator
- MTX featured prominently at top

**Step 2 - Recipient Input:**
- Large input field with monospace font
- Paste button integration
- Address validation indicator (checkmark or warning)
- Recent addresses suggestion list below

**Step 3 - Amount Input:**
- Large numeric input (text-4xl when typing)
- Max button to send full balance
- Live USD conversion below
- Available balance shown prominently

**Step 4 - Confirmation Summary:**
- Glass card with all details in clear rows:
  - From Address
  - To Address  
  - Amount (large, bold)
  - Gas Fee estimate
  - Total Cost
- Warning box for high gas or unusual transactions
- Large "Confirm Transaction" button

**Loading State:**
- Full-screen overlay with glassmorphism
- Animated spinner (rotating MTX logo or circular progress)
- Status text: "Broadcasting transaction..."
- No close option until complete

**Transaction Receipt:**
- Success icon at top (large checkmark in circle)
- "Transaction Successful" heading
- Glass card with watermark "Mintrax Wallet"
- Details grid:
  - Transaction Hash (with explorer link)
  - Block Number
  - From/To addresses
  - Amount and gas fee
  - Timestamp
- Action buttons: View in Explorer, Done (returns to dashboard)

### Token Management

**Add Token Modal:**
- Centered glass modal (max-w-lg)
- Input: Contract address (monospace)
- Auto-detected fields appear below with subtle animation:
  - Token icon/logo (if available)
  - Name (read-only, populated)
  - Symbol (read-only, populated)
  - Decimals (read-only, populated)
- Loading spinner during detection
- Add Token button (disabled until detection complete)

**Token Detail View:**
- Full-screen or large modal
- Token logo/icon prominent at top
- Balance (large)
- Contract address with copy button
- Token actions: Send, Remove from wallet
- Recent transactions filtered for this token

### Transaction History

**Full History View:**
- Filterable list (All, Sent, Received, Token Transfers)
- Date group headers (Today, Yesterday, This Week, etc.)
- Transaction cards in glass style:
  - Left: Type icon (send arrow down, receive arrow up)
  - Center: Address (truncated), token amount
  - Right: Timestamp, status badge
- Click opens detailed modal

**Transaction Detail Modal:**
- Glass overlay with centered card
- All receipt information as described above
- Explorer link button
- Close button (X in top-right)

### Forms & Inputs

**Text Inputs:**
- Glass background with subtle border
- Focus state: Stronger border, slight glow
- Labels above inputs (text-sm, font-medium)
- Helper text below in muted color
- Error state: Red border, error message below

**Buttons:**
- Primary: Solid background with glassmorphism on hover/focus, text-white
- Secondary: Glass background with border, hover brightens
- Sizes: Large (py-4 px-8) for CTAs, Medium (py-2.5 px-6) for standard, Small (py-2 px-4) for inline
- Disabled state: Reduced opacity, no interaction

**Badges & Indicators:**
- Status badges: Pill shape, small text
- Success: Green theme
- Pending: Yellow/orange theme
- Failed: Red theme
- Network badge: Blue/purple theme with chain ID

## Visual Treatment

**Glassmorphism Application:**
- All cards: Semi-transparent background with backdrop blur
- Subtle border (1px, low opacity white/gradient)
- Soft inner shadow for depth
- Avoid over-blurring - maintain readability

**Elevation Hierarchy:**
- Base layer: Dashboard background (solid or subtle gradient)
- Cards: Glass effect with backdrop-blur
- Modals: Darker overlay (bg-opacity-50) with glass modal on top
- Dropdowns/Tooltips: Elevated glass with stronger blur

**Visual Feedback:**
- Copy actions: Brief "Copied!" tooltip fade-in/out
- Transaction states: Progress indicators, checkmarks, warnings
- Loading: Skeleton screens for data loading, spinner for actions
- Success/Error: Brief toast notifications (glass style, auto-dismiss)

## Responsive Behavior

**Desktop (lg and up):**
- Two-column dashboard layout
- Side-by-side transaction details
- Modals: Medium width, centered

**Tablet (md):**
- Single column with full-width cards
- Sidebar collapses to icon-only or hidden

**Mobile (base):**
- Full-screen layouts
- Bottom sheet modals instead of centered
- Larger tap targets (min-h-12)
- Simplified navigation (bottom tab bar)

## Security & Trust Elements

- Transaction confirmations: Multiple steps with clear summaries
- Warning indicators: Yellow alert boxes for unusual amounts or addresses
- Gas fee prominence: Always visible before confirmation
- Address verification: Visual confirmation of copied/pasted addresses
- Network indicator: Always visible to prevent wrong-network transactions

## Images

**No hero image required** - This is a web app dashboard, not a marketing site. Focus on functional UI.

**Icon/Logo Usage:**
- MintraxChain logo: Top-left of navigation, loading screens
- Token logos: Fetched from contract metadata or placeholder icons
- Transaction type icons: Simple arrow icons (up/down for send/receive)