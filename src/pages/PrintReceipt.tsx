import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/init";
import { ReceiptTemplate } from "../components/ReceiptTemplate";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface ReceiptData {
  customerName: string;
  createdAt: Timestamp;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes: string;
  total: number;
}

export const PrintReceipt = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!receiptId) return;

      try {
        const docRef = doc(db, "receipts", receiptId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as ReceiptData;
          setReceiptData(data);
          setIsLoading(false);
        } else {
          console.error("No such receipt!");
          navigate("/dashboard/receipts-history");
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        navigate("/dashboard/receipts-history");
      }
    };

    fetchReceipt();
  }, [receiptId, navigate]);

  // Separate effect to handle printing after content is loaded
  useEffect(() => {
    if (!isLoading && receiptData) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, receiptData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            /* Remove page title and URL */
            @page :first {
              margin-top: 0;
            }
            /* Hide any headers and footers */
            @page {
              margin: 0;
              padding: 0;
            }
            /* Remove shadows and borders */
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        `}
      </style>

      <div className="max-w-4xl mx-auto px-4">
        <div className="no-print flex justify-between items-center mb-8">
          <button
            onClick={() => navigate("/dashboard/receipts-history")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2" />
            Back to Receipts
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiPrinter className="mr-2" />
            Print Receipt
          </button>
        </div>

        <div
          id="print-section"
          ref={printRef}
          className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none"
        >
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading receipt...</p>
            </div>
          ) : receiptData ? (
            <ReceiptTemplate
              data={{
                customerName: receiptData.customerName,
                date:
                  receiptData.createdAt?.toDate().toLocaleDateString() ||
                  new Date().toLocaleDateString(),
                items: receiptData.items.map((item) => ({
                  productType:
                    item.name === "Bottled Water" ? "bottled" : "satchet",
                  quantity: item.quantity,
                  price: item.price,
                })),
                notes: receiptData.notes || "",
              }}
              subtotal={receiptData.total}
              total={receiptData.total}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Receipt not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
