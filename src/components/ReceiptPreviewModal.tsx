import { FiX } from "react-icons/fi";
import { ReceiptTemplate } from "./ReceiptTemplate";
import type { ReceiptFormData } from "../types";

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  data: ReceiptFormData;
  subtotal: number;
  total: number;
}

export const ReceiptPreviewModal = ({
  isOpen,
  onClose,
  onDownload,
  data,
  subtotal,
  total,
}: ReceiptPreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            Receipt Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center mb-6 overflow-y-auto max-h-[60vh]">
          <div className="scale-75 origin-top">
            <ReceiptTemplate data={data} subtotal={subtotal} total={total} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
