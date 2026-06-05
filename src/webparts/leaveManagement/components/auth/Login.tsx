import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { IUser } from "../../interfaces/IUser";
import { loginUser } from "../../services/SPService";
import "./Login.css";

const Login = (): JSX.Element => {
  const navigate = useNavigate();
  const { login, user } = React.useContext(AuthContext);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (): Promise<void> => {
    try {
      setError("");

      if (!email || !password) {
        setError("Please enter your email and password.");
        return;
      }

      const employee = await loginUser(email, password);

      if (!employee) {
        setError("Invalid email or password.");
        return;
      }

      const userData: IUser = {
        Email: employee.Email,
        Password: employee.Password,
        Role: employee.Role,
      };

      login(userData);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      setError("Something went wrong. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleLogin().catch(console.error);
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* Brand */}
        <div className="brandRow">
          <div className="brandIcon">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={18}
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
          <span className="brandName">LeaveDesk</span>
        </div>

        <h1 className="heading">Welcome back</h1>
        <p className="subheading">Sign in to your workspace to continue</p>

        {/* Email */}
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

        {/* Password */}
        <div className="fieldGroup">
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="inputWrap">
            <input
              id="password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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

        {error && (
          <p className="errorMsg" role="alert">
            {error}
          </p>
        )}

        <button className="submitBtn" onClick={handleLogin}>
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
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <p className="footerNote">
          Protected by enterprise-grade SSO &amp; 2FA
        </p>
      </div>
    </div>
  );
};

export default Login;
