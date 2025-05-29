# Payoff Solar - Data Model

This document describes the complete data model for the Payoff Solar CRM/CMS application, including all entities, relationships, and business rules.

## Overview

The Payoff Solar data model is designed to support:
- **User Management** - Authentication, roles, and profiles
- **Customer Relationship Management (CRM)** - Customer data and interactions
- **Product Catalog** - Solar products and categories
- **Inventory Management** - Multi-warehouse inventory tracking
- **Order Management** - Sales orders and order items
- **Invoice Management** - Billing and payment tracking
- **Service Management** - Installation and maintenance services
- **Content Management System (CMS)** - Website content and blog

## Entity Relationship Diagram

```mermaid
erDiagram
    %% User Management
    USERS {
        varchar id PK "UUID"
        varchar email UK "Unique email"
        varchar password_hash "BCrypt hash"
        boolean email_verified "Default false"
        timestamp created_at
        timestamp updated_at
    }
    
    ROLES {
        varchar id PK "UUID"
        varchar name UK "admin, manager, sales, inventory, customer"
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    PROFILES {
        varchar id PK "FK to users.id"
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar role_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    PASSWORD_RESET_TOKENS {
        varchar id PK "UUID"
        varchar user_id FK
        varchar token UK "Reset token"
        timestamp expires_at
        boolean used "Default false"
        timestamp created_at
    }
    
    %% Customer Management
    CUSTOMERS {
        varchar id PK "UUID"
        varchar first_name
        varchar last_name
        varchar email
        varchar phone
        varchar address
        varchar city
        varchar state
        varchar zip
        text notes
        varchar user_id FK "Optional link to user account"
        timestamp created_at
        timestamp updated_at
    }
    
    %% Product Catalog
    PRODUCT_CATEGORIES {
        varchar id PK "UUID"
        varchar name
        text description
        varchar slug UK
        varchar parent_id FK "Self-referencing for subcategories"
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        varchar id PK "UUID"
        varchar name
        text description
        decimal price "10,2"
        varchar image_url
        varchar category_id FK
        varchar sku UK "Stock Keeping Unit"
        boolean is_active "Default true"
        timestamp created_at
        timestamp updated_at
    }
    
    %% Inventory Management
    WAREHOUSES {
        varchar id PK "UUID"
        varchar name
        varchar address
        varchar city
        varchar state
        varchar zip
        timestamp created_at
        timestamp updated_at
    }
    
    INVENTORY {
        varchar id PK "UUID"
        varchar product_id FK
        varchar warehouse_id FK
        int quantity "Current stock"
        int min_quantity "Reorder threshold"
        timestamp created_at
        timestamp updated_at
    }
    
    %% Order Management
    ORDERS {
        varchar id PK "UUID"
        varchar customer_id FK
        varchar status "pending, confirmed, shipped, delivered, cancelled"
        decimal total "10,2"
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER_ITEMS {
        varchar id PK "UUID"
        varchar order_id FK
        varchar product_id FK
        int quantity
        decimal price "10,2 - Price at time of order"
        timestamp created_at
    }
    
    %% Invoice Management
    INVOICES {
        varchar id PK "UUID"
        varchar order_id FK
        varchar invoice_number UK
        decimal amount "10,2"
        varchar status "pending, sent, paid, overdue, cancelled"
        date due_date
        timestamp created_at
        timestamp updated_at
    }
    
    %% Services
    SERVICES {
        varchar id PK "UUID"
        varchar name
        text description
        decimal price "10,2"
        int duration "Duration in minutes"
        boolean is_active "Default true"
        timestamp created_at
        timestamp updated_at
    }
    
    %% Content Management System
    CONTENT_TYPES {
        varchar id PK "UUID"
        varchar name UK "page, blog, product, service, faq"
        text description
        timestamp created_at
    }
    
    CONTENT {
        varchar id PK "UUID"
        varchar title
        varchar slug UK "URL-friendly identifier"
        text content "HTML/Markdown content"
        varchar type_id FK
        boolean published "Default false"
        varchar author_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    %% Relationships
    USERS ||--|| PROFILES : "has profile"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "can have reset tokens"
    USERS ||--o{ CUSTOMERS : "may be linked to customer"
    USERS ||--o{ CONTENT : "authors content"
    
    ROLES ||--o{ PROFILES : "assigned to profiles"
    
    CUSTOMERS ||--o{ ORDERS : "places orders"
    
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "contains products"
    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : "has subcategories"
    
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    PRODUCTS ||--o{ INVENTORY : "stocked in warehouses"
    
    WAREHOUSES ||--o{ INVENTORY : "stores inventory"
    
    ORDERS ||--o{ ORDER_ITEMS : "contains items"
    ORDERS ||--|| INVOICES : "generates invoice"
    
    CONTENT_TYPES ||--o{ CONTENT : "categorizes content"
```

## Entity Descriptions

### User Management

#### USERS
Core authentication table replacing Supabase auth.users
- **id**: UUID primary key
- **email**: Unique email address for login
- **password_hash**: BCrypt hashed password
- **email_verified**: Email verification status

#### ROLES
Role-based access control system
- **Roles**: admin, manager, sales, inventory, customer
- **admin**: Full system access
- **manager**: Access to most features except system settings
- **sales**: Customer and order management
- **inventory**: Product and inventory management
- **customer**: Self-service portal access

#### PROFILES
Extended user information and role assignment
- Links to USERS table (1:1 relationship)
- Contains personal information and role assignment
- Separate from USERS for flexibility

#### PASSWORD_RESET_TOKENS
Secure password reset functionality
- Time-limited tokens for password reset
- Single-use tokens with expiration

### Customer Management

#### CUSTOMERS
Customer relationship management
- Complete contact information
- Optional link to user account for self-service
- Notes field for sales team annotations

### Product Catalog

#### PRODUCT_CATEGORIES
Hierarchical product categorization
- Self-referencing for subcategories
- URL-friendly slugs for e-commerce

#### PRODUCTS
Solar product catalog
- SKU-based inventory tracking
- Category association
- Active/inactive status for lifecycle management

### Inventory Management

#### WAREHOUSES
Multi-location inventory support
- Physical warehouse locations
- Address information for shipping calculations

#### INVENTORY
Product stock levels by warehouse
- Current quantity tracking
- Minimum quantity thresholds for reorder alerts
- Unique constraint on product-warehouse combination

### Order Management

#### ORDERS
Sales order tracking
- Customer association
- Status workflow: pending → confirmed → shipped → delivered
- Total amount calculation

#### ORDER_ITEMS
Individual line items within orders
- Product association with quantity
- Price at time of order (historical pricing)

### Invoice Management

#### INVOICES
Billing and payment tracking
- One-to-one relationship with orders
- Invoice numbering system
- Due date tracking
- Status workflow: pending → sent → paid

### Services

#### SERVICES
Installation and maintenance services
- Service catalog with pricing
- Duration tracking for scheduling
- Active/inactive status

### Content Management

#### CONTENT_TYPES
Content categorization system
- **page**: Static website pages
- **blog**: Blog posts and articles
- **product**: Product descriptions
- **service**: Service descriptions
- **faq**: Frequently asked questions

#### CONTENT
CMS content storage
- URL-friendly slugs
- Published/draft status
- Author tracking
- Rich text content support

## Business Rules

### Data Integrity
1. All primary keys use UUID for security and distribution
2. Foreign key constraints maintain referential integrity
3. Unique constraints prevent duplicate data
4. Timestamps track creation and modification

### Security
1. Passwords stored as BCrypt hashes
2. Email verification required for user accounts
3. Role-based access control
4. Secure password reset tokens

### Inventory Management
1. Inventory tracked per warehouse
2. Minimum quantity thresholds for reorder alerts
3. Product-warehouse combinations must be unique

### Order Processing
1. Orders must have associated customers
2. Order items preserve historical pricing
3. Invoices generated from orders
4. Status workflows enforce business processes

### Content Management
1. Content requires author attribution
2. Slug uniqueness for SEO
3. Published status controls visibility
4. Content type categorization

## Indexes

Performance optimization indexes are created for:
- Customer email lookups
- Product SKU searches
- Inventory queries by product/warehouse
- Order queries by customer/status
- Content queries by type/author
- Password reset token lookups

## Future Enhancements

Potential additions to the data model:
1. **Quotes/Estimates** - Pre-order pricing
2. **Payments** - Payment transaction tracking
3. **Shipping** - Delivery tracking
4. **Appointments** - Service scheduling
5. **Documents** - File attachments
6. **Audit Logs** - Change tracking
7. **Notifications** - System alerts
8. **Reports** - Saved report configurations
