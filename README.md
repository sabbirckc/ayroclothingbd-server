# AYRO Clothing BD API Server

High-performance Express.js and MongoDB Atlas backend for **AYRO Clothing BD — Timeless Essential Apparel Marketplace**.

## Key Features & Challenges Implemented
- **Challenge 1 (JWT Security with HTTPOnly Cookies)**: All data-modifying routes (`POST /api/clothes`, `DELETE /api/clothes/:id`, `POST /api/orders`) are guarded with JWT verification. Tokens are set in secure HTTPOnly cookies with Bearer header fallback.
- **Challenge 2 (Atomic Stock Double-Booking Prevention)**: Order creation validates inventory with MongoDB atomic operators (`findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`), guaranteeing that simultaneous purchases cannot double-book or exceed stock.
- **Order Cancellation**: Pending orders can be cancelled by buyers with automated stock restoration back to the clothing listing.
- **Authentication**: Custom password validation (Uppercase, Lowercase, minimum 6 characters), secure bcrypt hashing, Google social login support, and session preservation.
- **Apparel Catalog**: Filtering by category, sizing, price range, search querying, and 6-item featured sorting.
- **Saved Wishlist**: Persistent MongoDB wishlist toggle.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Security**: jsonwebtoken, bcryptjs, cookie-parser, cors

## Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/sabbirckc/ayroclothingbd-server.git
   cd ayroclothingbd-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is configured with `MONGODB_URI` and optional `PORT` / `JWT_SECRET`.
4. Seed the database:
   ```bash
   node seed.js
   ```
5. Run the server:
   ```bash
   node index.js
   ```

## Examiner Test Credentials
- **Examiner Email**: `examiner@clothspace.com`
- **Password**: `ClothSpace2026!`
- **Role**: `designer`

