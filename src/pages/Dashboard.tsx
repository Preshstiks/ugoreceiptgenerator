import {
  FiPlus,
  FiTrendingUp,
  FiPackage,
  FiTrendingDown,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/init";
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";

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
  createdAt?: Timestamp;
}

interface DisplayReceipt {
  id: string;
  customerName: string;
  items: Items[];
  time: string;
  date: string;
  status: "paid";
}

interface Stats {
  current: number;
  previous: number;
  change: number;
}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DisplayReceipt[]>([]);
  const [totalReceipts, setTotalReceipts] = useState<Stats>({
    current: 0,
    previous: 0,
    change: 0,
  });
  const [totalSales, setTotalSales] = useState<Stats>({
    current: 0,
    previous: 0,
    change: 0,
  });
  const [averageOrder, setAverageOrder] = useState<Stats>({
    current: 0,
    previous: 0,
    change: 0,
  });

  const formatChange = (change: number) => {
    if (change === 0) return "No change";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change === 0) return "text-gray-600";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  const getTrendIcon = (change: number) => {
    if (change === 0) return null;
    return change > 0 ? (
      <FiTrendingUp className="inline-block ml-1" />
    ) : (
      <FiTrendingDown className="inline-block ml-1" />
    );
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      // If there was no data in previous period, show 100% increase if there's current data
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const twoDaysAgo = new Date(yesterday);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

        // Fetch all receipts
        const allReceiptsQuery = query(collection(db, "receipts"));
        const allReceiptsSnapshot = await getDocs(allReceiptsQuery);
        const allReceipts = allReceiptsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt,
        })) as Receipt[];

        // Fetch period data for comparison
        const currentPeriodQuery = query(
          collection(db, "receipts"),
          where("createdAt", ">=", Timestamp.fromDate(yesterday))
        );
        const currentPeriodSnapshot = await getDocs(currentPeriodQuery);
        const currentPeriodData = currentPeriodSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt,
        })) as Receipt[];

        const previousPeriodQuery = query(
          collection(db, "receipts"),
          where("createdAt", ">=", Timestamp.fromDate(twoDaysAgo)),
          where("createdAt", "<", Timestamp.fromDate(yesterday))
        );
        const previousPeriodSnapshot = await getDocs(previousPeriodQuery);
        const previousPeriodData = previousPeriodSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt,
        })) as Receipt[];

        // Calculate total sales for all receipts
        const totalSalesAmount = allReceipts.reduce((sum, receipt) => {
          const receiptTotal = receipt.items.reduce(
            (itemSum: number, item: Items) => itemSum + item.total,
            0
          );
          return sum + receiptTotal;
        }, 0);

        const averageOrderAmount =
          allReceipts.length > 0 ? totalSalesAmount / allReceipts.length : 0;

        // Calculate period changes
        const currentPeriodSales = currentPeriodData.reduce((sum, receipt) => {
          const receiptTotal = receipt.items.reduce(
            (itemSum: number, item: Items) => itemSum + item.total,
            0
          );
          return sum + receiptTotal;
        }, 0);

        const previousPeriodSales = previousPeriodData.reduce(
          (sum, receipt) => {
            const receiptTotal = receipt.items.reduce(
              (itemSum: number, item: Items) => itemSum + item.total,
              0
            );
            return sum + receiptTotal;
          },
          0
        );

        setTotalSales({
          current: totalSalesAmount,
          previous: previousPeriodSales,
          change: calculateChange(currentPeriodSales, previousPeriodSales),
        });

        setTotalReceipts({
          current: allReceipts.length,
          previous: previousPeriodData.length,
          change: calculateChange(
            currentPeriodData.length,
            previousPeriodData.length
          ),
        });

        setAverageOrder({
          current: averageOrderAmount,
          previous: previousPeriodSales / (previousPeriodData.length || 1),
          change: calculateChange(
            currentPeriodSales / (currentPeriodData.length || 1),
            previousPeriodSales / (previousPeriodData.length || 1)
          ),
        });

        // Format and set the display data - only take the last 3 receipts
        const formattedData = allReceipts
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 3)
          .map((receipt) => {
            const createdAt = receipt.createdAt?.toDate() || new Date();
            return {
              id: receipt.id,
              date: createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              time: createdAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              }),
              customerName: receipt.customerName,
              items: receipt.items || [],
              status: receipt.status,
            };
          });

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Sales",
      value: `₦${totalSales.current.toLocaleString()}`,
      change: formatChange(totalSales.change),
      changeColor: getChangeColor(totalSales.change),
      trendIcon: getTrendIcon(totalSales.change),
      icon: () => <span className="text-xl font-bold">₦</span>,
      color: "bg-blue-500",
    },
    {
      title: "Total Receipts",
      value: totalReceipts.current.toString(),
      change: formatChange(totalReceipts.change),
      changeColor: getChangeColor(totalReceipts.change),
      trendIcon: getTrendIcon(totalReceipts.change),
      icon: FiPackage,
      color: "bg-green-500",
    },
    {
      title: "Average Order",
      value: `₦${Math.round(averageOrder.current).toLocaleString()}`,
      change: formatChange(averageOrder.change),
      changeColor: getChangeColor(averageOrder.change),
      trendIcon: getTrendIcon(averageOrder.change),
      icon: FiTrendingUp,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 font-rubik-regular">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your business performance
          </p>
        </div>
        <button
          onClick={() => (window.location.href = "/dashboard/generate-receipt")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          New Receipt
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <ClipLoader color="#000000" size={40} />
          <p className="mt-4 text-sm text-gray-500">
            Loading dashboard data...
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <p
                      className={`text-sm ${stat.changeColor} mt-1 flex items-center`}
                    >
                      {stat.change}
                      {stat.trendIcon}
                    </p>
                  </div>
                  <div
                    className={`${stat.color} h-10 w-10 flex items-center justify-center rounded-full text-white`}
                  >
                    <stat.icon />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Receipts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Receipts
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <img
                    src="/empty-receipts.svg"
                    alt="No receipts found"
                    className="w-48 h-48 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Recent Receipts
                  </h3>
                  <p className="text-sm text-gray-500 text-center max-w-sm">
                    You haven't created any receipts yet. Start by generating a
                    new receipt.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {data.map((receipt) => (
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
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm font-rubik-medium text-gray-900">
                              ₦
                              {receipt.items
                                .reduce((sum, item) => sum + item.total, 0)
                                .toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {receipt.items.length}{" "}
                              {receipt.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Link
                to="/dashboard/receipts-history"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View all receipts →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
