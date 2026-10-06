import * as React from "react";
import Swal from "sweetalert2";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import {
  addEmployee,
  deleteEmployee,
  getEmployeeByEmail,
  getEmployees,
  removeEmployeePhoto,
  updateEmployee,
  uploadEmployeePhoto,
} from "../../services/SPService";
import { IEmployee } from "../../interfaces/IEmployee";
import EmployeeForm from "./EmployeeForm";
import EmployeeKpiCard from "./EmployeeKpiCard";
import UserAvatar from "../common/UserAvatar";
import {
  CheckCircleIcon,
  DeleteIcon,
  EditIcon,
  PeopleIcon,
  StarIcon,
} from "./EmployeeIcons";
import { IKPICard, IEmployeeRow } from "./employeeTypes";
import "./employee-page.css";

const EMPLOYEES_PER_PAGE: number = 5;

const EmployeePage = (): JSX.Element => {
  const { user } = React.useContext(AuthContext);
  const [employees, setEmployees] = React.useState<IEmployeeRow[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<
    IEmployeeRow[]
  >([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = React.useState<
    IEmployeeRow | undefined
  >();
  const [actioningId, setActioningId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [roleFilter, setRoleFilter] = React.useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("All");
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const fetchEmployees = React.useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const data = await getEmployees();
      setEmployees(data as IEmployeeRow[]);
    } catch (error) {
      console.error("Error fetching employees:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to fetch employees",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect((): void => {
    fetchEmployees().catch((error) => {
      console.error("Error loading employees:", error);
    });
  }, [fetchEmployees]);

  // Keep filtering client-side so the table, KPI cards, and department options share one data load.
  React.useEffect((): void => {
    let filtered: IEmployeeRow[] = employees;
    const normalizedSearchTerm: string = searchTerm.toLowerCase().trim();

    if (normalizedSearchTerm.length > 0) {
      filtered = filtered.filter((employee) => {
        const name: string = (
          employee.Title ||
          employee.Name ||
          ""
        ).toLowerCase();
        const email: string = (employee.Email || "").toLowerCase();

        return (
          name.indexOf(normalizedSearchTerm) >= 0 ||
          email.indexOf(normalizedSearchTerm) >= 0
        );
      });
    }

    if (roleFilter !== "All") {
      filtered = filtered.filter((employee) => employee.Role === roleFilter);
    }

    if (departmentFilter !== "All") {
      filtered = filtered.filter(
        (employee) => employee.Department === departmentFilter,
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, roleFilter, departmentFilter]);

  // Pagination is derived from the filtered result set to avoid duplicated table state.
  const indexOfLastEmployee: number = currentPage * EMPLOYEES_PER_PAGE;
  const indexOfFirstEmployee: number = indexOfLastEmployee - EMPLOYEES_PER_PAGE;
  const currentEmployees: IEmployeeRow[] = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee,
  );
  const totalPages: number = Math.ceil(
    filteredEmployees.length / EMPLOYEES_PER_PAGE,
  );

  // Build department options from SharePoint data instead of maintaining a separate hard-coded list.
  const departments: string[] = React.useMemo(() => {
    const uniqueDepartments: Set<string> = new Set(
      employees
        .map((employee) => employee.Department || "")
        .filter((department) => department.length > 0),
    );

    return Array.from(uniqueDepartments).sort();
  }, [employees]);

  const getNewHireCount = (): number => {
    const thirtyDaysAgo: Date = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return employees.filter((employee) => {
      if (employee.Created === undefined) {
        return false;
      }

      return new Date(employee.Created) > thirtyDaysAgo;
    }).length;
  };

  const activeEmployeeCount: number = employees.filter(
    (employee) => employee.IsActive !== false,
  ).length;

  const handleSaveEmployee = async (
    employee: IEmployee,
    photoFile?: File,
    photoRemoved?: boolean,
  ): Promise<void> => {
    setActioningId(-1);

    try {
      let employeeId: number | undefined;

      if (editingEmployee !== undefined) {
        await updateEmployee(editingEmployee.Id, employee);
        employeeId = editingEmployee.Id;
        await Swal.fire({
          title: "Success!",
          text: "Employee updated successfully",
          icon: "success",
          confirmButtonColor: "#2563eb",
          heightAuto: false,
        });
      } else {
        await addEmployee(employee);
        // The add response shape varies between PnP versions,
        // so look the record back up to get its id for the
        // photo upload.
        const created = await getEmployeeByEmail(employee.Email);
        employeeId = created?.Id;
        await Swal.fire({
          title: "Success!",
          text: "Employee added successfully",
          icon: "success",
          confirmButtonColor: "#2563eb",
          heightAuto: false,
        });
      }

      // Photos are handled after the record is saved so a
      // photo failure never rolls back the employee change.
      if (employeeId !== undefined) {
        try {
          if (photoFile !== undefined) {
            await uploadEmployeePhoto(employeeId, photoFile);
          } else if (photoRemoved) {
            await removeEmployeePhoto(employeeId);
          }
        } catch (photoError) {
          console.error("Error saving employee photo:", photoError);
          await Swal.fire({
            title: "Warning",
            text: "Employee saved, but the photo could not be updated. Check that you have Contribute access to the EmployeePhotos library.",
            icon: "warning",
            confirmButtonColor: "#2563eb",
            heightAuto: false,
          });
        }
      }

      setEditingEmployee(undefined);
      await fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to save employee",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleEditEmployee = (employee: IEmployeeRow): void => {
    // SharePoint stores employee display names in Title; the form edits that value through Name.
    setEditingEmployee({
      ...employee,
      Name: employee.Title || employee.Name || "",
    });
    setModalOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: number): Promise<void> => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete Employee?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      heightAuto: false,
    });

    if (!isConfirmed) {
      return;
    }

    setActioningId(employeeId);

    try {
      await deleteEmployee(employeeId);
      await Swal.fire({
        title: "Deleted!",
        text: "Employee has been removed.",
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
      await fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to delete employee",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setActioningId(null);
    }
  };

  // Add, edit and delete of employee records is Admin only. Managers keep their
  // leave-approval rights but no longer get the employee record buttons.
  const isAdmin: boolean = user?.Role === "Admin";
  const hasActiveFilters: boolean =
    searchTerm.length > 0 || roleFilter !== "All" || departmentFilter !== "All";

  const kpiCards: IKPICard[] = [
    {
      label: "Total Employees",
      value: employees.length,
      color: "blue",
      icon: <PeopleIcon />,
    },
    {
      label: "New Hires (30d)",
      value: getNewHireCount(),
      color: "green",
      icon: <StarIcon />,
    },
    {
      label: "Active Employees",
      value: activeEmployeeCount,
      color: "purple",
      icon: <CheckCircleIcon />,
    },
  ];

  return (
    <MainLayout>
      <div className="pageHeader">
        <h1 className="pageTitle">Employee Management</h1>
        <p className="pageSubtitle">
          Manage your team members and their details
        </p>
      </div>

      <div className="kpiGrid">
        {kpiCards.map((card) => (
          <EmployeeKpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="panel employeePanel">
        <div className="panelHeader">
          <h2 className="panelTitle">Employee List</h2>
          {isAdmin && (
            <button
              className="btnPrimary"
              onClick={() => {
                setEditingEmployee(undefined);
                setModalOpen(true);
              }}
            >
              + Add Employee
            </button>
          )}
        </div>

        <div className="filterSection">
          <div className="searchBox">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="searchInput"
            />
          </div>

          <div className="filters">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="filterSelect"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="filterSelect"
            >
              <option value="All">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loadingContainer">
            <div className="spinner" />
            <p>Loading employees...</p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="tableWrapper">
            <table className="employeeTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map((employee) => (
                  <tr key={employee.Id}>
                    <td className="nameCell">
                      <UserAvatar
                        name={employee.Title || employee.Name}
                        email={employee.Email}
                        imageUrl={employee.EmployeeImage}
                        size={32}
                      />
                      <span>{employee.Title || employee.Name || "-"}</span>
                    </td>
                    <td>{employee.Email}</td>
                    <td>{employee.Department || "-"}</td>
                    <td>
                      <span
                        className={`badge badge-${employee.Role.toLowerCase()}`}
                      >
                        {employee.Role}
                      </span>
                    </td>
                    <td style={{ width: "200px" }}>
                      {employee.Manager || "-"}
                    </td>
                    <td>
                      <span
                        className={`statusBadge ${
                          employee.IsActive !== false ? "active" : "inactive"
                        }`}
                      >
                        {employee.IsActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="actionsCell">
                        <button
                          className="iconBtn editBtn"
                          onClick={() => handleEditEmployee(employee)}
                          disabled={actioningId !== null}
                          title="Edit Employee"
                          aria-label="Edit employee"
                        >
                          <EditIcon />
                        </button>

                        <button
                          className="iconBtn deleteBtn"
                          onClick={() => {
                            handleDeleteEmployee(employee.Id).catch((error) => {
                              console.error("Error deleting employee:", error);
                            });
                          }}
                          disabled={
                            actioningId !== null || employee.IsActive === false
                          }
                          title="Delete Employee"
                          aria-label="Delete employee"
                        >
                          {actioningId === employee.Id ? "..." : <DeleteIcon />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                className="paginationBtn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              <span className="paginationInfo">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="paginationBtn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyIcon" aria-hidden="true">
              Users
            </div>
            <p className="emptyTitle">No employees found</p>
            <p className="emptyDescription">
              {hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Start by adding your first employee"}
            </p>
          </div>
        )}
      </div>

      <EmployeeForm
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEmployee(undefined);
        }}
        onSubmit={handleSaveEmployee}
        isLoading={actioningId !== null}
        editingEmployee={editingEmployee}
        employees={employees}
      />
    </MainLayout>
  );
};

export default EmployeePage;
