import * as React from "react";
import Swal from "sweetalert2";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import {
  changePassword,
  getEmployeeByEmail,
  removeEmployeePhoto,
  updateOwnProfile,
  uploadEmployeePhoto,
} from "../../services/SPService";
import { IEmployee } from "../../interfaces/IEmployee";
import { DEPARTMENTS } from "../../utils/constants";
import UserAvatar from "../common/UserAvatar";
import "./profile-page.css";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const ProfilePage = (): JSX.Element => {
  const { user, updateUser } = React.useContext(AuthContext);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);

  // Profile fields
  const [name, setName] = React.useState<string>("");
  const [department, setDepartment] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");

  // Photo fields
  const [photoUrl, setPhotoUrl] = React.useState<string>("");
  const [photoSaving, setPhotoSaving] = React.useState<boolean>(false);
  const [photoError, setPhotoError] = React.useState<string>("");
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const fetchProfile = React.useCallback(async (): Promise<void> => {
    if (!user?.Email) return;

    setLoading(true);
    try {
      const employee: IEmployee | undefined = await getEmployeeByEmail(
        user.Email,
      );
      if (employee) {
        setName(employee.Title || employee.Name || "");
        setDepartment(employee.Department || "");
        setEmail(employee.Email || "");
        setRole(employee.Role || "");
        setPhotoUrl(employee.EmployeeImage || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to load your profile",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.Email]);

  React.useEffect((): void => {
    fetchProfile().catch((error) => {
      console.error("Error loading profile:", error);
    });
  }, [fetchProfile]);

  const validateProfile = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.Name = "Name is required";
    }
    if (!department) {
      newErrors.Department = "Department is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) {
      newErrors.CurrentPassword = "Current password is required";
    }
    if (!newPassword) {
      newErrors.NewPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.NewPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      newErrors.ConfirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = event.target;
    if (name === "Name") setName(value);
    if (name === "Department") setDepartment(value);

    if (errors[name] !== undefined) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value } = event.target;
    if (name === "CurrentPassword") setCurrentPassword(value);
    if (name === "NewPassword") setNewPassword(value);
    if (name === "ConfirmPassword") setConfirmPassword(value);

    if (errors[name] !== undefined) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    // Reset so the same file can be picked again.
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }

    if (!file || !user?.Id) return;

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError("Photo must be smaller than 5 MB.");
      return;
    }

    setPhotoError("");
    setPhotoSaving(true);
    try {
      const url = await uploadEmployeePhoto(user.Id, file);
      setPhotoUrl(url);
      updateUser({ EmployeeImage: url });
    } catch (error) {
      console.error("Error uploading photo:", error);
      setPhotoError(
        error instanceof Error ? error.message : "Failed to upload photo.",
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleRemovePhoto = async (): Promise<void> => {
    if (!user?.Id) return;

    setPhotoSaving(true);
    setPhotoError("");
    try {
      await removeEmployeePhoto(user.Id);
      setPhotoUrl("");
      updateUser({ EmployeeImage: undefined });
    } catch (error) {
      console.error("Error removing photo:", error);
      setPhotoError("Failed to remove photo.");
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    if (!validateProfile() || !user?.Id) return;

    setSaving(true);
    try {
      await updateOwnProfile(user.Id, { Name: name, Department: department });
      await Swal.fire({
        title: "Success!",
        text: "Profile updated successfully",
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to update profile",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (!validatePassword() || !user?.Id) return;

    setSaving(true);
    try {
      const success = await changePassword(
        user.Id,
        currentPassword,
        newPassword,
      );

      if (!success) {
        setErrors({ CurrentPassword: "Current password is incorrect" });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});

      await Swal.fire({
        title: "Success!",
        text: "Password changed successfully",
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } catch (error) {
      console.error("Error changing password:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to change password",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="profileLoading">
          <div className="spinner" />
          <p>Loading your profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pageHeader">
        <h1 className="pageTitle">My Profile</h1>
        <p className="pageSubtitle">
          Manage your personal information and account security
        </p>
      </div>

      <div className="profileGrid">
        {/* Profile Information Card */}
        <div className="panel profileCard">
          <div className="panelHeader">
            <h2 className="panelTitle">Profile Information</h2>
          </div>

          <div className="profileBody">
            <div className="photoSection">
              <UserAvatar
                name={name}
                email={email}
                imageUrl={photoUrl}
                size={96}
                className="profilePhoto"
              />
              <div className="photoControls">
                <input
                  ref={photoInputRef}
                  id="profilePhotoInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="photoInput"
                  onChange={handlePhotoChange}
                  disabled={photoSaving}
                />
                <label htmlFor="profilePhotoInput" className="btnSecondary">
                  {photoSaving ? "Saving..." : "Change photo"}
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    className="btnGhost"
                    onClick={handleRemovePhoto}
                    disabled={photoSaving}
                  >
                    Remove
                  </button>
                )}
                <span className="hintText">
                  JPG, PNG or WebP, max 5 MB
                </span>
                {photoError && (
                  <span className="errorText">{photoError}</span>
                )}
              </div>
            </div>

            <div className="formGroup">
              <label htmlFor="profileName" className="formLabel">
                Full Name *
              </label>
              <input
                id="profileName"
                type="text"
                name="Name"
                value={name}
                onChange={handleProfileChange}
                className={`formInput ${
                  errors.Name !== undefined ? "error" : ""
                }`}
                disabled={saving}
              />
              {errors.Name !== undefined && (
                <span className="errorText">{errors.Name}</span>
              )}
            </div>

            <div className="formGroup">
              <label htmlFor="profileEmail" className="formLabel">
                Email
              </label>
              <input
                id="profileEmail"
                type="email"
                value={email}
                className="formInput"
                disabled={true}
              />
              <span className="hintText">Email cannot be changed</span>
            </div>

            <div className="formGroup">
              <label htmlFor="profileDepartment" className="formLabel">
                Department *
              </label>
              <select
                id="profileDepartment"
                name="Department"
                value={department}
                onChange={handleProfileChange}
                className={`formInput ${
                  errors.Department !== undefined ? "error" : ""
                }`}
                disabled={saving}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.Department !== undefined && (
                <span className="errorText">{errors.Department}</span>
              )}
            </div>

            <div className="formGroup">
              <label className="formLabel">Role</label>
              <div className="roleBadge">
                <span className={`badge badge-${role.toLowerCase()}`}>
                  {role}
                </span>
              </div>
              <span className="hintText">Role is managed by your administrator</span>
            </div>

            <div className="formActions">
              <button
                className="btnPrimary"
                onClick={() => {
                  handleSaveProfile().catch(console.error);
                }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="panel profileCard">
          <div className="panelHeader">
            <h2 className="panelTitle">Change Password</h2>
          </div>

          <div className="profileBody">
            <div className="formGroup">
              <label htmlFor="currentPassword" className="formLabel">
                Current Password *
              </label>
              <input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                name="CurrentPassword"
                value={currentPassword}
                onChange={handlePasswordChange}
                className={`formInput ${
                  errors.CurrentPassword !== undefined ? "error" : ""
                }`}
                disabled={saving}
              />
              {errors.CurrentPassword !== undefined && (
                <span className="errorText">{errors.CurrentPassword}</span>
              )}
            </div>

            <div className="formGroup">
              <label htmlFor="newPassword" className="formLabel">
                New Password *
              </label>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                name="NewPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                className={`formInput ${
                  errors.NewPassword !== undefined ? "error" : ""
                }`}
                disabled={saving}
              />
              {errors.NewPassword !== undefined ? (
                <span className="errorText">{errors.NewPassword}</span>
              ) : (
                <span className="hintText">
                  Must be at least 6 characters
                </span>
              )}
            </div>

            <div className="formGroup">
              <label htmlFor="confirmPassword" className="formLabel">
                Confirm New Password *
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                name="ConfirmPassword"
                value={confirmPassword}
                onChange={handlePasswordChange}
                className={`formInput ${
                  errors.ConfirmPassword !== undefined ? "error" : ""
                }`}
                disabled={saving}
              />
              {errors.ConfirmPassword !== undefined && (
                <span className="errorText">{errors.ConfirmPassword}</span>
              )}
            </div>

            <div className="checkboxGroup">
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={saving}
                />
                <span>Show passwords</span>
              </label>
            </div>

            <div className="formActions">
              <button
                className="btnPrimary"
                onClick={() => {
                  handleChangePassword().catch(console.error);
                }}
                disabled={saving}
              >
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
