export interface PaymentStrategy {
  authorize(
    amount: number
  ): Promise<{ success: boolean; transactionId?: string }>;
}

export class CardPayment implements PaymentStrategy {
  async authorize(amount: number) {
    console.log(`Processing Card Payment: ${amount}`);
    return { success: true, transactionId: "CARD-" + Date.now() };
  }
}

export class BankPayment implements PaymentStrategy {
  async authorize(amount: number) {
    console.log(`Processing Bank Transfer: ${amount}`);
    return { success: true, transactionId: "BANK-" + Date.now() };
  }
}

export class WalletPayment implements PaymentStrategy {
  async authorize(amount: number) {
    console.log(`Processing eWallet Payment: ${amount}`);
    return { success: true, transactionId: "WALLET-" + Date.now() };
  }
}
