import * as React from "react";
import { IUser } from "../interfaces/IUser";
import { IAuthContext } from "../interfaces/IAuthContext";
import { getEmployeeByEmail } from "../services/SPService";

export const AuthContext = React.createContext<IAuthContext>(
  {} as IAuthContext,
);

export const AuthProvider = ({
  children,
  context,
}: {
  children: React.ReactNode;
  context: any;
}): JSX.Element => {
  const [user, setUser] = React.useState<IUser | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect((): void => {
    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: IUser): void => {
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Read the current user's email and display name directly from the
      // SPFx page context. This is the reliable, supported way to get the
      // logged-in user's identity (window._spPageContextInfo is not available
      // on modern pages, and the old __spPageContext/_spPageContext globals
      // were never set by this app).
      const email: string | undefined = context?.pageContext?.user?.email;
      const displayName: string =
        context?.pageContext?.user?.displayName || "";

      if (!email) {
        setError(
          "Unable to retrieve your Microsoft account. Please use local login.",
        );
        setIsLoading(false);
        return false;
      }

      const employee = await getEmployeeByEmail(email, context);

      if (!employee) {
        setError(
          "Your account is not registered in the Leave Management system. Please contact your administrator.",
        );
        setIsLoading(false);
        return false;
      }

      if (employee.IsActive === false) {
        setError("Your account has been deactivated. Please contact your administrator.");
        setIsLoading(false);
        return false;
      }

      const userData: IUser = {
        Id: employee.Id,
        DisplayName: displayName || employee.Name || employee.Title,
        Email: employee.Email,
        Role: employee.Role,
        Department: employee.Department,

        IsActive: employee.IsActive,
        LoginType: "microsoft",
      };

      sessionStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Microsoft login error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
      return false;
    }
  };

  const logout = (): void => {
    sessionStorage.removeItem("user");
    setUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        loginWithMicrosoft,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
