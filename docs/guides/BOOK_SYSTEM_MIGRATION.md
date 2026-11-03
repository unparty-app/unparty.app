# Book Inventory System Migration Guide

This document outlines the migration from Google Sheets-based book management to an API-based inventory system with Stripe integration.

## Overview

The new system replaces Google Sheets with a database-driven approach that includes:
- Automatic SKU generation for books
- Stripe payment integration for shipping costs
- Address collection and shipping calculation
- Admin interface for book management
- Enhanced security and scalability

## Architecture Changes

### Database Schema
The `Book` model has been enhanced with new fields:
- `sku`: Unique identifier generated automatically (format: UNP-XXXX-YYYY)
- `paymentStatus`: Tracks payment state (PENDING, PAID, FAILED, REFUNDED)
- `shippingAddress`: JSON field storing customer shipping information
- `stripePaymentId`: Links to Stripe payment intent

### API Endpoints

#### GET /api/book
- **Purpose**: Fetch all books from database
- **Returns**: Array of Book objects with full details
- **Migration**: Replaced Google Sheets API calls

#### POST /api/book
- **Purpose**: Add new books with auto-generated SKU
- **Body**: Book details (title, author, quote, etc.)
- **Returns**: Created book with assigned SKU

#### POST /api/book/payment-intent
- **Purpose**: Create Stripe payment intent for book claiming
- **Body**: `{ bookId, shippingAddress }`
- **Returns**: `{ clientSecret, amount, shippingCost }`

#### POST /api/book/{bookId}
- **Purpose**: Claim book after payment completion
- **Body**: `{ userEmail, shippingAddress, paymentIntentId }`
- **Returns**: Claim confirmation

### Frontend Components

#### BookSection (Updated)
- Added payment modal integration
- Enhanced claim flow with address collection
- Real-time shipping cost calculation

#### PaymentModal (New)
- Secure address form with validation
- Dynamic shipping cost display
- Estimated delivery times
- Payment processing simulation (ready for Stripe Elements)

#### Admin Books Interface (New)
- Located at `/admin/books`
- Add new books with form validation
- View inventory with status tracking
- Monitor payment and claim status

## Migration Process

### 1. Data Migration
Run the migration script to transfer existing data:

```bash
npm run migrate-books
```

This script:
- Reads existing Google Sheets data
- Generates SKUs for all books
- Creates database records
- Preserves claim status and dates
- Validates data integrity

### 2. Environment Variables
Add the following to your `.env` file:

```env
# Existing Google Sheets vars (for migration only)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEETS_ID=...
```

### 3. Database Setup
Run Prisma migrations:

```bash
npm run db:migrate
npm run db:generate
```

## Key Features

### SKU Generation
- Format: `UNP-XXXX-YYYY` (e.g., `UNP-A4B2-2024`)
- Unique identifiers prevent conflicts
- Year-based for easy organization

### Payment Integration
- Stripe payment intents for secure processing
- Dynamic shipping cost calculation based on address
- Payment verification before claim confirmation
- Support for international shipping

### Shipping Calculator
- Base cost: $5.00 for US domestic
- International surcharge: +$15.00
- Alaska/Hawaii surcharge: +$3.00
- Estimated delivery times by region

### Security Enhancements
- Input validation with Zod schemas
- Payment verification through Stripe
- User authentication required for claims
- Admin authentication for management

## API Response Examples

### Book Object
```json
{
  "id": "clx1234567890",
  "sku": "UNP-A4B2-2024",
  "title": "The Example Book",
  "author": "Jane Doe",
  "quote": "This is an inspiring quote...",
  "page": 42,
  "publisher": "Example Press",
  "publisherLink": "https://example.com",
  "inStock": true,
  "claimedBy": null,
  "claimedAt": null,
  "shippingFee": 5.00,
  "condition": "Good",
  "paymentStatus": "PENDING",
  "shippingAddress": null,
  "stripePaymentId": null
}
```

### Payment Intent Response
```json
{
  "clientSecret": "pi_1234567890_secret_...",
  "amount": 800,
  "shippingCost": 500
}
```

## Testing Workflow

### 1. Admin Flow
1. Navigate to `/admin/books`
2. Add a new book using the form
3. Verify SKU generation and database storage

### 2. User Claim Flow
1. Visit page with book display
2. Click "Claim Book" on available book
3. Fill out shipping address form
4. Review shipping costs and total
5. Complete payment (simulated)
6. Verify book marked as claimed

### 3. Migration Verification
1. Run migration script with test data
2. Compare Google Sheets data with database
3. Verify all claims and dates preserved
4. Test inventory counts match

## Rollback Plan

If issues arise during migration:

1. **Preserve Google Sheets**: Keep original data intact
2. **Feature Flag**: Toggle between old/new systems
3. **Database Rollback**: Use Prisma migrations to revert schema
4. **API Fallback**: Temporarily restore Google Sheets endpoints

## Performance Considerations

- Database queries optimized with proper indexing
- Prisma connection pooling for concurrent requests
- Shipping calculations cached where possible
- Admin interface paginated for large inventories

## Security Best Practices

- Stripe keys stored in environment variables
- Payment verification on server side
- Input sanitization and validation
- User authentication checks
- Admin route protection

## Future Enhancements

1. **Real Stripe Integration**: Replace payment simulation
2. **Inventory Alerts**: Low stock notifications
3. **Reporting Dashboard**: Claims analytics
4. **Bulk Operations**: Mass book imports
5. **Order Tracking**: Shipping status updates
6. **Email Notifications**: Automated claim confirmations