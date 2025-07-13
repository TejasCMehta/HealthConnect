# 🏥 HealthConnect - Clinic Management System

A comprehensive, modern clinic appointment booking and management system built with **Angular 19**, **TypeScript**, and **TailwindCSS**. This application provides a complete solution for healthcare providers to manage appointments, patients, doctors, and clinic operations.

## 🌟 Features

### 📅 **Advanced Calendar Management**

- **Multiple View Modes**: Month, Week, and Day views with seamless navigation
- **Interactive Appointment Cards**: Click to view details, drag to resize appointments
- **Real-time Resize Functionality**: Drag the bottom edge of appointments to extend duration
- **Snap-to-Grid**: Appointments automatically align to 30-minute time slots
- **Conflict Detection**: Prevents overlapping appointments with visual feedback
- **Visual Indicators**: Color-coded appointment statuses and time markers

### 👥 **Patient Management**

- **Complete Patient Profiles**: Demographics, contact information, medical history
- **Advanced Search & Filtering**: Quick patient lookup with multiple criteria
- **Patient History**: Track all appointments and interactions
- **Validation System**: Field-level validation with real-time error feedback

### 👨‍⚕️ **Doctor Management**

- **Doctor Profiles**: Specializations, contact details, availability
- **Appointment Assignment**: Link appointments to specific doctors
- **Availability Tracking**: Prevent double-booking with conflict detection
- **Doctor Dashboard**: View upcoming appointments and patient information

### 🗓️ **Smart Appointment Booking**

- **Intelligent Scheduling**: Working hours enforcement and weekend restrictions
- **Duplicate Prevention**: Patient and doctor-level conflict checking
- **Multiple Duration Options**: 30-minute to multi-hour appointments
- **Status Management**: Scheduled, Completed, Cancelled statuses
- **Confirmation Workflows**: User-friendly confirmation dialogs

### 🔧 **System Settings**

- **Working Hours Configuration**: Customize clinic operating hours
- **Holiday Management**: Set clinic closures and special dates
- **Theme Toggle**: Light and dark mode support
- **User Preferences**: Personalized dashboard settings

### 🎨 **Modern User Interface**

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode Support**: Complete dark theme implementation
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation
- **Animated Feedback**: Smooth transitions and micro-interactions
- **Toast Notifications**: Non-intrusive success and error messages

### 🔐 **Authentication & Security**

- **JWT Authentication**: Secure login and session management
- **Route Guards**: Protected routes with role-based access
- **Password Encryption**: BCrypt integration for secure authentication
- **Session Management**: Automatic logout and token refresh

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Angular CLI** (v19 or higher)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/TejasCMehta/HealthConnect.git
   cd HealthConnect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Start the Angular development server** (optional)

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

The application will be available at `http://localhost:8000`

## 🏗️ Architecture

### **Frontend Stack**

- **Angular 19**: Latest Angular framework with standalone components
- **TypeScript**: Strongly typed JavaScript with modern ES features
- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **RxJS**: Reactive programming with observables
- **Angular Signals**: Modern state management with reactive signals

### **Backend Stack**

- **Express.js**: Node.js web application framework
- **JSON Server**: RESTful API simulation for development
- **JWT**: JSON Web Tokens for authentication
- **BCrypt**: Password hashing and security

### **Project Structure**

```
src/
├── app/                    # App configuration and routing
├── core/                   # Core services and guards
│   ├── auth/              # Authentication services
│   └── services/          # Global services
├── features/              # Feature modules
│   ├── auth/              # Login and authentication
│   ├── calendar/          # Calendar and appointment management
│   ├── dashboard/         # Main dashboard
│   ├── doctors/           # Doctor management
│   ├── patients/          # Patient management
│   └── settings/          # Application settings
├── shared/                # Shared components and utilities
│   ├── components/        # Reusable UI components
│   ├── models/           # TypeScript interfaces
│   └── services/         # Shared services
└── assets/               # Static assets
```

## 🎯 Key Components

### **Calendar System**

- **CalendarComponent**: Main calendar container with view switching
- **MonthViewComponent**: Monthly grid with appointment previews
- **WeekViewComponent**: 7-day view with hourly time slots
- **DayViewComponent**: Detailed single-day view
- **AppointmentCardComponent**: Interactive appointment display
- **AppointmentResizeService**: Handles appointment duration changes

### **Form Management**

- **AppointmentFormComponent**: Smart appointment creation/editing
- **PatientFormComponent**: Patient information management
- **DoctorFormComponent**: Doctor profile management
- **FormValidationService**: Centralized validation logic

### **UI Components**

- **ToasterComponent**: Non-intrusive notification system
- **ConfirmationDialogComponent**: User action confirmations
- **ThemeToggleComponent**: Dark/light mode switching
- **HeaderComponent**: Navigation and user menu
- **SidebarComponent**: Main application navigation

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full-featured experience with drag-and-drop
- **Tablet**: Touch-optimized interface with gesture support
- **Mobile**: Compact views with essential functionality

## 🎨 Theming & Customization

### **Color Schemes**

- **Primary**: Blue (`#3B82F6`) for main actions and highlights
- **Success**: Green (`#10B981`) for confirmations and completed items
- **Warning**: Yellow (`#F59E0B`) for cautions and pending items
- **Error**: Red (`#EF4444`) for errors and critical actions

### **Dark Mode**

Complete dark theme implementation with:

- Automatic system preference detection
- Manual toggle option
- Consistent color scheme across all components
- Accessible contrast ratios

## 🔧 Advanced Features

### **Appointment Resizing**

- **Drag-and-Drop**: Resize appointments by dragging the bottom edge
- **Snap-to-Grid**: Automatic alignment to 30-minute intervals
- **Validation**: Prevents conflicts and enforces clinic hours
- **Visual Feedback**: Real-time preview during resize operations
- **Confirmation**: User confirmation before saving changes

### **Conflict Detection**

- **Real-time Validation**: Immediate feedback during scheduling
- **Multiple Conflict Types**: Patient, doctor, and time-based conflicts
- **Detailed Messages**: Clear explanation of scheduling issues
- **Auto-resolution**: Suggestions for alternative time slots

### **Working Hours Management**

- **Flexible Scheduling**: Configurable clinic hours
- **Weekend Restrictions**: Disable non-working days
- **Holiday Support**: Mark special closure dates
- **Time Slot Generation**: Automatic available time creation

## 🛠️ Development

### **Available Scripts**

- `npm start` - Start the Express server
- `npm run dev` - Start Angular development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests

### **Code Standards**

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Angular Style Guide**: Following official Angular conventions

### **Testing Strategy**

- **Unit Tests**: Component and service testing
- **Integration Tests**: Feature workflow testing
- **End-to-End Tests**: User journey validation

## 🚀 Deployment

### **Production Build**

```bash
npm run build
```

### **Environment Configuration**

- **Development**: Local JSON server with mock data
- **Production**: REST API integration with real backend
- **Environment Variables**: Configurable API endpoints and settings

## 📊 Performance Optimizations

- **Lazy Loading**: Feature modules loaded on demand
- **OnPush Change Detection**: Optimized component updates
- **Signal-based State**: Reactive state management
- **Standalone Components**: Reduced bundle size
- **Tree Shaking**: Unused code elimination

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Guards**: Protected routes with role-based access
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Cross-site request forgery prevention
- **Password Security**: BCrypt hashing with salt

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📖 API Documentation

### **Authentication Endpoints**

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### **Appointment Endpoints**

- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### **Patient Endpoints**

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### **Doctor Endpoints**

- `GET /api/doctors` - List all doctors
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**TejasCMehta**

- GitHub: [@TejasCMehta](https://github.com/TejasCMehta)

## 🙏 Acknowledgments

- Angular team for the amazing framework
- TailwindCSS for the utility-first CSS approach
- The open-source community for various libraries and tools

## 📞 Support

For support, email support@healthconnect.com or join our Slack channel.

---

**HealthConnect** - Streamlining healthcare management with modern technology. 🏥✨
