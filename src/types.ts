export interface ReceiptFormData {
  customerName: string;
  date: string;
  time: string;
  items: {
    productType: "bottled" | "satchet";
    quantity: number;
    price: number;
  }[];
  notes: string;
}
