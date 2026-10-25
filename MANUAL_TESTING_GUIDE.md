# DGShop — Comprehensive Manual QA Testing Guide

**Project**: D&G E-Commerce Mobile App (Rwamagana, Rwanda)  
**Target Roles**: Customer (Buyer) & Seller (Store Owner)  
**Stack**: Expo SDK 58, React Native, TypeScript, Zustand, Axios, Expo SecureStore, Neon PostgreSQL  
**Purpose**: School Project QA & Manual Acceptance Verification  

---

## 📋 Test Account Credentials Reference

Use these pre-seeded accounts to execute manual tests:

| Role | Name | Email | Password | Primary Purpose |
|---|---|---|---|---|
| **Seller** | Sam Rwema | `seller@dgshop.rw` | `Seller1234!` | Store management, product catalog, orders & reports |
| **Seller** | Diane Umutoni | `diane@dgshop.rw` | `Seller1234!` | Multi-seller verification |
| **Customer** | Alice Uwase | `alice@example.rw` | `Customer123!` | Primary customer purchasing, orders, cart & profile |
| **Customer** | Jean Claude | `jean@example.rw` | `Customer123!` | Secondary customer, order tracking |

---

## 1. 🔐 Authentication & Access Control (RBAC) Test Table

| Test ID | Test Scenario | Preconditions | Step-by-Step Instructions | Test Input Data | Expected Result | Status |
|:---:|---|---|---|---|---|:---:|
| **AUTH-01** | Successful Customer Login | App installed; user not logged in | 1. Open app<br>2. Tap "Login" on welcome screen<br>3. Enter email and password<br>4. Tap "Login" button | Email: `alice@example.rw`<br>Password: `Customer123!` | • Token saved to SecureStore<br>• Redirected to `/(customer)` tabs<br>• Greeting shows "Alice Uwase" | [ ] Pass<br>[ ] Fail |
| **AUTH-02** | Successful Seller Login | App installed; user not logged in | 1. Open app<br>2. Tap "Login"<br>3. Enter seller credentials<br>4. Tap "Login" | Email: `seller@dgshop.rw`<br>Password: `Seller1234!` | • Token saved to SecureStore<br>• Redirected to `/(seller)` dashboard<br>• Seller navigation visible | [ ] Pass<br>[ ] Fail |
| **AUTH-03** | Invalid Password Rejection | Registered account exists | 1. Navigate to Login<br>2. Enter correct email, wrong password<br>3. Tap "Login" | Email: `alice@example.rw`<br>Password: `WrongPass999` | • Error box appears: "Invalid email or password"<br>• User stays on login screen<br>• No token stored | [ ] Pass<br>[ ] Fail |
| **AUTH-04** | Email Format Validation | On Login screen | 1. Enter text without '@' or domain<br>2. Tap "Login" | Email: `notanemail`<br>Password: `Pass123456` | • Inline validation error: "Please enter a valid email address"<br>• Submit prevented | [ ] Pass<br>[ ] Fail |
| **AUTH-05** | Short Password Validation | On Login screen | 1. Enter valid email<br>2. Enter password < 8 chars<br>3. Tap "Login" | Email: `alice@example.rw`<br>Password: `short` | • Inline validation error: "Password must be at least 8 characters"<br>• Submit prevented | [ ] Pass<br>[ ] Fail |
| **AUTH-06** | New Customer Registration | On Register screen | 1. Tap "Register here"<br>2. Fill Name, Email, Password<br>3. Select "Customer (Buyer)"<br>4. Tap "Register" | Name: `Eric Mugisha`<br>Email: `eric@test.rw`<br>Password: `NewPass123!`<br>Role: `Customer` | • Account created in database<br>• Automatically logged in<br>• Redirected to customer home screen | [ ] Pass<br>[ ] Fail |
| **AUTH-07** | New Seller Registration | On Register screen | 1. Tap "Register here"<br>2. Fill details<br>3. Select "Seller (Store Owner)"<br>4. Tap "Register" | Name: `Kigali Crafts`<br>Email: `crafts@seller.rw`<br>Password: `SellerPass123!`<br>Role: `Seller` | • Seller account created<br>• Redirected to seller dashboard with empty/new inventory | [ ] Pass<br>[ ] Fail |
| **AUTH-08** | Route Guard: Customer → Seller URL | Logged in as Customer | 1. Attempt deep link or navigate to `/(seller)` | Role: `Customer` | • Guard redirects to customer dashboard or blocks access<br>• Seller tools inaccessible | [ ] Pass<br>[ ] Fail |
| **AUTH-09** | Logout & Token Cleanup | Logged in as any user | 1. Go to Profile screen<br>2. Scroll down & tap "Log Out"<br>3. Confirm logout | N/A | • SecureStore token deleted<br>• Session cleared<br>• Redirected to Welcome/Login screen | [ ] Pass<br>[ ] Fail |

---

## 2. 🛍️ Customer Journey (Browse, Search, Cart & Checkout)

| Test ID | Test Scenario | Preconditions | Step-by-Step Instructions | Test Input Data | Expected Result | Status |
|:---:|---|---|---|---|---|:---:|
| **CUST-01** | Public Catalog Browse | Unauthenticated user on Welcome screen | 1. Launch app<br>2. Scroll through public products list<br>3. Tap category chips | Categories: `Clothes`, `Shoes`, `Bags` | • Products load with photo/icon, name, price in RWF<br>• Filtering displays matching category products | [ ] Pass<br>[ ] Fail |
| **CUST-02** | Product Search by Name | Logged in as Customer | 1. Tap search bar on Home screen<br>2. Type query<br>3. Tap clear button ('✕') | Query: `coffee` or `shirt` | • Results filter in real-time matching query<br>• Clear button resets query and shows all products | [ ] Pass<br>[ ] Fail |
| **CUST-03** | Price Filter Slider/Bounds | On Home screen | 1. Select max price filter<br>2. Set budget limit | Max Price: `15,000 RWF` | • Items with price > 15,000 RWF hidden<br>• Only affordable items shown | [ ] Pass<br>[ ] Fail |
| **CUST-04** | Product Details View | On Home screen | 1. Tap any product card<br>2. Observe details screen | Any product | • Displays large image/icon, name, description, price, category, stock count, and "Add to Cart" button | [ ] Pass<br>[ ] Fail |
| **CUST-05** | Add Item to Cart | On Product Details screen | 1. Tap "Add to Cart"<br>2. Check badge counter on bottom Cart tab | Stock > 0 | • Toast/alert confirms item added<br>• Cart tab badge increments by 1 | [ ] Pass<br>[ ] Fail |
| **CUST-06** | Out of Stock Protection | Product has `stock: 0` | 1. Locate product with 0 stock<br>2. Attempt to add to cart | Product with 0 stock | • Shows "Out of stock" indicator<br>• Button is disabled or warns insufficient stock | [ ] Pass<br>[ ] Fail |
| **CUST-07** | Modify Cart Quantities | Item present in cart | 1. Go to Cart tab<br>2. Tap `+` button to increase quantity<br>3. Tap `-` button to decrease | Item qty: 1 → 2 → 1 | • Subtotal updates dynamically<br>• Total amount updates accordingly | [ ] Pass<br>[ ] Fail |
| **CUST-08** | Remove Item from Cart | Item present in cart | 1. On Cart screen, tap delete/trash icon on item | Any cart item | • Item disappears from cart<br>• Total recalculates; shows "Your Cart is Empty" if last item | [ ] Pass<br>[ ] Fail |
| **CUST-09** | Checkout Form Validation | Cart has items | 1. Tap "Proceed to Checkout"<br>2. Leave Address empty<br>3. Enter invalid phone prefix | Address: `""`<br>Phone: `0700123456` | • Error for address: "Delivery address must be at least 5 characters"<br>• Error for phone: "Enter a valid Rwandan phone number" | [ ] Pass<br>[ ] Fail |
| **CUST-10** | Complete Order (MTN MoMo) | Cart has items | 1. Fill address<br>2. Enter MTN MoMo number<br>3. Select "MTN Mobile Money"<br>4. Tap "Confirm Order" | Address: `KG 15 Ave, Nyarutarama`<br>Phone: `+250788123456`<br>Payment: `momo` | • Order created with status `pending`<br>• Cart wiped cleanly<br>• Success screen displays new Order ID | [ ] Pass<br>[ ] Fail |
| **CUST-11** | Customer Orders History | Order placed | 1. Navigate to "Orders" tab<br>2. Inspect order list | N/A | • Shows newly created order<br>• Displays order total, date, status badge `⏳ Pending` | [ ] Pass<br>[ ] Fail |
| **CUST-12** | Order Timeline Tracking | Order created | 1. Tap order card in Orders list<br>2. View Tracking Timeline screen | Order # | • Timeline shows Step 1 "Order Placed" checked<br>• Subsequent steps show pending status | [ ] Pass<br>[ ] Fail |

---

## 3. 🏪 Seller Journey (Inventory, Orders & Status Workflow)

| Test ID | Test Scenario | Preconditions | Step-by-Step Instructions | Test Input Data | Expected Result | Status |
|:---:|---|---|---|---|---|:---:|
| **SELL-01** | Seller Dashboard Stats | Logged in as Seller | 1. Open Seller Home tab<br>2. View overview metrics | N/A | • Displays Total Sales (RWF), Total Orders count, Active Products count, and Low Stock alerts | [ ] Pass<br>[ ] Fail |
| **SELL-02** | Add New Product | In Seller Products tab | 1. Tap "+ Add Product"<br>2. Fill Name, Description, Price, Stock, Category<br>3. Tap "Save Product" | Name: `Handmade Rwamagana Basket`<br>Price: `18000`<br>Stock: `10`<br>Category: `Household Equipment` | • Product persists to Neon database<br>• Appears immediately in seller inventory & customer catalog | [ ] Pass<br>[ ] Fail |
| **SELL-03** | Validation on New Product | Add Product modal | 1. Leave Name blank<br>2. Enter negative price<br>3. Tap "Save Product" | Name: `""`<br>Price: `-500` | • Validation alert: "Product name is required" and "Price must be positive"<br>• Product not saved | [ ] Pass<br>[ ] Fail |
| **SELL-04** | Edit Existing Product Stock | Item exists in inventory | 1. Find product in list<br>2. Tap "Edit" or stock stepper<br>3. Increase stock by 5<br>4. Save | New Stock: `15` | • Updated stock value updates in UI and database | [ ] Pass<br>[ ] Fail |
| **SELL-05** | View Store Orders List | Customer has placed orders | 1. Tap "Orders" tab in seller dashboard<br>2. Review incoming customer orders | N/A | • Lists all customer orders with customer name, phone, address, and total RWF | [ ] Pass<br>[ ] Fail |
| **SELL-06** | Advance Order to Processing | Order is `pending` | 1. Open order details<br>2. Select status "Processing"<br>3. Confirm update | Status: `processing` | • Status updates to `⚙️ Processing`<br>• Customer tracking timeline reflects Step 2 checked | [ ] Pass<br>[ ] Fail |
| **SELL-07** | Advance Order to Shipped | Order is `processing` | 1. Select status "Shipped"<br>2. Confirm update | Status: `shipped` | • Status updates to `🚚 Shipped`<br>• Customer tracking timeline reflects Step 3 checked | [ ] Pass<br>[ ] Fail |
| **SELL-08** | Mark Order Delivered | Order is `shipped` | 1. Select status "Delivered"<br>2. Confirm update | Status: `delivered` | • Status updates to `✅ Delivered`<br>• Customer timeline shows all 4 steps complete | [ ] Pass<br>[ ] Fail |
| **SELL-09** | Cancel Order & Restore Stock | Order is `pending` or `processing` | 1. Select status "Cancelled"<br>2. Confirm update | Status: `cancelled` | • Status updates to `❌ Cancelled`<br>• Product stock is automatically restored (+ quantity) in database | [ ] Pass<br>[ ] Fail |
| **SELL-10** | View Customers List | Logged in as Seller | 1. Tap "Users" tab in seller dashboard<br>2. Review customer list | N/A | • Displays registered customers, emails, and roles | [ ] Pass<br>[ ] Fail |

---

## 4. 🌐 Multilingual (i18n) & Localization Test Table

| Test ID | Test Scenario | Preconditions | Step-by-Step Instructions | Test Input Data | Expected Result | Status |
|:---:|---|---|---|---|---|:---:|
| **LANG-01** | Switch to French (FR) | Logged in as Customer/Seller | 1. Go to Profile tab<br>2. Tap "Language"<br>3. Select "Français (FR)" | Language: `fr` | • UI labels switch to French immediately<br>• E.g.: "Panier", "Commandes", "Chargement..."<br>• Choice saved to AsyncStorage | [ ] Pass<br>[ ] Fail |
| **LANG-02** | Switch to Kinyarwanda (RW) | On Profile screen | 1. Tap "Language"<br>2. Select "Ikinyarwanda (RW)" | Language: `rw` | • UI labels switch to Kinyarwanda<br>• E.g.: "Ahabanza", "Ikarita", "Ibicuruzwa"<br>• Choice saved to AsyncStorage | [ ] Pass<br>[ ] Fail |
| **LANG-03** | Language Persistence Across Restarts | Language set to `rw` or `fr` | 1. Close the app completely<br>2. Relaunch app | Selected: `rw` | • App boots directly in Kinyarwanda<br>• Does not revert to English default | [ ] Pass<br>[ ] Fail |
| **LANG-04** | Currency Uniformity | Any language selected | 1. Inspect prices in EN, FR, and RW | Currency check | • All prices formatted with `RWF`<br>• E.g.: `12,000 RWF` (never USD or EUR) | [ ] Pass<br>[ ] Fail |

---

## 5. 📡 Offline & Resilience Test Table

| Test ID | Test Scenario | Preconditions | Step-by-Step Instructions | Expected Result | Status |
|:---:|---|---|---|---|:---:|
| **NET-01** | Offline Detection on Launch | Device in Airplane Mode / No WiFi | 1. Turn on Airplane mode<br>2. Open app | • `ErrorView` displays with satellite icon (📡)<br>• Header says "Connection Issue"<br>• Message: "No internet connection. Please check your network." | [ ] Pass<br>[ ] Fail |
| **NET-02** | Retry After Connection Restored | App showing offline ErrorView | 1. Turn on WiFi/Mobile Data<br>2. Tap "Retry" button | • Error clears immediately<br>• Data reloads from API and renders products | [ ] Pass<br>[ ] Fail |
| **NET-03** | Offline Add-to-Cart Guard | Airplane mode enabled | 1. Attempt to add product or checkout while offline | • Client interceptor intercepts before request and displays "NO_INTERNET" alert<br>• App does not freeze or crash | [ ] Pass<br>[ ] Fail |
| **NET-04** | Session Expiry / 401 Auto-Logout | Logged in; token invalidated | 1. Invalidate or delete backend session<br>2. Trigger any API call | • Response interceptor intercepts 401 Unauthorized<br>• SecureStore token automatically deleted<br>• App smoothly navigates to Login | [ ] Pass<br>[ ] Fail |

---

## 6. How to Run and Sign Off Manual QA

1. **Start the local server**:
   ```powershell
   npx expo start
   ```
2. **Launch on target device**:
   - Press **`a`** for Android Emulator (or scan QR code with Expo Go)
   - Press **`i`** for iOS Simulator
   - Press **`w`** for Web Browser
3. Check off each test case as `[x] Pass`.
4. If any bug is identified during execution:
   - Note the **Test ID** (e.g. `CUST-09`)
   - Document the reproduction steps and screenshot
   - Log fix in `FINAL_PROJECT_REPORT.md`
