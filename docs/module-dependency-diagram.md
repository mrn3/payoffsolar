# Payoff Solar - Module Dependency Diagram

This document contains the module dependency diagram for the Payoff Solar application, showing the relationships between all components, services, and layers.

## Architecture Overview

The Payoff Solar application follows a layered architecture with clear separation of concerns:

- **External Dependencies** - Third-party services and libraries
- **Core Infrastructure** - Database connections and configuration
- **Data Layer** - Models and data access
- **Business Logic** - Authentication, email, and core services
- **API Layer** - REST endpoints and server actions
- **Application Layer** - Pages, layouts, and routing
- **UI Components** - Reusable interface components

## Mermaid Diagram

```mermaid
graph TD
    %% External Dependencies
    subgraph "External Dependencies"
        MySQL[(MySQL Database)]
        SendGrid[SendGrid Email Service]
        NextJS[Next.js Framework]
        React[React]
        TailwindCSS[Tailwind CSS]
        Zod[Zod Validation]
        JWT[JWT Tokens]
        BCrypt[BCrypt Hashing]
    end

    %% Core Infrastructure Layer
    subgraph "Core Infrastructure"
        ENV[Environment Variables<br/>(.env.local)]
        DB[Database Connection<br/>(mysql/connection.ts)]
        Schema[Database Schema<br/>(mysql/schema.sql)]
        Init[Database Initialization<br/>(mysql/init.ts)]
    end

    %% Data Layer
    subgraph "Data Layer"
        Models[Data Models<br/>(models/index.ts)]
        Customer[Customer Model]
        Product[Product Model]
        User[User Model]
        Order[Order Model]
    end

    %% Business Logic Layer
    subgraph "Business Logic"
        Auth[Authentication<br/>(auth/index.ts)]
        Email[Email Service<br/>(email/index.ts)]
        Actions[Server Actions<br/>(actions/auth.ts)]
    end

    %% API Layer
    subgraph "API Routes"
        AuthAPI[Auth API<br/>(api/auth/*)]
        ContactAPI[Contact API<br/>(api/contact)]
        SignIn[Sign In Route]
        SignUp[Sign Up Route]
        SignOut[Sign Out Route]
        ForgotPW[Forgot Password Route]
    end

    %% Middleware
    Middleware[Middleware<br/>(middleware.ts)]

    %% Application Layer
    subgraph "Application Routes"
        RootLayout[Root Layout<br/>(layout.tsx)]
        
        subgraph "Public Routes"
            PublicLayout[Public Layout<br/>((public)/layout.tsx)]
            HomePage[Home Page<br/>(page.tsx)]
            About[About Page]
            Contact[Contact Page]
        end
        
        subgraph "Auth Routes"
            Login[Login Page<br/>((auth)/login)]
            Register[Register Page<br/>((auth)/register)]
            ForgotPassword[Forgot Password<br/>((auth)/forgot-password)]
            ResetPassword[Reset Password<br/>((auth)/reset-password)]
        end
        
        subgraph "Dashboard Routes"
            DashboardLayout[Dashboard Layout<br/>((dashboard)/layout.tsx)]
            Dashboard[Dashboard Page<br/>((dashboard)/dashboard)]
        end
    end

    %% UI Components
    subgraph "UI Components"
        Header[Header Component]
        Footer[Footer Component]
        RadixUI[Radix UI Components]
        LucideIcons[Lucide React Icons]
        ReactIcons[React Icons]
    end

    %% Dependencies
    ENV --> DB
    MySQL --> DB
    DB --> Schema
    DB --> Init
    DB --> Models
    
    Models --> Customer
    Models --> Product
    Models --> User
    Models --> Order
    
    DB --> Auth
    BCrypt --> Auth
    JWT --> Auth
    Auth --> Actions
    
    SendGrid --> Email
    ENV --> Email
    
    Auth --> AuthAPI
    Models --> ContactAPI
    Zod --> AuthAPI
    Zod --> ContactAPI
    
    AuthAPI --> SignIn
    AuthAPI --> SignUp
    AuthAPI --> SignOut
    AuthAPI --> ForgotPW
    
    JWT --> Middleware
    NextJS --> Middleware
    
    NextJS --> RootLayout
    React --> RootLayout
    TailwindCSS --> RootLayout
    
    RootLayout --> PublicLayout
    RootLayout --> DashboardLayout
    
    PublicLayout --> HomePage
    PublicLayout --> About
    PublicLayout --> Contact
    
    DashboardLayout --> Dashboard
    
    Actions --> Login
    Actions --> Register
    Actions --> ForgotPassword
    Actions --> ResetPassword
    
    Auth --> Dashboard
    
    Header --> PublicLayout
    Footer --> PublicLayout
    Header --> DashboardLayout
    
    RadixUI --> Header
    RadixUI --> Footer
    RadixUI --> Dashboard
    LucideIcons --> Header
    LucideIcons --> Footer
    ReactIcons --> Header
    ReactIcons --> Footer
    
    Middleware --> Login
    Middleware --> Register
    Middleware --> Dashboard
    
    %% Styling
    classDef external fill:#e1f5fe
    classDef infrastructure fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef business fill:#fff3e0
    classDef api fill:#fce4ec
    classDef app fill:#f1f8e9
    classDef ui fill:#e0f2f1
    
    class MySQL,SendGrid,NextJS,React,TailwindCSS,Zod,JWT,BCrypt external
    class ENV,DB,Schema,Init infrastructure
    class Models,Customer,Product,User,Order data
    class Auth,Email,Actions business
    class AuthAPI,ContactAPI,SignIn,SignUp,SignOut,ForgotPW api
    class RootLayout,PublicLayout,HomePage,About,Contact,Login,Register,ForgotPassword,ResetPassword,DashboardLayout,Dashboard,Middleware app
    class Header,Footer,RadixUI,LucideIcons,ReactIcons ui
```

## Layer Descriptions

### 🔵 External Dependencies
- **MySQL Database** - Primary data storage using local MySQL instance
- **SendGrid** - Email service for transactional emails
- **Next.js** - React framework with App Router
- **React** - UI library for component-based architecture
- **Tailwind CSS** - Utility-first CSS framework
- **Zod** - TypeScript-first schema validation
- **JWT** - JSON Web Tokens for authentication
- **BCrypt** - Password hashing library

### 🟣 Core Infrastructure
- **Environment Variables** - Configuration management
- **Database Connection** - MySQL connection pool and query utilities
- **Database Schema** - SQL schema definitions
- **Database Initialization** - Setup and seeding scripts

### 🟢 Data Layer
- **Data Models** - TypeScript interfaces and database operations
- **Customer Model** - Customer management functionality
- **Product Model** - Product catalog operations
- **User Model** - User account management
- **Order Model** - Order processing and tracking

### 🟠 Business Logic
- **Authentication** - User authentication, JWT management, password handling
- **Email Service** - SendGrid integration for email notifications
- **Server Actions** - Next.js server actions for form handling

### 🟡 API Layer
- **Auth API Routes** - Authentication endpoints (signin, signup, signout, forgot password)
- **Contact API** - Contact form submission handling

### 🟢 Application Layer
- **Middleware** - Route protection and authentication checks
- **Layouts** - Shared UI layouts for different route groups
- **Pages** - Individual route components organized by functionality

### 🟢 UI Components
- **Header/Footer** - Navigation and branding components
- **UI Libraries** - Radix UI primitives, Lucide icons, React icons

## Key Design Patterns

1. **Layered Architecture** - Clear separation between data, business logic, and presentation
2. **Dependency Injection** - Services depend on abstractions, not concrete implementations
3. **Route Groups** - Next.js App Router groups for organized routing
4. **Server Actions** - Type-safe server-side form handling
5. **Middleware Protection** - Route-level authentication and authorization

## Maintenance Notes

- Keep this diagram updated when adding new modules or changing dependencies
- Use the Mermaid Live Editor to preview changes: https://mermaid.live/
- Consider breaking down complex modules into smaller, focused components
- Ensure new dependencies follow the established layering principles
