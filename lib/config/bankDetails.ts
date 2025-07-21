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
  bankName: "Sonali Bank",
  accountName: "Wellmart BD",
  accountNumber: "1234567890",
  branch: "Dhaka Main Branch",
  routingNumber: "200270116",
  swiftCode: "BSONBDDH",
  instructions: [
    "Please transfer the exact amount shown",
    "Use your order ID as payment reference",
    "Keep the transfer receipt for verification",
    "Order will be processed after payment confirmation",
    "Contact support if you need assistance"
  ]
}; 