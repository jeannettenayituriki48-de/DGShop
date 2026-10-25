# D&G E-Commerce Mobile Application (DGShop)
### Mobile E-Commerce Solution for Rwamagana, Rwanda

[![Expo SDK](https://img.shields.io/badge/Expo-SDK_58-black?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?logo=postgresql)](https://neon.tech)
[![Automated Tests](https://img.shields.io/badge/Tests-13%2F13_Passed_(100%25)-brightgreen)](./TESTING_REPORT.md)

---

## 1. Project Overview

**D&G Shop** is a full-featured, mobile-first e-commerce platform specifically tailored for retail merchants and consumers in **Rwamagana District, Eastern Province, Rwanda**.

The application provides a smooth, cross-platform experience (Android, iOS, Web) with deep local customizations:
- **Currency**: Rwandan Francs (**RWF**).
- **Trilingual Support**: English (`en`), French (`fr`), and Kinyarwanda (`rw`).
- **Local Payment Gateways**: MTN Mobile Money (`*182#`), Airtel Money (`*500#`), and Cash on Delivery (COD).
- **Rwandan Phone Validation**: Regex validation for `+250 78/79/72/73` MSISDN numbering standards.
- **Role-Based Access Control (RBAC)**: Dedicated interfaces for **Customers** (catalog, cart, checkout, order tracking) and **Sellers** (inventory management, real-time analytics, order dispatching).

---

## 2. Product Categories

D&G Shop carries 6 core localized retail categories:
1. 👗 **Clothes (Imyenda / Vêtements)** — Modern wear, suits, traditional Kitenge fabric and shirts.
2. 👟 **Shoes (Inkweto / Chaussures)** — Formal leather shoes, sneakers, sandals, athletic footwear.
3. 👜 **Bags (Ibikapu / Sacs)** — Leather handbags, laptop backpacks, travel luggage.
4. 🍳 **Household Equipment (Ibikoresho byo mu nzu / Équipement ménager)** — Electric kettles, cookware, blender sets, food warmers.
5. 💍 **Jewellery (Imitako / Bijoux)** — Traditional necklaces, silver rings, gold bracelets.
6. 💄 **Cosmetics (Amavuta n'Ibirungo / Cosmétiques)** — Organic body lotions, perfumes, facial skin care.

---

## 3. Technology Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 58) with [React Native](https://reactnative.dev/) (0.81)
- **Routing**: [Expo Router v5](https://docs.expo.dev/router/introduction/) (File-based navigation with tabs and nested dynamic stacks)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech) (`@neondatabase/serverless`)
- **Backend API**: Expo Server Routes (`src/app/api/*+api.ts`)
- **Security**: `jsonwebtoken` (JWT bearer tokens) & `bcryptjs` (salted password hashing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with `SecureStore` persistence
- **Forms & Validation**: `react-hook-form` + `zod`
- **Internationalization**: `i18next` + `react-i18next` + `expo-localization`
- **Network Resilience**: `@react-native-community/netinfo` offline interceptors

---

## 4. Repository Structure

```text
DGShop/
├── src/
│   ├── api/                     # Axios API clients & interceptors
│   │   ├── client.ts            # Base client with offline & JWT interceptors
│   │   ├── auth.api.ts          # Auth service
│   │   ├── products.api.ts      # Product service
│   │   ├── cart.api.ts          # Cart service
│   │   └── orders.api.ts        # Order service
│   ├── app/                     # Expo Router file-based screens & endpoints
│   │   ├── (auth)/              # Authentication flow (login, register, forgot-password)
│   │   ├── (customer)/          # Customer tab navigator (shop, cart, orders, profile)
│   │   ├── (seller)/            # Seller tab navigator (dashboard, products, orders, profile)
│   │   ├── api/                 # Expo Router API routes (+api.ts)
│   │   │   ├── auth/            # login, register, forgot-password endpoints
│   │   │   ├── products+api.ts  # Catalog CRUD endpoint
│   │   │   ├── cart+api.ts      # Cart management endpoint
│   │   │   └── orders+api.ts    # Order checkout & status update endpoint
│   │   └── _layout.tsx          # Root layout with auth guard & role redirection
│   ├── components/              # Reusable UI components (StatusBadge, Timeline, Modal)
│   ├── db/                      # Neon Postgres schema, migration & seed scripts
│   │   ├── index.ts             # Connection pool initialization
│   │   ├── migrate.ts           # DDL schema runner
│   │   └── seed.ts              # Initial demo data seeder
│   ├── i18n/                    # Localized translations (en.json, fr.json, rw.json)
│   ├── store/                   # Zustand stores (auth, products, cart, orders)
│   ├── tests/                   # Automated end-to-end test suite (13 test cases)
│   └── types/                   # Global TypeScript definitions
├── TESTING_REPORT.md            # Comprehensive test matrix and security audit
├── DOCUMENTATION.md             # Technical architecture & API reference
├── FINAL_PROJECT_REPORT.md      # Academic final project report
├── app.json                     # Expo configuration
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 5. Prerequisites & Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- Active Neon PostgreSQL Database URL

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/your-username/DGShop.git
   cd DGShop
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@ep-your-subdomain.us-east-2.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="dgshop_rwamagana_jwt_secure_key_2026_super_secret"
   EXPO_PUBLIC_API_URL="http://localhost:8081/api"
   ```

3. **Initialize Database Tables & Seed Data**:
   ```bash
   # Run schema migration (creates users, products, cart_items, orders, order_items)
   npx tsx --env-file=.env.local src/db/migrate.ts

   # Seed default sellers, customers, and Rwamagana retail inventory
   npx tsx --env-file=.env.local src/db/seed.ts
   ```

---

## 6. Default Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Seller** | `seller@dgshop.rw` | `Seller@123` | Full inventory control, order dispatch, revenue reports |
| **Customer** | `customer@dgshop.rw` | `Customer@123` | Browsing, cart, checkout, tracking timeline |

---

## 7. Running the Application

### Start Development Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Press `w` to open in Web Browser.

### Typecheck & Lint
```bash
# TypeScript strict type checking
npx tsc --noEmit

# ESLint code hygiene check
npx eslint src --ext .ts,.tsx --max-warnings=0
```

### Run Automated Test Suite
```bash
# Runs the 13 automated E2E tests against Neon Postgres
npx tsx --env-file=.env.local src/tests/test-suite.ts
```

### Production Build Export
```bash
npm run build
# Or directly via expo
npx expo export
```

---

## 8. Documentation References

- **[DOCUMENTATION.md](./DOCUMENTATION.md)**: Deep-dive technical specifications, database schema diagrams, REST API documentation, and state flow diagrams.
- **[TESTING_REPORT.md](./TESTING_REPORT.md)**: Test verification matrix, benchmark results, security audit, and cross-platform verification.
- **[FINAL_PROJECT_REPORT.md](./FINAL_PROJECT_REPORT.md)**: Full academic project submission report covering problem context, design methodology, implementation phases, and evaluation.
