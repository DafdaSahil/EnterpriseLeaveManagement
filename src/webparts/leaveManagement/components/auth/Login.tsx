import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { IUser } from "../../interfaces/IUser";
import { loginUser } from "../../services/SPService";
import { getRoleRedirectPath } from "../../utils/roleRedirect";
import "./Login.css";

const Login = (): JSX.Element => {
  const navigate = useNavigate();
  const {
    login,
    loginWithMicrosoft,
    user,
    isLoading,
    error: authError,
  } = React.useContext(AuthContext);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isMicrosoftLoading, setIsMicrosoftLoading] = React.useState(false);
  const [isLocalLoading, setIsLocalLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      navigate(getRoleRedirectPath(user));
    }
  }, [user, navigate]);

  const handleLocalLogin = async (): Promise<void> => {
    try {
      setError("");
      setIsLocalLoading(true);

      if (!email || !password) {
        setError("Please enter your email and password.");
        setIsLocalLoading(false);
        return;
      }

      const employee = await loginUser(email, password);

      if (!employee) {
        setError("Invalid email or password.");
        setIsLocalLoading(false);
        return;
      }

      if (employee.IsActive === false) {
        setError(
          "Your account has been deactivated. Please contact your administrator.",
        );
        setIsLocalLoading(false);
        return;
      }

      const userData: IUser = {
        Id: employee.Id,
        DisplayName: employee.Name || employee.Title,
        Email: employee.Email,
        Password: employee.Password,
        Role: employee.Role,
        Department: employee.Department,
        IsActive: employee.IsActive,
        LoginType: "local",
        EmployeeImage: employee.EmployeeImage,
      };

      login(userData);
      navigate(getRoleRedirectPath(userData));
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
      setIsLocalLoading(false);
    }
  };

  const handleMicrosoftLogin = async (): Promise<void> => {
    try {
      setIsMicrosoftLoading(true);
      setError("");

      const success = await loginWithMicrosoft();

      if (success) {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const parsedUser: IUser = JSON.parse(storedUser);
          navigate(getRoleRedirectPath(parsedUser));
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Microsoft login error:", err);
      setError("Microsoft login failed. Please try local login.");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleLocalLogin().catch(console.error);
    }
  };

  return (
    <div className="loginPage">
      {/* Animated background elements */}
      <div className="bgOrbs">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="orb orb4" />
      </div>

      {/* Grid pattern overlay */}
      <div className="gridOverlay" />

      <div className="loginContent">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="loginBranding">
          <div className="brandingContent">
            <div className="brandLogo">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={28}
                height={28}
              >
                <rect
                  x="3"
                  y="3"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  fillOpacity={0.9}
                />
                <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" />
                <rect
                  x="3"
                  y="11"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  fillOpacity={0.6}
                />
                <rect
                  x="11"
                  y="11"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  fillOpacity={0.4}
                />
              </svg>
            </div>
            <h1 className="brandingTitle">LeaveDesk</h1>
            <p className="brandingSubtitle">Enterprise Leave Management</p>
            <div className="brandingFeatures">
              <div className="featureItem">
                <div className="featureIcon">✓</div>
                <span>Real-time leave tracking</span>
              </div>
              <div className="featureItem">
                <div className="featureIcon">✓</div>
                <span>Automated approvals</span>
              </div>
              <div className="featureItem">
                <div className="featureIcon">✓</div>
                <span>Team analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="loginFormSection">
          <div className="loginCard">
            <div className="cardHeader">
              <h2 className="cardTitle">Welcome back</h2>
              <p className="cardSubtitle">
                Sign in to manage your leave requests
              </p>
            </div>

            <button
              className="microsoftBtn"
              onClick={handleMicrosoftLogin}
              disabled={isMicrosoftLoading || isLoading}
            >
              {isMicrosoftLoading ? (
                <span className="spinner" />
              ) : (
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 21 21"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              )}
              <span>
                {isMicrosoftLoading
                  ? "Signing in..."
                  : "Sign in with Microsoft"}
              </span>
            </button>

            <div className="divider">
              <span className="dividerText">or continue with email</span>
            </div>

            <div className="fieldGroup">
              <label className="label" htmlFor="email">
                Email address
              </label>
              <div className="inputWrap">
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="fieldGroup">
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="inputWrap">
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
                <button
                  className="eyeBtn"
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg
                      width={17}
                      height={17}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width={17}
                      height={17}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="forgotRow">
              <a href="#" className="forgotLink">
                Forgot password?
              </a>
            </div>

            {(error || authError) && (
              <p className="errorMsg" role="alert">
                {error || authError}
              </p>
            )}

            <button
              className="submitBtn"
              onClick={handleLocalLogin}
              disabled={isLocalLoading}
            >
              {isLoading ? (
                <span className="spinner light" />
              ) : (
                <>
                  Sign in
                  <svg
                    width={17}
                    height={17}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            <p className="footerNote">
              Protected by enterprise-grade SSO &amp; 2FA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
