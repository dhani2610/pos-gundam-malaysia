export interface BankAccountItemDto {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface WebsiteSettingsDto {
  idCabang: number;
  siteName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  secondaryBanks?: BankAccountItemDto[];
  receiptFooter?: string;
  taxEnabled?: boolean | number;
  taxPercentage?: number;
  taxName?: string;
}
