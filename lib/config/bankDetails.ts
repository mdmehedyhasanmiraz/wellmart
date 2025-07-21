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
  bankName: "Southeast Bank PLC.",
  accountName: "Md. Murad Molla",
  accountNumber: "20503320100194716",
  branch: "Mogbazar, Dhaka",
  routingNumber: "205270248",
  swiftCode: "SEBDBDDH",
  instructions: [
    "Please transfer the exact amount shown",
    "Use your order ID as payment reference",
    "Keep the transfer receipt for verification",
    "Order will be processed after payment confirmation",
    "Contact support if you need assistance"
  ]
}; 