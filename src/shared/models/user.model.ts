export interface User {
  id: number;
  username: string;
  role: 'admin' | 'doctor';
  name: string;
  email: string;
}
