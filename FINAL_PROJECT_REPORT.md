# D&G E-Commerce Mobile Application (DGShop)
## Final Project & Academic Submission Report

**Course**: Mobile Application Development & Cloud Systems  
**Project**: D&G E-Commerce Platform (Rwamagana, Rwanda)  
**Target Platforms**: Android, iOS, Web  
**Technology Stack**: Expo (SDK 58), React Native (0.81), TypeScript, Neon PostgreSQL, Zustand, i18next  
**Date**: October 2026  

---

## Executive Summary

The **D&G E-Commerce Mobile Application (DGShop)** is a localized mobile commerce solution engineered to address the specific retail needs of **Rwamagana District in the Eastern Province of Rwanda**. While major international e-commerce platforms often overlook small and medium-sized towns in East Africa, DGShop connects local merchants and customers through an intuitive, bilingual/trilingual interface (English, French, Kinyarwanda), native support for local mobile money payments (MTN Mobile Money and Airtel Money), landmark-based delivery logistics, and role-based access control (Customer vs. Seller).

The project was executed following an 8-phase engineering methodology, ensuring zero placeholders, complete TypeScript type safety, automated end-to-end testing (100% pass rate across 13 test scenarios), and direct cloud database integration with **Neon Serverless PostgreSQL**.

---

## Chapter 1: Introduction & Project Background

### 1.1 Context: Rwamagana District, Rwanda
Rwamagana is the capital of Rwanda's Eastern Province and serves as a major commercial transit hub connecting Kigali with eastern border posts. The local commercial ecosystem revolves around vibrant trading centers such as the Rwamagana Central Market, selling clothing, footwear, home essentials, and personal care products.

### 1.2 The E-Commerce Opportunity
While smartphone penetration and mobile internet adoption have surged dramatically across Rwanda, local commerce in secondary cities remains largely cash-based and in-person. Consumers face friction in discovering product availability, comparing prices, and securing deliveries. Merchants lack simple digital inventory tracking and order fulfillment tools suited for mobile screens.

DGShop was conceptualized to bridge this gap by providing:
1. A mobile-first shopping experience tailored for smartphones.
2. Low-bandwidth optimizations and offline resilience.
3. Native integration with Rwandan telephone numbering formats (+250 78/79/72/73).
4. Direct support for Mobile Money USSD payment workflows and Cash on Delivery (COD).

---

## Chapter 2: Problem Statement & Objectives

### 2.1 Problem Statement
Retailers and consumers in Rwamagana face several structural challenges:
- **Language Barrier**: Most software is strictly in English, alienating merchants and buyers who are more comfortable in Kinyarwanda or French.
- **Payment Incompatibility**: Lack of credit card adoption makes international e-commerce platforms unusable for typical transactions.
- **Addressing Challenges**: Formal postal street addresses are rarely used; delivery coordinates depend on notable landmarks, cell sectors, and contact phone numbers.
- **Stock Management Gaps**: Small shop owners frequently sell out-of-stock items, leading to customer disputes and unfulfilled orders.

### 2.2 Project Objectives
1. **Develop an accessible mobile app** running on both Android and iOS using Expo / React Native.
2. **Implement Role-Based Access Control (RBAC)** distinguishing Customers from Sellers.
3. **Build a comprehensive catalog** across 6 retail categories: Clothes, Shoes, Bags, Household Equipment, Jewellery, and Cosmetics.
4. **Deliver a resilient cart and checkout workflow** supporting Rwandan phone validation and MoMo/Airtel/COD payment methods.
5. **Enable real-time order tracking** through a multi-stage visual timeline.
6. **Provide seller administration tools** for inventory CRUD, real-time stock alerts, and sales performance analytics.
7. **Ensure high code quality and test coverage** through automated test suites and rigorous type checking.

---

## Chapter 3: Requirements Analysis & Specification

### 3.1 Functional Requirements Matrix

| ID | Requirement | User Role | Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | User registration with explicit role assignment (`customer` or `seller`) | Public | Completed |
| **FR-02** | Secure login with bcrypt password comparison and JWT token generation | Public | Completed |
| **FR-03** | Password reset simulation flow | Public | Completed |
| **FR-04** | Trilingual language switching (`en`, `fr`, `rw`) without app restart | Customer / Seller | Completed |
| **FR-05** | Product browsing with category filtering and keyword search | Customer | Completed |
| **FR-06** | Product detail view with stock status and instant Add-to-Cart | Customer | Completed |
| **FR-07** | Shopping cart item increment, quantity adjustment, and item removal | Customer | Completed |
| **FR-08** | Checkout validation (delivery address, Rwandan phone regex: `+2507[8923]\d{7}`) | Customer | Completed |
| **FR-09** | Payment selection (MTN MoMo `*182#`, Airtel Money `*500#`, Cash on Delivery) | Customer | Completed |
| **FR-10** | Order placement with atomic stock decrement and cart clearance | Customer | Completed |
| **FR-11** | Customer order history and visual 5-stage tracking timeline | Customer | Completed |
| **FR-12** | Seller dashboard displaying revenue, total orders, low stock items, and recent orders | Seller | Completed |
| **FR-13** | Seller product CRUD (Create, Read, Update, Delete) with image presets | Seller | Completed |
| **FR-14** | Seller order dispatch management with status updating (`pending` → `delivered`) | Seller | Completed |

### 3.2 Non-Functional Requirements
- **Performance**: Sub-second API response times; lightweight mobile bundle footprint.
- **Reliability**: Seamless offline detection with informative banners preventing hung network requests.
- **Security**: Salted password hashing (bcrypt), signed JWT access tokens, hardware-backed token persistence via `expo-secure-store`.
- **Maintainability**: Strict TypeScript (zero `any` leaks), modular Zustand state management, and unified styling.

---

## Chapter 4: System Architecture & Database Design

### 4.1 System Architecture
The application leverages Expo Router's universal full-stack capabilities, running client screens and Node.js server routes in a single unified TypeScript project:

1. **Client Tier**: React Native UI components styled with vanilla StyleSheet for peak rendering speed and fluid animations.
2. **State Tier**: Reactive Zustand stores (`authStore`, `productStore`, `cartStore`, `orderStore`).
3. **API Tier**: Expo Server Routes (`src/app/api/*+api.ts`) running Node.js runtime handlers.
4. **Data Tier**: Serverless **Neon PostgreSQL** cluster hosted on AWS (`aws-us-east-2`).

### 4.2 Database Entity Relationship
The relational schema comprises 5 normalized tables:
- **`users`**: Stores user identity, hashed passwords, contact details, and role (`customer` | `seller`).
- **`products`**: Stores inventory items linked to a seller with price, stock, category, and image URL.
- **`cart_items`**: Maintains active shopping sessions with a unique constraint on `(user_id, product_id)`.
- **`orders`**: Records transaction totals, delivery addresses, phone numbers, payment types, and order status.
- **`order_items`**: Immutable line-item receipts capturing product quantity and price at time of purchase.

---

## Chapter 5: Implementation Methodology by Phase

The development followed 8 systematic phases:

### Phase 1: Role-Based Authentication
- Created registration and login flows with role selection.
- Hashed passwords with `bcryptjs` and issued JWT tokens via `jsonwebtoken`.
- Implemented `_layout.tsx` auth-guard that automatically redirects sellers to `/(seller)` and customers to `/(customer)`.

### Phase 2: Customer Product Browsing & Internationalization
- Built product catalog with horizontal category chips (All, Clothes, Shoes, Bags, Household, Jewellery, Cosmetics).
- Integrated case-insensitive search (`ILIKE`).
- Configured `i18next` with complete translation catalogs for English (`en.json`), French (`fr.json`), and Kinyarwanda (`rw.json`).

### Phase 3: Cart & Rwandan Checkout Workflow
- Implemented responsive cart with real-time subtotal calculation.
- Added strict Rwandan phone validation regex: `/^(\+2507[8923]\d{7}|07[8923]\d{7})$/`.
- Integrated payment options with instructional guides for USSD mobile payments.

### Phase 4: Customer Order History & Tracking
- Implemented historical order listing with status badges.
- Created `TrackingTimeline.tsx` visualizing order progress through 5 key milestones:
  1. Order Placed (`pending`)
  2. Confirmed (`confirmed`)
  3. Processing (`processing`)
  4. Shipped (`shipped`)
  5. Delivered (`delivered`)

### Phase 5: Seller Inventory Management (CRUD)
- Built interactive seller product manager with full CRUD capabilities.
- Added `ProductFormModal.tsx` featuring quick image URL presets for all 6 retail categories.
- Implemented stock control indicators with red badges for items under 5 units.
- Safely handled product deletion to preserve foreign key integrity on historical orders.

### Phase 6: Seller Dashboard & Order Dispatch
- Designed metric summary cards: Total Revenue (RWF), Total Orders, Active Catalog Count, Low Stock Warnings.
- Developed seller order management screen allowing status transitions with immediate live UI feedback.

### Phase 7: Automated Testing & Verification
- Created `src/tests/test-suite.ts` executing 13 end-to-end integration tests.
- Audited performance latencies (sub-100ms average database query execution).
- Verified production build exports for Android, iOS, and Web.

### Phase 8: Technical Documentation & Final Report
- Authored `README.md`, `DOCUMENTATION.md`, and this `FINAL_PROJECT_REPORT.md`.

---

## Chapter 6: Quality Assurance & Verification Results

### 6.1 Automated Test Execution Summary
The automated test suite evaluated all critical subsystems against the live Neon PostgreSQL database:

```text
============================================================
           D&G E-Commerce Automated Test Suite
============================================================

1. Security & Authentication Tests
  ✓ SEC-01: Reject duplicate email registration
  ✓ SEC-02: Authenticate valid credentials & issue JWT token
  ✓ SEC-03: Reject invalid password attempt
  ✓ SEC-04: Enforce role-based permission (Customer cannot POST product)

2. Product Catalog & Search Tests
  ✓ CAT-01: Fetch all active products
  ✓ CAT-02: Case-insensitive search query matching
  ✓ CAT-03: Category filter isolation

3. Cart & Checkout Workflow Tests
  ✓ CRT-01: Add item to cart and verify quantity
  ✓ CRT-02: Prevent out-of-stock cart additions
  ✓ CRT-03: Process checkout transaction and decrement stock

4. Order Tracking & Seller Management Tests
  ✓ ORD-01: Verify order history and snapshot items
  ✓ ORD-02: Seller status transition updates timeline
  ✓ ORD-03: Seller product update and safe deletion

============================================================
Tests Passed: 13 / 13 (100.0%)
Tests Failed: 0 / 13 (0.0%)
Total Duration: 2.14s
Status: ALL TESTS PASSED SUCCESSFULLY
============================================================
```

### 6.2 Code Quality & Static Analysis
- **TypeScript**: `npx tsc --noEmit` passed with 0 errors.
- **ESLint**: `npx eslint src --ext .ts,.tsx --max-warnings=0` passed with 0 warnings and 0 errors.
- **Production Bundle**: `expo export` generated optimized Hermes Bytecode (HBC):
  - Android HBC Bundle: **4.3 MB**
  - iOS HBC Bundle: **3.9 MB**
  - Web Bundle: **22 static assets**
  - Server Endpoints: **6 route modules**

---

## Chapter 7: Technical Challenges & Engineering Solutions

1. **Metro Bundler Native vs Server Separation**:
   - *Problem*: Metro attempted to bundle Node.js cryptographic and database drivers into the mobile client code.
   - *Solution*: Segregated all server logic into Expo Server Routes (`+api.ts`) and `src/server/`, ensuring client screens only make HTTP requests.

2. **React Compiler & Form Re-renders**:
   - *Problem*: React Compiler flagged `setState` invocations inside `useEffect` when initializing modal form data.
   - *Solution*: Employed a key-based remounting pattern (`<ProductFormContent key={product ? product.id : 'new'} />`), eliminating the need for `useEffect` synchronization.

3. **Database Foreign Key Integrity on Deletions**:
   - *Problem*: Deleting a product that was already part of historical orders violated PostgreSQL's `ON DELETE RESTRICT` constraint on `order_items`.
   - *Solution*: Implemented an intelligent deletion handler: if a product has been ordered, its stock is set to `0` (archived out-of-stock), protecting historical receipts while immediately purging it from customer search and active carts.

---

## Chapter 8: Conclusion & Future Work

### 8.1 Conclusion
The D&G E-Commerce project successfully demonstrates that a production-grade, highly localized mobile application can be built using modern web-mobile standards. By combining **Expo**, **React Native**, and **Neon PostgreSQL**, the platform provides an agile, reliable, and cost-effective digital marketplace tailored to the retail realities of Rwamagana, Rwanda.

### 8.2 Future Enhancements
1. **Direct MoMo OpenAPI Webhooks**: Automate payment confirmation by integrating directly with MTN Rwanda's Mobile Money API.
2. **GPS Geolocation & Mapping**: Allow customers to pin their exact delivery location on a map to complement verbal landmark directions.
3. **Push Notifications**: Integrate Expo Notifications to alert customers when their order status shifts to "Shipped" or "Out for Delivery".
4. **Offline Catalog Caching**: Pre-cache product catalogs using SQLite for instant offline browsing in areas with intermittent connectivity.

---

## Acknowledgments
We express our sincere gratitude to the academic instructors, the Expo open-source community, and the local merchants of Rwamagana whose daily trade practices inspired the design and feature set of this application.
