export type ReceiptFormData = {
  customerName: string;
  date: string;
  items: Array<{
    productType: "bottled" | "satchet";
    quantity: number;
    price: number;
  }>;
  notes: string;
};
