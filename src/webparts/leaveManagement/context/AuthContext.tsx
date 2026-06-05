import * as React from "react";
import { IUser } from "../interfaces/IUser";
import { IAuthContext } from "../interfaces/IAuthContext";

export const AuthContext = React.createContext<IAuthContext>(
  {} as IAuthContext,
);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [user, setUser] = React.useState<IUser | undefined>(undefined);

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

  const logout = (): void => {
    sessionStorage.removeItem("user");

    setUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
