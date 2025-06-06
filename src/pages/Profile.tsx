import { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/init";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import logo from "../assets/logo.png";
interface CompanyDetails {
  name: string;
  address: string;
  phone: string[];
  email: string;
}

export const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: "",
    address: "",
    phone: [""],
    email: "",
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const docRef = doc(db, "companyDetails", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyDetails;
          // Ensure phone is always an array
          setCompanyDetails({
            ...data,
            phone: Array.isArray(data.phone) ? data.phone : [data.phone || ""],
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        toast.error("Error loading company details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const docRef = doc(db, "companyDetails", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, { ...companyDetails });
      } else {
        // Create new document
        await setDoc(docRef, { ...companyDetails });
      }

      setIsEditing(false);
      toast.success("Company details saved successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error("Error saving company details", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof CompanyDetails,
    value: string | string[]
  ) => {
    setCompanyDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addPhoneNumber = () => {
    setCompanyDetails((prev) => ({
      ...prev,
      phone: [...prev.phone, ""],
    }));
  };

  const removePhoneNumber = (index: number) => {
    setCompanyDetails((prev) => ({
      ...prev,
      phone: prev.phone.filter((_, i) => i !== index),
    }));
  };

  const updatePhoneNumber = (index: number, value: string) => {
    setCompanyDetails((prev) => ({
      ...prev,
      phone: prev.phone.map((phone, i) => (i === index ? value : phone)),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ClipLoader color="#000000" size={40} />
          <p className="mt-4 text-sm text-gray-500">
            Loading company details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 font-rubik-regular">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Company Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your company details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" />
              Back
            </button>
          )}
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
            className="inline-flex items-center cursor-pointer px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <ClipLoader color="#ffffff" size={16} className="mr-2" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <FiSave className="mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <FiEdit2 className="mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="p-8 space-y-6">
          <img src={logo} alt="logo" className="rounded-lg w-[70px]" />
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Company Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={companyDetails.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter company name"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {companyDetails.name || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Address
              </label>
              {isEditing ? (
                <textarea
                  value={companyDetails.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-4 text-sm py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                  rows={3}
                  placeholder="Enter company address"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {companyDetails.address || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Phone Number
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {companyDetails.phone.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          updatePhoneNumber(index, e.target.value)
                        }
                        className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                        placeholder="Enter phone number"
                      />
                      {companyDetails.phone.length > 1 && (
                        <button
                          onClick={() => removePhoneNumber(index)}
                          className="text-gray-600 hover:bg-red-100 rounded-lg p-2 cursor-pointer hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addPhoneNumber}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus className="mr-1" />
                    Add another phone number
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {companyDetails.phone.map((phone, index) => (
                    <p key={index} className="text-sm text-gray-900">
                      {phone || "Not set"}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={companyDetails.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 text-sm py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter email address"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {companyDetails.email || "Not set"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
