# QR Code Studio - Enhanced QR Generator

## Overview

QR Code Studio is a modern, full-stack web application for creating and managing QR codes with advanced customization features. The application provides a user-friendly interface for generating QR codes with custom styling, analytics tracking, and shareable links.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, utilizing a modern component-based architecture:
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
The backend follows a RESTful API design using Express.js:
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for HTTP server and API routes
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation
- **File Handling**: Multer for image uploads (logos, overlays)

### Database Design
PostgreSQL database with two main tables:
- **qr_codes**: Stores QR code data, customization settings, and shareable links
- **analytics**: Tracks user interactions and usage statistics

## Key Components

### QR Code Generation
- Custom QR code generator class handling matrix generation and error correction
- Support for multiple content types: text, URLs, vCards, WiFi credentials, phone numbers, email, SMS
- Real-time preview with customizable colors, sizes, and overlay text
- Logo/emoji overlay support with proper positioning

### Data Storage Strategy
Hybrid storage approach for optimal performance:
- **IndexedDB**: Client-side storage for user history and offline capabilities
- **PostgreSQL**: Server-side storage for shareable QR codes and analytics
- **Memory Storage**: Fallback implementation for development/testing

### Export Capabilities
Multiple export formats supported:
- **PNG**: Canvas-based raster export with custom dimensions
- **SVG**: Vector format export for scalable graphics
- **Direct download**: Browser-based file download without server involvement

### Analytics System
Comprehensive tracking system:
- Event tracking (create, view, download, share)
- Content type distribution analysis
- Usage statistics and trends
- Privacy-focused implementation with no personal data collection

## Data Flow

### QR Code Creation Flow
1. User inputs content and customization settings
2. Client-side QR generator creates matrix data
3. Real-time preview renders in canvas
4. On save: data stored locally in IndexedDB
5. On share: data sent to server, shareable link generated

### Sharing Flow
1. QR code data posted to `/api/qr` endpoint
2. Server validates data using Zod schemas
3. Unique share ID generated and stored in database
4. Analytics event tracked for creation
5. Shareable URL returned to client

### Analytics Flow
1. User interactions trigger event tracking
2. Events stored both locally (IndexedDB) and server-side
3. Aggregated analytics computed on-demand
4. Dashboard displays usage statistics and trends

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible component primitives for UI

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **Vite**: Build tool with TypeScript support
- **ESBuild**: Fast JavaScript bundler for production builds

### UI Framework
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- TypeScript compilation with strict type checking
- Replit integration for cloud-based development

### Production Build
- Frontend: Static assets built and served from Express
- Backend: TypeScript compiled to JavaScript using ESBuild
- Database: PostgreSQL with connection pooling via Neon

### Environment Configuration
- Database URL configuration via environment variables
- Graceful fallback to memory storage if database unavailable
- Separate development and production build processes

The application is designed to be platform-agnostic with containerization support and can be deployed to various hosting providers including Vercel, Netlify, or traditional VPS environments.