import { IUser } from "./IUser";

export interface IAuthContext {
  user: IUser | undefined;
  isLoading: boolean;
  error: string | undefined;

  login: (userData: IUser) => void;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
}
