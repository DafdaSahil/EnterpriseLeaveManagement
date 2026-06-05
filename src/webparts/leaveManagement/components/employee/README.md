# Employee Feature

This folder is organized as a small feature module:

- `EmployeePage.tsx` owns SharePoint data loading, filters, pagination, and employee actions.
- `EmployeeForm.tsx` contains the add/edit modal and field validation.
- `EmployeeKpiCard.tsx` renders the reusable KPI summary card.
- `EmployeeIcons.tsx` keeps inline SVG icons out of page logic.
- `EmployeeList.tsx` remains as a route-compatible wrapper for the employee page.
- `employeeTypes.ts` contains employee feature-only view models.

Keep new employee-specific UI in this folder. Shared services, interfaces, layout, and utilities should stay in their existing top-level folders under `leaveManagement`.
