import { useEffect, useState } from "react";

export const ScreenSizeRestriction = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsScreenTooSmall(window.innerWidth <= 786);
    };

    // Check initially
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isScreenTooSmall) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Screen Size Not Supported
          </h1>
          <p className="text-gray-600 mb-4">
            This application requires a minimum screen width of 787px for
            optimal functionality. Please access this application from a device
            with a larger screen.
          </p>
          <div className="text-sm text-gray-500">
            Current screen width: {window.innerWidth}px
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
