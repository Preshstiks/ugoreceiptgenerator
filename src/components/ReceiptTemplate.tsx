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
      className="w-[300px] p-4"
      id="receipt-template"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Header */}
      <div className="text-center mb-2 pt-4 pb-3 font-sc-regular">
        <div className="flex justify-center">
          <img src={logo} alt="logo" className="rounded-lg w-[70px]" />
        </div>
        <h1 className="text-sm font-sc-regular mb-1 text-black">
          {companyDetails?.name || "Ugo H²0 (water) Nigeria Ltd"}
        </h1>
        <p className="text-xs mb-1" style={{ color: "#374151" }}>
          {companyDetails?.address ||
            "Along Mararaba - Guruku Road, Aso B, Nasarawa State."}
        </p>
        <p className="text-xs mb-1" style={{ color: "#374151" }}>
          {companyDetails?.email || "ifemene@gmail.com"}
        </p>
        <p className="text-xs" style={{ color: "#374151" }}>
          Phone:{" "}
          {companyDetails?.phone?.join(", ") || "08024872208, 09063762319"}
        </p>
      </div>

      {/* Receipt Info */}
      <div
        className="border-y border-dashed font-sc-regular pt-1 pb-3 mb-2"
        style={{ borderColor: "#9CA3AF" }}
      >
        <div className="pb-2">
          <p className="text-sm" style={{ color: "#374151" }}>
            Receipt ID:
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>
            #{Math.floor(Math.random() * 1000000)}
          </p>
        </div>
        <div className="pb-2">
          <p className="text-sm" style={{ color: "#374151" }}>
            Date:
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>
            {currentDate}
          </p>
        </div>
        <div className="pb-2">
          <p className="text-sm" style={{ color: "#374151" }}>
            Time:
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>
            {currentTime}
          </p>
        </div>
        <div className="pb-2">
          <p className="text-sm" style={{ color: "#374151" }}>
            Customer Name:
          </p>
          <p className="text-sm" style={{ color: "#374151" }}>
            {data.customerName}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div
          className="grid grid-cols-12 font-sc-bold text-sm border-b pb-3"
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
            className="grid grid-cols-12 font-sc-regular text-sm py-1"
          >
            <div className="col-span-6" style={{ color: "#4B5563" }}>
              {item.productType === "bottled"
                ? "Bottled Water"
                : "Satchet Water"}
            </div>
            <div className="col-span-2 text-right" style={{ color: "#4B5563" }}>
              {item.quantity}
            </div>
            <div className="col-span-4 text-right" style={{ color: "#4B5563" }}>
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
        <div className="flex justify-between text-sm font-sc-regular">
          <span style={{ color: "#4B5563" }}>Subtotal:</span>
          <span style={{ color: "#4B5563" }}>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm font-sc-bold">
          <span style={{ color: "#111827" }}>Total:</span>
          <span style={{ color: "#111827" }}>₦{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-4">
          <p className="text-sm font-sc-medium" style={{ color: "#111827" }}>
            Notes:
          </p>
          <p className="text-sm font-sc-regular" style={{ color: "#4B5563" }}>
            {data.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center font-sc-regular text-sm">
        <p style={{ color: "#4B5563" }}>Thank you for your patronage!</p>
        <p className="mt-2" style={{ color: "#4B5563" }}>
          Please come again
        </p>
      </div>
    </div>
  );
};
