export interface CreateVoucherDto {
  id?: number;
  idCabang?: number;
  code: string;
  name: string;
  discountType: "percent" | "rm";
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: number | boolean;
}

export interface ValidateVoucherDto {
  code: string;
  idCabang: number;
  subtotal: number;
}
