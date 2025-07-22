export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
  swiftCode?: string;
  instructions: string[];
}

export const bankDetails: BankDetails = {
  bankName: "Islami Bank Bangladesh Limited",
  accountName: "Md. Murad Molla",
  accountNumber: "20503320100194716", // 16 digits
  branch: "Mogbazar, Dhaka",
  routingNumber: "125274182", // 9 digits
  swiftCode: "IBBLBDDH332", // 11 characters
  instructions: [
    "Please transfer the exact amount shown",
    "Use your order ID as payment reference",
    "Keep the transfer receipt for verification",
    "Order will be processed after payment confirmation",
    "Contact support if you need assistance"
  ]
}; 