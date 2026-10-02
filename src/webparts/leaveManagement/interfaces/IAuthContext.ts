import { IUser } from "./IUser";

export interface IAuthContext {
  user: IUser | undefined;
  isLoading: boolean;
  error: string | undefined;

  login: (userData: IUser) => void;
  loginWithMicrosoft: (email: string, displayName: string) => Promise<boolean>;
  logout: () => void;
}
