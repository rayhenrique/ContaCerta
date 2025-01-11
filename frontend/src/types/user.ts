export interface User {
  id: number;
  name: string;
  email: string;
  accessLevel: 'admin' | 'operator';
  createdAt?: string;
  updatedAt?: string;
}
