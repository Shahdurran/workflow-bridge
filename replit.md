# WorkflowBridge - AI-Powered Workflow Automation Builder

## Overview

WorkflowBridge is an AI-powered workflow automation builder and migration tool designed as a single-page React application. The system enables users to create, visualize, and export workflow automations through a conversational chat interface. It serves as a bridge between different automation platforms (Zapier, Make, n8n) with intelligent migration capabilities and a visual workflow editor.

The application provides an intuitive chat-based interface for building automations, real-time visual workflow representation, platform-specific export functionality, and template management with import/export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: React hooks with local state, React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript throughout the entire stack for consistency
- **API Design**: RESTful endpoints for workflow and chat message operations
- **Storage**: In-memory storage implementation with interface for future database integration
- **Development**: Hot module replacement via Vite integration for seamless development

### Component Structure
- **Chat System**: Conversational interface with message bubbles, typing indicators, and quick actions
- **Workflow Canvas**: Visual node-based editor for representing automation flows
- **Template System**: Pre-built workflow templates organized by category (Marketing, Sales, Productivity, E-commerce)
- **Migration Tools**: Import/export functionality for cross-platform workflow conversion
- **Platform Integration**: Support for Zapier, Make, and n8n with platform-specific formatting

### Data Models
- **Workflows**: Core entity containing name, description, platform, nodes, and connections
- **Chat Messages**: Conversation history with role-based messaging (user/assistant)
- **Workflow Nodes**: Individual automation steps with type classification (trigger/action/logic)
- **Templates**: Pre-configured workflows with categorization and complexity indicators

### AI Simulation Layer
- **Pattern Matching**: Rule-based response system simulating AI conversation flow
- **Workflow Generation**: Dynamic node and connection creation based on user input
- **Platform Adaptation**: Context-aware responses tailored to selected automation platform
- **Template Suggestions**: Intelligent recommendations based on user requirements

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for modern React development
- **TypeScript**: Full TypeScript support across client and server
- **Vite**: Build tool with React plugin and development server integration

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Radix UI**: Headless component primitives for accessible UI components
- **shadcn/ui**: Pre-built component library built on Radix UI primitives
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Additional icon sets for platform-specific branding

### Database and Persistence
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Neon Database**: Serverless PostgreSQL database connection
- **Drizzle Kit**: Database migration and schema management tools

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution for development server
- **Replit Integration**: Development environment specific plugins and utilities

### Validation and Forms
- **Zod**: Schema validation for runtime type checking
- **React Hook Form**: Form state management with validation integration
- **Drizzle Zod**: Integration between Drizzle schemas and Zod validation

### Additional Libraries
- **Wouter**: Lightweight routing solution for single-page application
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **Date-fns**: Date manipulation and formatting utilities
- **Embla Carousel**: Touch-friendly carousel component for template browsing