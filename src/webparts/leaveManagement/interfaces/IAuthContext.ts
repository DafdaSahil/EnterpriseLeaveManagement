import { IUser } from "./IUser";

export interface IAuthContext {
  user: IUser | undefined;
  isLoading: boolean;
  error: string | undefined;

  login: (userData: IUser) => void;
  /** Merges field changes into the signed-in user and persists them. */
  updateUser: (changes: Partial<IUser>) => void;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
}
