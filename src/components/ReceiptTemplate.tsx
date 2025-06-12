import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/init";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import { ClipLoader } from "react-spinners";

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

interface CompanyDetails {
  name: string;
  address: string;
  phone: string[];
  email: string;
}

interface ReceiptTemplateProps {
  data: ReceiptFormData;
  subtotal: number;
  total: number;
}

export const ReceiptTemplate = ({
  data,
  subtotal,
  total,
}: ReceiptTemplateProps) => {
  const { user } = useAuth();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, "companyDetails", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyDetails;
          setCompanyDetails({
            ...data,
            phone: Array.isArray(data.phone) ? data.phone : [data.phone || ""],
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [user]);

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  if (isLoading) {
    return (
      <div className="w-[300px] p-4 flex items-center justify-center">
        <ClipLoader color="#000000" size={40} />
      </div>
    );
  }

  return (
    <div
      className="w-[350px] p-4"
      id="receipt-template"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Header */}
      <div className="text-center mb-2 pt-4 pb-3 font-sc-medium">
        <div className="flex justify-center">
          <img src={logo} alt="logo" className="rounded-lg w-[110px]" />
        </div>
        <h1 className="font-sc-semi-bold mb-1 text-black">
          {companyDetails?.name || "Ugo H²0 (water) Nigeria Ltd"}
        </h1>
        <p className="text-[15px] mb-1 text-black">
          {companyDetails?.address ||
            "Along Mararaba - Guruku Road, Aso B, Nasarawa State."}
        </p>
        <p className="text-[15px] mb-1 text-black">
          {companyDetails?.email || "ifemene@gmail.com"}
        </p>
        <p className="text-[15px] text-black">
          Phone:{" "}
          {companyDetails?.phone?.join(", ") || "08024872208, 09063762319"}
        </p>
      </div>

      {/* Receipt Info */}
      <div
        className="border-y border-dashed text-black font-sc-medium pt-1 pb-3 mb-2"
        style={{ borderColor: "#9CA3AF" }}
      >
        <div className="pb-2">
          <p>Receipt ID:</p>
          <p>#{Math.floor(Math.random() * 1000000)}</p>
        </div>
        <div className="pb-2">
          <p>Date:</p>
          <p>{currentDate}</p>
        </div>
        <div className="pb-2">
          <p>Time:</p>
          <p>{currentTime}</p>
        </div>
        <div className="pb-2">
          <p>Customer Name:</p>
          <p>{data.customerName}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div
          className="grid grid-cols-12 font-sc-bold border-b pb-3"
          style={{ borderColor: "#9CA3AF" }}
        >
          <div className="col-span-6" style={{ color: "#111827" }}>
            Item
          </div>
          <div className="col-span-2 text-right" style={{ color: "#111827" }}>
            Qty
          </div>
          <div className="col-span-4 text-right" style={{ color: "#111827" }}>
            Price
          </div>
        </div>

        {data.items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 text-black font-sc-medium py-1"
          >
            <div className="col-span-6">
              {item.productType === "bottled"
                ? "Bottled Water"
                : "Satchet Water"}
            </div>
            <div className="col-span-2 text-right">{item.quantity}</div>
            <div className="col-span-4 text-right">
              ₦{item.price.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div
        className="border-t border-b border-dashed pt-2 pb-3 mb-4"
        style={{ borderColor: "#9CA3AF" }}
      >
        <div className="flex justify-between font-sc-medium">
          <span>Subtotal:</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-sc-bold">
          <span>Total:</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-4">
          <p className="font-sc-medium">Notes:</p>
          <p className="font-sc-regular">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center font-sc-regular">
        <p>Thank you for your patronage!</p>
        <p className="mt-2">Please come again</p>
      </div>
    </div>
  );
};
