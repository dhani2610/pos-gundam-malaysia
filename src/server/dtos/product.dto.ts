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
  costPrice?: number;
  price: number;
}

export interface StockInItemInput {
  productId: number;
  qty: number;
  costPrice?: number;
}

export interface StockInDto {
  idCabang: number;
  productId?: number;
  qty?: number;
  costPrice?: number;
  referenceNo?: string;
  invoiceNo?: string;
  supplier?: string;
  invoiceFile?: string;
  invoiceFileName?: string;
  note?: string;
  items?: StockInItemInput[];
}
