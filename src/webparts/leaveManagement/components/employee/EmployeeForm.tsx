import * as React from "react";
import { IEmployee } from "../../interfaces/IEmployee";
import { IEmployeeRow } from "./employeeTypes";
import { DEPARTMENTS } from "../../utils/constants";
import UserAvatar from "../common/UserAvatar";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface IEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    employee: IEmployee,
    photoFile?: File,
    photoRemoved?: boolean,
  ) => Promise<void>;
  isLoading: boolean;
  editingEmployee?: IEmployeeRow;
  employees: IEmployeeRow[];
}

const emptyEmployee: IEmployee = {
  Name: "",
  Email: "",
  Password: "",
  Department: "",
  Role: "Employee",
  Manager: "",
};

const EmployeeForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingEmployee,
  employees,
  // eslint-disable-next-line @rushstack/no-new-null
}: IEmployeeFormProps): JSX.Element | null => {
  const [formData, setFormData] = React.useState<IEmployee>(emptyEmployee);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  // Photo selection. The file is kept out of formData because
  // it is uploaded separately, after the employee record exists.
  const [photoFile, setPhotoFile] = React.useState<File | undefined>(
    undefined,
  );
  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [photoRemoved, setPhotoRemoved] = React.useState<boolean>(false);
  const [photoError, setPhotoError] = React.useState<string>("");
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const objectUrlRef = React.useRef<string | undefined>(undefined);

  // Release object URLs created for previews.
  React.useEffect((): (() => void) => {
    return () => {
      if (objectUrlRef.current !== undefined) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = undefined;
      }
    };
  }, []);

  React.useEffect((): void => {
    if (editingEmployee !== undefined) {
      setFormData({
        Id: editingEmployee.Id,
        Name: editingEmployee.Name || editingEmployee.Title || "",
        Email: editingEmployee.Email || "",
        Password: editingEmployee.Password || "",
        Department: editingEmployee.Department || "",
        Role: editingEmployee.Role,
        Manager: editingEmployee.Manager || "",
      });
      setPhotoPreview(editingEmployee.EmployeeImage || "");
    } else {
      setFormData(emptyEmployee);
      setPhotoPreview("");
    }

    // Reset any photo picked in a previous open of the form.
    if (objectUrlRef.current !== undefined) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = undefined;
    }
    setPhotoFile(undefined);
    setPhotoRemoved(false);
    setPhotoError("");
    setErrors({});
  }, [editingEmployee, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.Name?.trim()) {
      newErrors.Name = "Name is required";
    }

    if (!formData.Email?.trim()) {
      newErrors.Email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Invalid email format";
    } else if (
      editingEmployee === undefined &&
      employees.some(
        (employee) =>
          employee.Email.toLowerCase() === formData.Email.toLowerCase(),
      )
    ) {
      newErrors.Email = "An employee with this email already exists";
    }

    if (editingEmployee === undefined && !formData.Password?.trim()) {
      newErrors.Password = "Password is required";
    }

    if (!formData.Department?.trim()) {
      newErrors.Department = "Department is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const managerOptions = employees.filter(
    (employee) =>
      employee.Role === "Manager" &&
      employee.IsActive !== false &&
      employee.Email !== editingEmployee?.Email,
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name] !== undefined) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];

    // Reset so the same file can be picked again.
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }

    if (!file) {
      return;
    }

    if (PHOTO_MIME_TYPES.indexOf(file.type) === -1) {
      setPhotoError("Only JPG, PNG or WebP images are supported.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError("Photo must be smaller than 5 MB.");
      return;
    }

    if (objectUrlRef.current !== undefined) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    objectUrlRef.current = preview;
    setPhotoFile(file);
    setPhotoPreview(preview);
    setPhotoRemoved(false);
    setPhotoError("");
  };

  const handlePhotoRemove = (): void => {
    if (objectUrlRef.current !== undefined) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = undefined;
    }

    setPhotoFile(undefined);
    setPhotoPreview("");
    // Only meaningful for an existing employee that has a photo on record.
    setPhotoRemoved(
      editingEmployee !== undefined &&
        Boolean(editingEmployee.EmployeeImage),
    );
    setPhotoError("");
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (validateForm()) {
      await onSubmit(formData, photoFile, photoRemoved);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">
            {editingEmployee !== undefined
              ? "Edit Employee"
              : "Add New Employee"}
          </h2>
          <button
            className="modalCloseBtn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modalForm">
          <div className="formGroup photoFormGroup">
            <span className="formLabel">Photo</span>
            <div className="photoPickerRow">
              <UserAvatar
                name={formData.Name}
                email={formData.Email}
                imageUrl={photoPreview}
                size={64}
                className="formPhoto"
              />
              <div className="photoPickerActions">
                <input
                  ref={photoInputRef}
                  id="employeePhotoInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="photoInput"
                  onChange={handlePhotoChange}
                  disabled={isLoading}
                />
                <label htmlFor="employeePhotoInput" className="btnSecondary">
                  Change photo
                </label>
                {(photoPreview || editingEmployee?.EmployeeImage) && (
                  <button
                    type="button"
                    className="btnGhost"
                    onClick={handlePhotoRemove}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                )}
                <span className="hintText">JPG, PNG or WebP, max 5 MB</span>
                {photoError && (
                  <span className="errorText">{photoError}</span>
                )}
              </div>
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="Name" className="formLabel">
              Name *
            </label>
            <input
              id="Name"
              type="text"
              name="Name"
              value={formData.Name || ""}
              onChange={handleChange}
              className={`formInput ${errors.Name !== undefined ? "error" : ""}`}
              disabled={isLoading}
            />
            {errors.Name !== undefined && (
              <span className="errorText">{errors.Name}</span>
            )}
          </div>

          <div className="formGroup">
            <label htmlFor="Email" className="formLabel">
              Email *
            </label>
            <input
              id="Email"
              type="email"
              name="Email"
              value={formData.Email || ""}
              onChange={handleChange}
              className={`formInput ${errors.Email !== undefined ? "error" : ""}`}
              disabled={isLoading || editingEmployee !== undefined}
            />
            {errors.Email !== undefined && (
              <span className="errorText">{errors.Email}</span>
            )}
          </div>

          {editingEmployee === undefined && (
            <div className="formGroup">
              <label htmlFor="Password" className="formLabel">
                Password *
              </label>
              <input
                id="Password"
                type="password"
                name="Password"
                value={formData.Password || ""}
                onChange={handleChange}
                className={`formInput ${
                  errors.Password !== undefined ? "error" : ""
                }`}
                disabled={isLoading}
              />
              {errors.Password !== undefined && (
                <span className="errorText">{errors.Password}</span>
              )}
            </div>
          )}

          <div className="formGroup">
            <label htmlFor="Department" className="formLabel">
              Department *
            </label>
            <select
              id="Department"
              name="Department"
              value={formData.Department}
              onChange={handleChange}
              className={`formInput ${
                errors.Department !== undefined ? "error" : ""
              }`}
              disabled={isLoading}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            {errors.Department !== undefined && (
              <span className="errorText">{errors.Department}</span>
            )}
          </div>

          <div className="formGroup">
            <label htmlFor="Role" className="formLabel">
              Role
            </label>
            <select
              id="Role"
              name="Role"
              value={formData.Role}
              onChange={handleChange}
              className="formInput"
              disabled={isLoading}
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="Manager" className="formLabel">
              Manager
            </label>
            <select
              id="Manager"
              name="Manager"
              value={formData.Manager || ""}
              onChange={handleChange}
              className="formInput"
              disabled={isLoading}
            >
              <option value="">No manager assigned</option>
              {managerOptions.map((manager) => (
                <option key={manager.Email} value={manager.Email}>
                  {manager.Title || manager.Name || manager.Email}
                </option>
              ))}
            </select>
          </div>

          <div className="modalFooter">
            <button
              type="button"
              className="btnSecondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btnPrimary" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : editingEmployee !== undefined
                  ? "Update Employee"
                  : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
