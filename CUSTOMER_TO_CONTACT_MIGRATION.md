# Customer to Contact Migration

This document outlines all the changes made to rename "customers" to "contacts" throughout the Payoff Solar application.

## Summary

The application has been completely updated to use "contacts" terminology instead of "customers" throughout the codebase, database, and user interface.

## Database Changes

### Schema Updates
- **Table renamed**: `customers` → `contacts`
- **Column renamed**: `orders.customer_id` → `orders.contact_id`
- **Foreign key updated**: Orders now reference `contacts(id)` instead of `customers(id)`
- **Indexes updated**: 
  - `idx_customers_email` → `idx_contacts_email`
  - `idx_orders_customer` → `idx_orders_contact`
- **Roles updated**: `customer` role → `contact` role

### Migration Script
- Created `scripts/migrate-customers-to-contacts.js` to safely migrate existing databases
- Script handles table renaming, column updates, foreign key constraints, and role updates
- Includes transaction support and rollback on errors

## Backend Changes

### Models (`src/lib/models/index.ts`)
- **Interface renamed**: `Customer` → `Contact`
- **Model renamed**: `CustomerModel` → `ContactModel`
- **Order interface updated**: `customer_id` → `contact_id`
- **Order interfaces updated**: `OrderWithCustomer` → `OrderWithContact`
- All database queries updated to use `contacts` table and `contact_id` fields

### API Routes
- **Directory renamed**: `/api/customers/` → `/api/contacts/`
- **Routes updated**:
  - `GET /api/contacts` - List contacts
  - `POST /api/contacts` - Create contact
  - `GET /api/contacts/[id]` - Get contact
  - `PUT /api/contacts/[id]` - Update contact
  - `DELETE /api/contacts/[id]` - Delete contact
  - `POST /api/contacts/import` - Import contacts from CSV

### Order API Updates
- Updated order creation/editing to use `contact_id` instead of `customer_id`
- Updated order receipt generation to use contact information
- Updated validation to check for contact existence

### Authentication Updates
- **User role updated**: `customer` → `contact`
- **Function renamed**: `isCustomer()` → `isContact()`
- Updated user registration to assign `contact` role
- Updated role validation throughout the application

## Frontend Changes

### Page Structure
- **Directory renamed**: `/dashboard/customers/` → `/dashboard/contacts/`
- **Pages updated**:
  - `/dashboard/contacts` - Contact list page
  - `/dashboard/contacts/new` - Add new contact
  - `/dashboard/contacts/[id]/edit` - Edit contact

### Components
- **Directory renamed**: `src/components/customers/` → `src/components/contacts/`
- **Components updated**:
  - `DeleteCustomerModal` → `DeleteContactModal`
  - `ImportCustomersModal` → `ImportContactsModal`

### Navigation & UI
- Dashboard navigation updated to show "Contacts" instead of "Customers"
- All user-facing text updated throughout the application
- Form labels and validation messages updated
- Table headers and data display updated

### Order Management
- Order creation/editing forms now use "Contact" dropdown
- Order list displays contact names instead of customer names
- Order details show contact information

## User Interface Changes

### Dashboard
- Statistics cards show "Total Contacts" instead of "Total Customers"
- Recent activity shows "New Contact Registration" instead of "New Customer Registration"
- Navigation menu shows "Contacts" with users icon

### Forms
- Contact forms maintain the same validation rules (only first name required)
- Phone number formatting and validation preserved
- State dropdown functionality preserved
- All form error messages updated to use "contact" terminology

### Tables and Lists
- Contact list table shows contact information
- Mobile-friendly card layout for contacts
- Search functionality works with contact data
- Pagination and filtering preserved

## Import/Export Features

### CSV Import
- Import modal updated to handle contact data
- Column mapping supports contact fields
- Validation rules preserved for contact data
- Error handling updated to use contact terminology

### Test Data
- Test CSV file renamed: `test_customers_with_errors.csv` → `test_contacts_with_errors.csv`

## Role-Based Access Control

### Contact Users
- Users with `contact` role can only see their own orders
- Contact users have limited dashboard access
- Order receipts accessible only to contact owners or admins

### Admin Users
- Full access to contact management
- Can create, edit, and delete contacts
- Can import contacts via CSV
- Can view all orders and associate them with contacts

## Migration Instructions

### For Existing Installations

1. **Backup your database** before running the migration
2. Run the migration script:
   ```bash
   node scripts/migrate-customers-to-contacts.js
   ```
3. Restart the application
4. Verify all functionality works correctly

### For New Installations

- The updated schema in `src/lib/mysql/schema.sql` includes all contact-related tables and relationships
- No migration needed for fresh installations

## Testing Recommendations

1. **Database Migration**: Test the migration script on a copy of production data
2. **Contact Management**: Verify CRUD operations for contacts
3. **Order Association**: Ensure orders are properly linked to contacts
4. **Role-Based Access**: Test contact user permissions vs admin permissions
5. **CSV Import**: Test contact import functionality with various data formats
6. **Search and Filtering**: Verify contact search and pagination works correctly

## Notes

- Public-facing marketing content still uses "customers" where appropriate (e.g., About page)
- The migration preserves all existing data and relationships
- All validation rules and business logic remain the same
- The change is primarily terminological to better reflect the business model
