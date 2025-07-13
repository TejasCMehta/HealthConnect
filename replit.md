# Clinic Portal - Appointment Management System

## Overview

This is a comprehensive clinic appointment booking and management web application built with Angular 19, TailwindCSS, and json-server. The application provides a complete solution for managing medical appointments, patients, doctors, and clinic settings with a modern, responsive interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Angular 19 with standalone components
- **Styling**: TailwindCSS v4.1.11 with dark/light/system theme support
- **State Management**: Angular Signals for reactive state management
- **Routing**: Angular Router with lazy loading and route guards
- **Icons**: Remix Icons for consistent iconography
- **TypeScript**: Strict configuration with path mapping for clean imports

### Backend Architecture
- **Mock Server**: json-server with custom middleware for authentication
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API**: RESTful endpoints with CORS support
- **Database**: JSON file-based storage (db.json) for development/prototyping

## Key Components

### Authentication System
- JWT token-based authentication
- Role-based access control (Admin, Doctor)
- HTTP interceptor for automatic token attachment
- Route guards for protected routes
- Login component with form validation

### Calendar System
- Multiple view modes: Month, Week, Day
- Custom calendar components with navigation
- Appointment cards with color coding
- Drag-and-drop functionality (planned)
- Time slot management
- Appointment popover for quick actions
- Sliding form sidebar for appointment creation/editing

### Patient Management
- Full CRUD operations
- Search and filtering capabilities
- Pagination support
- Card and table view modes
- Patient form with validation
- Bulk operations support

### Doctor Management
- Doctor profiles with specialties
- Color-coded doctor assignments
- Specialty filtering
- Doctor form with predefined specialty options
- Admin-only access control

### Settings Management
- Working hours configuration
- Holiday management
- Theme preferences
- Clinic configuration options

## Data Flow

1. **Authentication Flow**:
   - User login → JWT token generation → Token storage → Automatic API authentication
   - Role-based menu rendering and route protection

2. **Calendar Flow**:
   - Date selection → API calls for appointments → Calendar rendering → User interactions
   - View switching maintains date context across views

3. **CRUD Operations**:
   - Form submission → API call → Success/error handling → UI updates → Data refresh

4. **Theme Management**:
   - Theme selection → Local storage → CSS class updates → System preference detection

## External Dependencies

### Core Dependencies
- **@angular/**: Core Angular framework and modules
- **tailwindcss**: Utility-first CSS framework
- **rxjs**: Reactive programming library
- **zone.js**: Change detection mechanism

### Backend Dependencies
- **json-server**: Mock REST API server
- **express**: Web framework for custom middleware
- **jsonwebtoken**: JWT token handling
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing

### Development Dependencies
- **typescript**: Type safety and modern JavaScript features
- **@angular/cli**: Angular development tools

## Deployment Strategy

### Development Environment
- **Frontend**: Angular development server (ng serve)
- **Backend**: json-server with custom middleware (node server.js)
- **Database**: JSON file (db.json) for rapid prototyping

### Production Considerations
- Frontend build optimization with Angular CLI
- Environment-specific configurations
- API endpoint configuration
- Static asset optimization
- Bundle size monitoring

### Current Setup
- Single package.json for both frontend and backend
- Shared dependencies for simplified development
- Custom server.js wrapping json-server with authentication middleware
- TailwindCSS configuration for comprehensive file watching

## Key Features

### User Interface
- Mobile-first responsive design
- Dark/light/system theme support
- Consistent icon usage with Remix Icons
- Modern component architecture with Angular standalone components
- Accessible form controls and navigation

### Calendar Features
- Multiple view modes with synchronized navigation
- Appointment conflict detection
- Time slot validation
- Past appointment restrictions
- Holiday and working hours integration

### Data Management
- Real-time data synchronization
- Optimistic UI updates
- Error handling and user feedback
- Form validation and sanitization

### Security
- JWT-based authentication
- Role-based authorization
- HTTP interceptor for secure API calls
- Input validation and sanitization

This architecture provides a solid foundation for a clinic management system with room for expansion to include additional features like reporting, billing, and integration with external medical systems.