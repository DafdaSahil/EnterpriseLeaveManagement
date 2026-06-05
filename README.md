# Enterprise Leave Management System

A modern, enterprise-grade leave management application built with SharePoint Framework (SPFx), React, and TypeScript. This system enables employees to apply for leaves, allows managers to approve/reject requests, and provides comprehensive analytics and leave balance tracking.

## 🎯 Features

### For Employees

- **Apply for Leave**: Intuitive form with date picker, leave type selection, and reason
- **Leave Balance Tracking**: Real-time view of available and used leaves by type
- **Leave History**: Complete history of all leave applications with status
- **Dashboard**: Quick overview of leave status and quick action buttons
- **Validation**: Smart validation with business day calculations

### For Managers

- **Request Queue**: View all leave requests from team members
- **Approve/Reject**: Quick actions with optional comments
- **Filtering**: Filter by status (Pending, Approved, Rejected)
- **Analytics**: Overview of team leave statistics

### For Admins

- **Employee Management**: Manage employee records and details
- **Dashboard Analytics**: Organization-wide leave statistics
- **Full Access**: Complete visibility and control

## 🏗️ Architecture

**Tech Stack:**

- **Frontend Framework**: React 17 with TypeScript
- **UI Library**: Fluent UI (Microsoft Design System)
- **State Management**: React Context API
- **Data**: SharePoint Lists via PnP SP
- **Styling**: SCSS modules + CSS
- **Build System**: Gulp (SPFx build pipeline)
- **Notifications**: SweetAlert2

**Project Structure:**

```
src/webparts/leaveManagement/
├── components/
│   ├── auth/               # Login component
│   ├── dashboard/          # Dashboard with stats
│   ├── leave/              # Leave application and list
│   └── employee/           # Employee management
├── context/                # React Context for auth
├── layout/                 # Main layout, sidebar, header
├── services/               # SharePoint service layer
├── interfaces/             # TypeScript interfaces
├── utils/                  # Constants, date, validation utilities
├── styles/                 # Global styles
└── router/                 # Route protection and routing
```

## 🚀 Getting Started

### Prerequisites

- Node.js (18.17.1 - 18.x)
- npm or yarn
- Microsoft 365 tenant with SharePoint
- SPFx development environment

### Installation

1. **Clone and Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure SharePoint Lists** (Required)

   Create three lists in your SharePoint site:

   **Leaves List** (Name: "Leaves")
   - Title (Single line)
   - EmployeeEmail (Single line)
   - LeaveType (Single line - Casual/Sick/Earned/Unpaid/Maternity)
   - StartDate (Date)
   - EndDate (Date)
   - Reason (Multiple lines)
   - Status (Single line - Pending/Approved/Rejected)
   - AppliedDate (Date)
   - ApprovedDate (Date - optional)
   - ApproverComments (Multiple lines - optional)

   **Employees List** (Name: "Employees")
   - Title (Single line - Name)
   - Email (Single line)
   - Department (Single line)
   - Role (Single line - Admin/Manager/Employee)
   - Manager (Single line - Manager email, optional)

3. **Run Development Server**

   ```bash
   npm run serve
   ```

   or

   ```bash
   gulp serve
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📖 Usage Guide

### Login

- **Email**: Use your SharePoint email
- **Password**: Demo password (can be enhanced with actual authentication)
- **Role**: Admin, Manager, or Employee
- Credentials are stored in session storage

### Employee Workflow

1. Go to Dashboard
2. Click "Apply for Leave"
3. Select leave type, dates, and reason
4. Review leave balance
5. Submit request
6. Receive confirmation

### Manager Workflow

1. Navigate to "Leave Requests"
2. View pending requests from team
3. Click "Approve" or "Reject"
4. Add optional comments
5. Request status updates in real-time

### Admin Workflow

1. Access all dashboards and reports
2. Manage employee records
3. View complete leave analytics
4. Generate reports (extensible)

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface inspired by Fluent Design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Subtle transitions and interactions
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
- **Dark Mode Ready**: Built with color-aware styling
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🛠️ Key Components

### ApplyLeave Component

- Date range picker with validation
- Business day calculation
- Real-time balance checking
- Error handling with user feedback

### LeaveList Component

- Filterable leave request queue
- Approve/reject actions with modal dialogs
- Status badges with color coding
- Responsive card layout

### Dashboard Component

- Role-based content (Employee vs Manager)
- Real-time statistics
- Leave balance visualization
- Quick action buttons
- Recent activity feed

### SPService

Comprehensive service layer for SharePoint operations:

- `getLeaves()` - Fetch all leaves
- `getLeavesByEmployee(email)` - Employee's leaves
- `getLeavesByStatus(status)` - Filter by status
- `addLeave()` - Create leave request
- `updateLeave()` - Approve/Reject
- `getLeaveBalance()` - Calculate balance
- `calculateBusinessDays()` - Smart day calculation

## 🔧 Customization

### Modify Leave Types

Edit `src/webparts/leaveManagement/utils/constants.ts`:

```typescript
export const LEAVE_TYPES = [
  { label: "Custom Leave", value: "Custom Leave", daysAllowed: 15 },
  // Add more types...
];
```

### Customize Colors

Update color constants in `constants.ts` or modify CSS variables:

```typescript
export const STATUS_COLORS = {
  Pending: "#your-color",
  Approved: "#your-color",
  Rejected: "#your-color",
};
```

### Add New Validations

Extend `src/webparts/leaveManagement/utils/validation.ts`:

```typescript
export const validateLeaveForm = (formData) => {
  // Add custom validation logic
};
```

## 📚 Learning Resources

This project demonstrates:

1. **SharePoint Framework Development** - Building modern SPFx web parts
2. **React Patterns** - Hooks, Context API, component composition
3. **Form Handling** - Validation, error handling, user feedback
4. **Date Calculations** - Business day calculation, date formatting
5. **Responsive Design** - Mobile-first CSS approach
6. **State Management** - Context API for auth state
7. **Error Handling** - Try-catch, fallbacks, user notifications
8. **TypeScript** - Strict typing for reliability

## 🐛 Troubleshooting

**Build Errors:**

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build artifacts: `npm run clean`

**SharePoint List Not Found:**

- Ensure lists are created with exact names: "Leaves" and "Employees"
- Check list column names match expectations
- Verify user has permissions to lists

**Authentication Issues:**

- Verify SharePoint context is available
- Check session storage for user data
- Ensure correct email format

## 📄 License

THIS CODE IS PROVIDED AS IS WITHOUT WARRANTY OF ANY KIND.

## 🤝 Contributing

Extend and customize as needed for your organization. Some ideas:

- Add email notifications
- Integrate with Microsoft Graph
- Add holiday calendar integration
- Implement approval workflows
- Add department-wise reports
- Mobile app support
