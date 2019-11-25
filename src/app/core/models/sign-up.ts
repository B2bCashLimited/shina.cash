export interface SignUp {
  client: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  password?: string;
  phoneCode: string;
  phone: string;
  username: string;
  country: number;
  hash: string;
  individual?: boolean;
}
