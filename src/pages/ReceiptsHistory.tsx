import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FiSearch, FiFilter, FiTrash2, FiX } from "react-icons/fi";
import { db } from "../firebase/init";
import { ReceiptPreviewModal } from "../components/ReceiptPreviewModal";
import { usePDF } from "react-to-pdf";
import { ReceiptTemplate } from "../components/ReceiptTemplate";
import { ClipLoader } from "react-spinners";
import { useAuth } from "../context/AuthContext";

interface Items {
  name: string;
  price: number;
  quantity: number;
  receiptID: number;
  subtotal: number;
  total: number;
}

interface Receipt {
  id: string;
  customerName: string;
  items: Items[];
  time: string;
  date: string;
  status: "paid";
  createdAt: Timestamp;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleteAll?: boolean;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxAmount: number | null;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleteAll = false,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isDeleteAll ? "Delete All Receipts" : "Delete Receipt"}
        </h2>
        <p className="text-gray-600 mb-6">
          {isDeleteAll
            ? "Are you sure you want to delete all receipts? This action cannot be undone."
            : "Are you sure you want to delete this receipt? This action cannot be undone."}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border cursor-pointer border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
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

export const ReceiptsHistory = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<Receipt[]>([]);
  const [filteredData, setFilteredData] = useState<Receipt[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    startDate: "",
    endDate: "",
    minAmount: null,
    maxAmount: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterOptions]);

  const { toPDF, targetRef } = usePDF({
    filename: `receipt_${selectedReceipt?.id}.pdf`,
    page: {
      format: [80, 200],
      orientation: "portrait",
    },
    method: "save",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }

        const receiptsQuery = query(
          collection(db, "receipts"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(receiptsQuery);
        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate();

          const formattedDate = createdAt?.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const formattedTime = createdAt?.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });

          return {
            id: doc.id,
            date: formattedDate,
            time: formattedTime,
            customerName: data.customerName,
            items: data.items || [],
            status: data.status,
            createdAt: data.createdAt,
          };
        });

        // Sort items by createdAt timestamp in descending order (latest first)
        const sortedItems = items.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setData(sortedItems);
        setFilteredData(sortedItems);
      } catch (error) {
        console.error("Error fetching receipts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    // Apply search and filters
    let result = [...data];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (receipt) =>
          receipt.customerName.toLowerCase().includes(query) ||
          receipt.date.toLowerCase().includes(query) ||
          receipt.time.toLowerCase().includes(query)
      );
    }

    // Apply date filters
    if (filterOptions.startDate) {
      const startDate = new Date(filterOptions.startDate);
      result = result.filter((receipt) => {
        const receiptDate = receipt.createdAt?.toDate();
        return receiptDate && receiptDate >= startDate;
      });
    }

    if (filterOptions.endDate) {
      const endDate = new Date(filterOptions.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((receipt) => {
        const receiptDate = receipt.createdAt?.toDate();
        return receiptDate && receiptDate <= endDate;
      });
    }

    // Apply amount filters
    if (filterOptions.minAmount !== null) {
      result = result.filter((receipt) => {
        const total = receipt.items.reduce((sum, item) => sum + item.total, 0);
        return total >= filterOptions.minAmount!;
      });
    }

    if (filterOptions.maxAmount !== null) {
      result = result.filter((receipt) => {
        const total = receipt.items.reduce((sum, item) => sum + item.total, 0);
        return total <= filterOptions.maxAmount!;
      });
    }

    setFilteredData(result);
  }, [searchQuery, filterOptions, data]);

  const handleFilter = () => {
    setFilterModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilterOptions({
      startDate: "",
      endDate: "",
      minAmount: null,
      maxAmount: null,
    });
    setSearchQuery("");
  };

  const handleFilterChange = (
    field: keyof FilterOptions,
    value: string | number | null
  ) => {
    setFilterOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasActiveFilters = () => {
    return (
      searchQuery ||
      filterOptions.startDate ||
      filterOptions.endDate ||
      filterOptions.minAmount !== null ||
      filterOptions.maxAmount !== null
    );
  };

  const handleDelete = async (receiptId: string) => {
    try {
      await deleteDoc(doc(db, "receipts", receiptId));
      setData(data.filter((receipt) => receipt.id !== receiptId));
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting receipt:", error);
      alert("Error deleting receipt. Please try again.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const batch = writeBatch(db);
      const receiptsRef = collection(db, "receipts");
      const receiptsQuery = query(
        receiptsRef,
        where("userId", "==", user?.uid)
      );
      const querySnapshot = await getDocs(receiptsQuery);

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setData([]);
      setFilteredData([]);
      setIsDeleteAllModalOpen(false);
    } catch (error) {
      console.error("Error deleting all receipts:", error);
      alert("Error deleting all receipts. Please try again.");
    }
  };

  const handleDownload = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    try {
      await toPDF();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setPreviewModalOpen(true);
  };

  // Prevent wheel event on number inputs
  const preventWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div className="mx-auto px-4 sm:px-6 font-rubik-regular lg:px-8 py-8">
      <style>{numberInputStyles}</style>
      {/* Hidden Receipt Template for PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={targetRef} style={{ width: "80mm" }}>
          {selectedReceipt && (
            <ReceiptTemplate
              data={{
                customerName: selectedReceipt.customerName,
                date: selectedReceipt.date,
                time: selectedReceipt.time,
                items: selectedReceipt.items.map((item) => ({
                  productType:
                    item.name === "Bottled Water" ? "bottled" : "satchet",
                  quantity: item.quantity,
                  price: item.price,
                })),
                notes: "",
              }}
              subtotal={selectedReceipt.items.reduce(
                (sum, item) => sum + item.total,
                0
              )}
              total={selectedReceipt.items.reduce(
                (sum, item) => sum + item.total,
                0
              )}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => selectedReceiptId && handleDelete(selectedReceiptId)}
      />

      {/* Delete All Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAll}
        isDeleteAll={true}
      />

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <ReceiptPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          onDownload={() => handleDownload(selectedReceipt)}
          data={{
            customerName: selectedReceipt.customerName,
            date: selectedReceipt.date,
            time: selectedReceipt.time,
            items: selectedReceipt.items.map((item) => ({
              productType:
                item.name === "Bottled Water" ? "bottled" : "satchet",
              quantity: item.quantity,
              price: item.price,
            })),
            notes: "",
          }}
          subtotal={selectedReceipt.items.reduce(
            (sum, item) => sum + item.total,
            0
          )}
          total={selectedReceipt.items.reduce(
            (sum, item) => sum + item.total,
            0
          )}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all your receipts
          </p>
        </div>
        <div className="flex gap-4">
          {filteredData.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="inline-flex items-center cursor-pointer px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
            >
              <FiTrash2 className="mr-2" />
              Delete All
            </button>
          )}
          <button
            onClick={handleFilter}
            className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="mr-2" />
            Filter
          </button>
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FiX className="mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-shadow"
            placeholder="Search receipts by customer name or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className=" font-semibold text-gray-900">Filter Receipts</h2>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={filterOptions.startDate}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                      className="w-full px-3 text-sm py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filterOptions.endDate}
                      onChange={(e) =>
                        handleFilterChange("endDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border text-sm border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      placeholder="Min Amount"
                      value={filterOptions.minAmount ?? ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "minAmount",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      onWheel={preventWheel}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent [appearance:textfield]"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max Amount"
                      value={filterOptions.maxAmount ?? ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "maxAmount",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      onWheel={preventWheel}
                      className="w-full px-3 py-2 border text-sm border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent [appearance:textfield]"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setFilterModalOpen(false)}
                className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded-md text-xs font-medium hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ClipLoader color="#000000" size={40} />
            <p className="mt-4 text-sm text-gray-500">Loading receipts...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <img
              src="/empty-receipts.svg"
              alt="No receipts found"
              className="w-48 h-48 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Receipts Found
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {searchQuery || hasActiveFilters()
                ? "No receipts match your search criteria. Try adjusting your filters."
                : "You haven't created any receipts yet. Start by generating a new receipt."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {currentItems.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-lg">
                            {receipt.customerName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-rubik-medium text-gray-900">
                          {receipt.customerName}
                        </h3>
                        <div className="mt-1 flex items-center space-x-1 text-[10px] text-gray-500">
                          <span>{receipt.date}</span>
                          <span>•</span>
                          <span>{receipt.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-rubik-medium text-gray-900">
                        ₦
                        {receipt.items
                          .reduce((sum, item) => sum + item.total, 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-[10px]  text-gray-500">
                        {receipt.items.length}{" "}
                        {receipt.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleView(receipt)}
                        className="text-gray-600 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors p-2 text-[11px] hover:underline cursor-pointer"
                      >
                        View
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReceiptId(receipt.id);
                          setDeleteModalOpen(true);
                        }}
                        className="text-gray-600 hover:bg-red-100 rounded-lg p-2 cursor-pointer hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(endIndex, filteredData.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{filteredData.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
