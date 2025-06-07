import { useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiDownload } from "react-icons/fi";
import { usePDF } from "react-to-pdf";
import { ReceiptTemplate } from "../components/ReceiptTemplate";
import { ReceiptPreviewModal } from "../components/ReceiptPreviewModal";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/init";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ReceiptFormData = {
  customerName: string;
  date: string;
  time: string;
  items: Array<{
    productType: "bottled" | "satchet";
    quantity: number;
    price: number;
  }>;
  notes: string;
};

// Add CSS to remove number input spinners
const numberInputStyles = `
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  input[type="number"]:focus {
    outline: none;
  }
`;

export const GenerateReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const formattedDate = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  const { toPDF, targetRef } = usePDF({
    filename: `receipt_${formattedDate}.pdf`,
    page: {
      format: [80, 200], // POS receipt size in mm (80mm width)
      orientation: "portrait",
    },
    method: "save",
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<ReceiptFormData>({
    customerName: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    items: [],
    notes: "",
  });

  // Prevent wheel event on number inputs
  const preventWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productType: "bottled", quantity: 1, price: 0 },
      ],
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const getUnitLabel = (
    productType: "bottled" | "satchet",
    quantity: number
  ) => {
    if (productType === "bottled") {
      return quantity === 1 ? "pack" : "packs";
    } else {
      return quantity === 1 ? "bag" : "bags";
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.error("Please enter customer name");
      return false;
    }

    const hasValidItems = formData.items.some(
      (item) => item.quantity > 0 && item.price > 0
    );
    if (!hasValidItems) {
      toast.error("Please add at least one item with quantity and price");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (!user) throw new Error("User not authenticated");

      const receiptData = {
        customerName: formData.customerName,
        createdAt: serverTimestamp(),
        items: formData.items.map((item) => ({
          name:
            item.productType === "bottled" ? "Bottled Water" : "Satchet Water",
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
        notes: formData.notes,
        total: calculateTotal(),
        userId: user.uid,
      };

      await addDoc(collection(db, "receipts"), receiptData);
      toast.success("Receipt saved successfully!");

      // Reset form
      setFormData({
        customerName: "",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        items: [],
        notes: "",
      });
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Error saving receipt. Please try again.");
    }
  };

  const handleSaveAndPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (!user) throw new Error("User not authenticated");

      const receiptData = {
        customerName: formData.customerName,
        createdAt: serverTimestamp(),
        items: formData.items.map((item) => ({
          name:
            item.productType === "bottled" ? "Bottled Water" : "Satchet Water",
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
        notes: formData.notes,
        total: calculateTotal(),
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, "receipts"), receiptData);
      toast.success("Receipt saved successfully!");

      // Navigate to print page with the receipt ID
      navigate(`/dashboard/print-receipt/${docRef.id}`);
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Error saving receipt. Please try again.");
    }
  };

  const handleDownload = async () => {
    try {
      await toPDF();
      setIsPreviewOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 font-rubik-regular">
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{numberInputStyles}</style>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Receipt</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new receipt for your customer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 cursor-pointer hover:bg-green-700 transition-colors"
          >
            <FiDownload className="mr-2" />
            Save & Print
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            form="receipt-form"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <FiSave className="mr-2" />
            Save Receipt
          </button>
        </div>
      </div>

      {/* Hidden Receipt Template for PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={targetRef} style={{ width: "80mm" }}>
          <ReceiptTemplate
            data={formData}
            subtotal={calculateSubtotal()}
            total={calculateTotal()}
          />
        </div>
      </div>

      {/* Preview Modal */}
      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownload}
        data={formData}
        subtotal={calculateSubtotal()}
        total={calculateTotal()}
      />

      <form
        id="receipt-form"
        onSubmit={handleSubmit}
        className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100"
      >
        <div className="p-8 space-y-8">
          {/* Customer Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors placeholder-gray-400"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 text-sm py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-4 text-sm py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-rubik-medium text-sm text-gray-900">
                  Items
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Add items to the receipt
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FiPlus className="mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product Type
                    </label>
                    <select
                      value={item.productType}
                      onChange={(e) =>
                        updateItem(index, "productType", e.target.value)
                      }
                      className="w-full px-4 text-sm py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors bg-white"
                      required
                    >
                      <option value="bottled">Bottled Water</option>
                      <option value="satchet">Satchet Water</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Enter quantity"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value)
                          )
                        }
                        onWheel={preventWheel}
                        className="w-full px-4 py-2.5 border border-gray-200 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors [appearance:textfield]"
                        min="1"
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {getUnitLabel(item.productType, item.quantity)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute text-sm left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₦
                      </span>
                      <input
                        type="number"
                        placeholder="Enter price"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value))
                        }
                        onWheel={preventWheel}
                        className="w-full text-sm pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors [appearance:textfield]"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-gray-600 hover:bg-red-100 rounded-lg p-2 cursor-pointer hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full resize-none text-sm px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
              rows={3}
              placeholder="Add any additional notes here..."
            />
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Subtotal:</span>
              <span className="font-medium">
                ₦
                {calculateSubtotal().toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total:</span>
              <span>
                ₦
                {calculateTotal().toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
