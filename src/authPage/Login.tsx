import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import logo from "../assets/logo.png";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/init";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  rememberMe: Yup.boolean(),
});

const STORAGE_KEY = "login_credentials";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const [initialValues, setInitialValues] = useState<LoginFormValues>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored credentials on component mount
    const storedCredentials = localStorage.getItem(STORAGE_KEY);
    if (storedCredentials) {
      try {
        const { email, password, rememberMe } = JSON.parse(storedCredentials);
        if (rememberMe) {
          setInitialValues({ email, password, rememberMe });
        }
      } catch (err) {
        console.error("Error parsing stored credentials:", err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const user = userCredential.user;
      const token = await user.getIdToken(); // fetch Firebase auth token

      // Store user in context
      login({ user, token });

      // Optionally remember login form
      if (values.rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-rubik-regular flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-[1200px] h-[2000px] bg-[conic-gradient(at_top_left,#333333,#000000,#444444,#111111,#222222,#505050)] blur-[120px] opacity-80 -translate-x-[20%] -translate-y-[60%]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[200%] h-[180vh] bg-white transform translate-y-[20%] rotate-[-5deg] origin-top-right" />
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 relative">
        <img src={logo} alt="logo" className="rounded-lg w-[50px]" />
        <div className="text-start mb-6">
          <h1 className="text-md font-[family-name:var(--font-neue-montreal)] text-gray-900">
            Sign in to your account
          </h1>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black"
                >
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 outline-none text-black px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black"
                >
                  Password
                </label>
                <div className="relative">
                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 outline-none text-black px-3 py-2 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer inset-y-0 right-0 flex items-center pr-3 mt-1"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <HiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs bg-red-500/20 font-rubik-regular p-3 rounded-[8px]">
                  Invalid Email or Password. Please Enter the correct
                  credientials.
                </div>
              )}

              <div className="flex items-center">
                <Field
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  disabled={isLoading}
                  className="h-4 w-4 rounded cursor-pointer border-gray-300 text-black focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full flex cursor-pointer justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>

      {/* Info box */}
      <div className="mt-6 max-w-md text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-200 relative">
        <p>
          If you use two-step authentication,{" "}
          <a href="#" className="text-black hover:text-gray-700">
            keep your backup codes in a secure place
          </a>
          . They can help you recover access to your account if you get locked
          out.
        </p>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex gap-4 text-sm text-gray-600 relative">
        <a href="#" className="hover:text-gray-900">
          Contact
        </a>
        <span>·</span>
        <a href="#" className="hover:text-gray-900">
          Privacy & terms
        </a>
      </div>

      {/* Powered by text */}
      <div className="fixed bottom-4 text-sm text-gray-600">
        Powered by TechTrove Tech
      </div>
    </div>
  );
};
