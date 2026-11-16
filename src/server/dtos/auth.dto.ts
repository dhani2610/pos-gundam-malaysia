export interface LoginRequestDto {
  username: string;
  password?: string;
}

export interface UpdateProfileDto {
  name: string;
  username: string;
  email: string;
  phone: string;
  currentPassword?: string;
  newPassword?: string;
}
