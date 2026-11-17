export interface PosCartItemDto {
  productId: number;
  productCode: string;
  productName: string;
  originalPrice: number;
  customPrice: number;
  qty: number;
  discountType?: "rm" | "percent";
  discountValue?: number;
  discountAmount: number;
}

export interface CreateTransactionDto {
  idCabang: number;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string;
  orderDiscountType?: "rm" | "percent";
  orderDiscountValue?: number;
  orderDiscountAmount?: number;
  voucherId?: number | null;
  voucherCode?: string | null;
  voucherDiscountAmount?: number;
  paymentMethod: "cash" | "transfer" | "qr_pay";
  cashAmount: number;
  transferAmount: number;
  bankAccountInfo?: string;
  notes?: string;
  items: PosCartItemDto[];
}

export interface UpdateTransactionDto extends CreateTransactionDto {
  id: number;
}
