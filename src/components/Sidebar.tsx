import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiFileText, FiList, FiUser } from "react-icons/fi";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/init";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { BiPowerOff } from "react-icons/bi";
import { ClipLoader } from "react-spinners";
import { useState } from "react";

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      logout();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: "/dashboard", icon: FiHome, label: "Dashboard" },
    {
      path: "/dashboard/generate-receipt",
      icon: FiFileText,
      label: "Generate Receipt",
    },
    {
      path: "/dashboard/receipts-history",
      icon: FiList,
      label: "Receipts History",
    },
    { path: "/profile", icon: FiUser, label: "Profile" },
  ];

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <ClipLoader color="#000000" size={40} />
            <p className="text-gray-700 font-medium">Logging out...</p>
          </div>
        </div>
      )}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Company Logo */}
        <div className="px-7 py-4 mt-4 flex items-center space-x-2 cursor-pointer">
          <img src={logo} alt="logo" className="rounded-lg w-[70px]" />
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 font-[family-name:var(--font-neue-montrealmedium)] flex-grow">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center text-sm px-3 py-3 mb-2 rounded-md ${
                isActive(item.path)
                  ? "text-white bg-black font-bold"
                  : "text-gray-700 hover:font-bold hover:text-black"
              }`}
            >
              <item.icon
                className={`w-[18px] mr-3 ${
                  isActive(item.path) ? "text-white" : "text-gray-500"
                }`}
              />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="pb-4 px-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex cursor-pointer text-sm items-center w-full px-3 py-3 text-red-500 hover:font-bold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiPowerOff className="w-[18px] mr-3 text-red-500" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
