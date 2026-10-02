# Enterprise Leave Management System

A modern, enterprise-grade leave management application built with SharePoint Framework (SPFx), React, and TypeScript. This system enables employees to apply for leaves, allows managers to approve/reject requests, and provides comprehensive analytics and leave balance tracking.

## 🎯 Features

### For Employees

- **Apply for Leave**: Intuitive form with date picker, leave type selection, and reason
- **Leave Balance Tracking**: Real-time view of available and used leaves by type
- **Leave History**: Complete history of all leave applications with status
- **My Leave History**: Personal leave history page with filters, search, CSV export and a per-request timeline
- **Holiday Calendar**: Full-year holiday calendar with day highlighting, upcoming holidays and countdown
- **Leave Policy**: Reference page covering allowances, half-day rules, approvals and cancellation
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
   - HalfDayType (Single line - None/FirstHalf/SecondHalf)
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

   **Holidays List** (Name: "Holidays")
   - Title (Single line - holiday name)
   - Date (Date)
   - Description (Multiple lines - optional)
   - HolidayType (Single line - Public/Restricted/Company, optional)

   > The Holidays list powers the Holiday Calendar page and is excluded
   > automatically when leave days are calculated. If the list is missing (or
   > empty) the app falls back to the built-in 2026 calendar in
   > `utils/constants.ts`, so nothing breaks - but the dates will be wrong from
   > 2027 onwards until the list is created.

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
- **Password**: Legacy demo login only - see the warning below
- **Role**: Admin, Manager, or Employee
- Credentials are stored in session storage

> ⚠️ **The password login is not real authentication.** It compares a
> plaintext password column in the Employees list, and the `Password` column is
> never returned to the browser when reading employees. Employee records created
> through the admin form have no password set at all, so they can only sign in
> via Microsoft login. Treat password login as a development convenience and
> move everyone to Microsoft login before this goes anywhere real.

### Permissions

| Capability | Employee | Manager | Admin |
|---|---|---|---|
| Apply for leave, own history, calendar, policy | Yes | Yes | Yes |
| Approve / reject team leave requests | No | Yes | Yes |
| Add, edit and delete employee records | No | **No** | Yes |
| Add, edit and delete holidays | No | No | Yes |

Employee record management is Admin only - Managers keep their leave-approval
rights but get no employee record buttons.

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

### MyLeaveHistory Component

- Personal leave history, scoped to the signed-in employee
- Summary cards (total, approved, pending, rejected, days taken)
- Search, status / leave type / year filters and sortable columns
- Paginated table with a detail modal showing the request timeline
- CSV export and cancel-pending-request action

### HolidayCalendar Component

- 12-month year grid with holiday days highlighted by type
- Year selector, "today" jump, and click-to-inspect on any holiday
- Sidebar with upcoming holidays and a day countdown
- **Admin-only** add / edit / delete, writing straight to the "Holidays" list
- Duplicate dates are blocked, since the grid can only show one holiday per day
- Backed by the "Holidays" SharePoint list, with a built-in fallback calendar

### LeavePolicy Component

- Allowances table generated from `LEAVE_TYPES` in `constants.ts`
- Guidance on accrual, half days, approvals, cancellation and exceptions
- Content lives in `utils/leavePolicy.ts` so wording can be edited as data

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
- `getLeaveBalance(email, holidayDates?)` - Calculate balance
- `getHolidays()` - Read the "Holidays" list
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

### Querying SharePoint Safely

Every value interpolated into a `$filter` string must go through
`escapeOData()` in `services/SPService.ts`, which doubles single quotes as the
OData spec requires:

```typescript
.items.filter(`Email eq '${escapeOData(email)}'`)
```

Without it, a user-typed value like `' or '1'='1` closes the string literal and
rewrites the filter. That was exploitable on the login endpoint and returned an
Admin session to anyone who reached the page.

Two related rules when adding queries:

- **Never `select("*")` on a list that holds sensitive columns.** Employee reads
  go through the `EMPLOYEE_FIELDS` constant, which excludes `Password`.
- **Only write fields the calling form actually owns.** `updateEmployee` omits
  `Password` entirely rather than passing an `undefined` that happens to be
  dropped by `JSON.stringify` - that behaviour is one refactor away from wiping
  every employee's password.

### Update Holidays

Admins manage holidays from the **Holiday Calendar** page - "Add Holiday" in
the toolbar, or select any holiday and use Edit / Delete. Changes are written to
the "Holidays" SharePoint list, so they apply to everyone at once.

The built-in fallback calendar in `utils/constants.ts` (`COMPANY_HOLIDAYS`) is
only used when the list is missing or empty. Keep it in step if you deploy
without creating the list.

> Members without list edit permissions see the "Add Holiday" button greyed out
> rather than an error - if that happens, check the current user has edit rights
> on the "Holidays" list, not just read.

### Update Leave Policy

All policy wording is data in
`src/webparts/leaveManagement/utils/leavePolicy.ts` - edit the `POLICY_SECTIONS`
array and the page re-renders. The allowance figures are pulled from
`LEAVE_TYPES`, so changing those in `constants.ts` updates the table too.

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

- Ensure lists are created with exact names: "Leaves", "Employees", "Holidays"
- Check list column names match expectations
- Verify user has permissions to lists
- A missing "Holidays" list is non-fatal - the Holiday Calendar shows a notice
  and falls back to the built-in default calendar

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
