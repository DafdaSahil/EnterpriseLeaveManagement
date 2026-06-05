import { IUser } from "./IUser";

export interface IAuthContext {

  user: IUser | undefined;

  login: (userData: IUser) => void;

  logout: () => void;
}