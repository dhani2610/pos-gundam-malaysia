export interface ProductDto {
  id?: number;
  idCabang: number;
  productCode: string;
  name: string;
  image?: string;
  categoryId: number;
  subCategoryId: number;
  brandId: number;
  stock: number;
  price: number;
}

export interface StockInDto {
  idCabang: number;
  productId: number;
  qty: number;
  supplier?: string;
  note?: string;
}
