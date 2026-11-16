export interface BranchDto {
  id?: number;
  idCabang?: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
}

export interface UserDto {
  id?: number;
  idCabang: number;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "employee" | "admin_stok";
}

export interface CustomerDto {
  id?: number;
  idCabang: number;
  name: string;
  phone: string;
  address?: string;
}

export interface CategoryDto {
  id?: number;
  idCabang: number;
  code: string;
  name: string;
  description?: string;
}

export interface SubCategoryDto {
  id?: number;
  idCabang: number;
  categoryId: number;
  name: string;
  description?: string;
}

export interface BrandDto {
  id?: number;
  idCabang: number;
  name: string;
  description?: string;
}
