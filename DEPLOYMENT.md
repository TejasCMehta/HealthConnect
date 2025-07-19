# HealthConnect Clinic - Deployment Guide

## 🚀 Render Deployment

This application is ready for deployment on Render.com with the following features:

### ✅ Features Ready for Production

- **Mobile Responsive**: Tailwind CSS with responsive breakpoints
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Appointment Management**: Full CRUD operations with drag & drop
- **Resize Functionality**: Appointment duration adjustment
- **Holiday Support**: Configurable clinic holidays
- **Authentication**: JWT-based user authentication
- **Data Persistence**: JSON-based database

### 📱 Mobile Responsiveness

- Responsive sidebar that collapses on mobile
- Adaptive appointment forms (`w-full sm:w-96`)
- Mobile-friendly navigation (`flex-col sm:flex-row`)
- Touch-friendly drag & drop functionality
- Responsive calendar views

### 🌙 Dark Mode Features

- System preference detection
- Manual toggle (Light → Dark → System)
- Persistent theme settings in localStorage
- Dark mode classes throughout the UI (`dark:bg-gray-800`, etc.)

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Render will automatically detect the `render.yaml` configuration
4. The build will run: `npm install && npm run build:prod`
5. The app will start with: `npm start`

### Option 2: Manual Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `npm install && npm run build:prod`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (auto-generate or use your own)

### Environment Variables

- `NODE_ENV`: Set to `production`
- `JWT_SECRET`: Secure secret for JWT token signing
- `PORT`: Automatically set by Render

### Build Process

1. `npm install` - Install all dependencies
2. `ng build --configuration production` - Build Angular app for production
3. Static files served from `dist/workspace/`
4. Express server handles both API routes and Angular routing

### Health Check

- Endpoint: `/api/health`
- Returns service status and timestamp
- Used by Render for monitoring

### API Endpoints

- Authentication: `/auth/*`
- Core API: `/api/*`
- Static files: All other routes serve Angular app

### Database

- Uses JSON file (`db.json`) for data persistence
- Includes sample data for immediate testing
- Holiday configuration: July 29, 2025 configured as test holiday

## Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev        # Angular dev server (port 5000)
npm start         # Express API server (port 8000)

# Build for production
npm run build:prod
```

## Production Features

- Compressed assets and optimized bundles
- Server-side routing for SPA
- CORS enabled for cross-origin requests
- Health monitoring endpoint
- Environment-based configuration

## Troubleshooting

- Ensure Node.js version is compatible (18+)
- Check build logs for any missing dependencies
- Verify environment variables are set
- Health check should return 200 status

Ready for deployment! 🎉
