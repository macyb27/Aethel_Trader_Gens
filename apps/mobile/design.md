# Aether Trader Pro - Mobile Trading App Design

## Design Philosophy

Aether Trader Pro is a sophisticated AI-powered trading application designed for mobile portrait orientation (9:16) and one-handed usage. The design follows Apple Human Interface Guidelines (HIG) while incorporating a professional, scientific aesthetic suitable for serious trading applications. The app combines papertrading capabilities with self-learning AI, genetic algorithm optimization, and real-time news sentiment analysis.

## Screen List

The app consists of five main screens organized in a tab-based navigation:

| Screen | Purpose | Tab Icon |
|--------|---------|----------|
| Dashboard | Portfolio overview, P&L, market sentiment | chart.bar.fill |
| Trade | Execute paper trades, view order book | arrow.left.arrow.right |
| Strategy | AI-generated trading rules, genetic algorithm | brain.head.profile |
| News | Market news with sentiment analysis | newspaper.fill |
| Profile | Settings, trade history, learning stats | person.fill |

## Color Palette

The design uses a professional dark theme with cyan/teal accents for a scientific, high-tech feel:

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| primary | #00D9FF | #00D9FF | Accent color, buy actions, positive values |
| secondary | #FF6B6B | #FF6B6B | Sell actions, negative values, warnings |
| background | #0A0A0F | #0A0A0F | Screen backgrounds |
| surface | #12121A | #12121A | Cards, elevated surfaces |
| foreground | #FFFFFF | #FFFFFF | Primary text |
| muted | #8B8B9A | #8B8B9A | Secondary text |
| border | #1E1E2D | #1E1E2D | Card borders, dividers |
| success | #00C853 | #4ADE80 | Profit, completed trades |
| warning | #FFB800 | #FBBF24 | Pending states |
| error | #FF4757 | #F87171 | Loss, errors |

## Primary Content and Functionality

### Dashboard Screen
The dashboard provides a comprehensive view of the trading portfolio and market conditions:

The top section displays a gradient portfolio card showing total virtual balance (starting €10,000), unrealized P&L with percentage, and realized P&L. Below this, a market sentiment gauge shows the aggregated news sentiment from -1 (bearish) to +1 (bullish) with color coding. An active positions section lists current open trades with symbol, side (long/short), entry price, current price, and P&L. A performance metrics card shows key statistics including win rate, Sharpe ratio, max drawdown, and total trades. Quick action buttons provide shortcuts to Buy, Sell, and View Strategy functions.

### Trade Screen
The trade screen enables paper trading with a professional order interface:

A symbol selector at the top allows choosing from available trading pairs (BTC/EUR, ETH/EUR, etc.). A price chart area displays recent price movements with candlestick visualization. The order form includes side selection (Buy/Sell with color coding), order type (Market/Limit), amount input with percentage buttons (25%, 50%, 75%, 100%), and leverage selector (1x-10x for advanced users). An order book visualization shows bid/ask levels. Recent trades section displays the last executed orders.

### Strategy Screen
The strategy screen showcases the AI-powered trading intelligence:

A current strategy card displays the active genome ID, generation number, and key parameters (risk level, time horizon, trend bias). A trading rules section shows auto-generated rules learned from successful trades with conditions and actions. A genetic algorithm panel displays evolution statistics including population size, current generation, best fitness, and diversity score. A learning history section shows recent adaptations and rule modifications. An evolution control allows starting/stopping the genetic algorithm optimization.

### News Screen
The news screen provides real-time market news with sentiment analysis:

A sentiment overview bar shows the current aggregated market sentiment with momentum indicator. News cards display headlines with source, timestamp, sentiment score (color-coded), impact level (LOW/MEDIUM/HIGH/CRITICAL), and extracted keywords. A filter system allows filtering by sentiment (bullish/bearish/neutral) and impact level. A sentiment history chart shows sentiment trends over time.

### Profile Screen
The profile screen displays user statistics and settings:

A trading statistics card shows total trades, win rate, best trade, worst trade, and learning progress. A trade history section lists all executed paper trades with details. Settings include notification toggles, risk preferences, and data reset option. An about section displays app version and credits to original repositories.

## Key User Flows

### Execute Paper Trade Flow
User navigates to Trade tab, selects trading pair, chooses Buy or Sell, enters amount, reviews order details, confirms trade, receives execution confirmation, and position appears in Dashboard.

### View AI Strategy Flow
User navigates to Strategy tab, views current active strategy parameters, reviews auto-generated trading rules, can start/stop genetic algorithm evolution, and monitors learning progress.

### Analyze News Sentiment Flow
User navigates to News tab, views latest market news with sentiment scores, filters by sentiment or impact level, taps news item for details, and observes how sentiment affects trading recommendations.

## Typography

| Element | Size | Weight |
|---------|------|--------|
| Screen Title | 28px | Bold |
| Section Title | 18px | Semibold |
| Card Title | 16px | Bold |
| Body Text | 14px | Regular |
| Caption/Label | 12px | Medium |
| Small Text | 10px | Regular |

## Spacing System

The app uses an 8px base unit for consistent spacing:

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| xxl | 48px |

## Component Patterns

Cards use a dark surface background (#12121A) with a 1px border in the border color and 12px border radius. Primary buttons use cyan (#00D9FF) for buy actions and red (#FF6B6B) for sell actions. The portfolio card uses a subtle gradient from surface to slightly lighter. Sentiment indicators use a gradient from red (bearish) through neutral to green (bullish).

## Accessibility

All touch targets are minimum 44x44 points. Color contrast ratios meet WCAG AA standards. Text sizes are readable without zooming. Interactive elements have clear press states with opacity feedback. Color is not the only indicator of sentiment - icons and text labels supplement color coding.

## Data Flow

The app operates entirely with simulated/paper trading data stored locally. No real money is involved. The self-learning system tracks trade outcomes and adjusts strategies accordingly. The genetic algorithm evolves trading strategies over time based on performance metrics.
