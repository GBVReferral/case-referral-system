import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Show SweetAlert loading
    Swal.fire({
      title: "Logging in...",
      text: "Please wait while we sign you in.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await signInWithEmailAndPassword(auth, email, password);

      Swal.close(); // Close loading alert
      Swal.fire({
        icon: "success",
        title: "Welcome back!",
        text: "You have successfully signed in.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.close(); // Close loading alert
      setErrorMessage(error.message);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Case Referral Sign In
        </h1>

        <form onSubmit={handleSignIn} className="flex flex-col gap-6">
          <div className="relative">
            <EnvelopeIcon className="absolute w-5 h-5 text-gray-400 left-0 top-1/2 transform -translate-y-1/2 ml-3" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 border-b border-gray-400 focus:outline-none focus:border-blue-600 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute w-5 h-5 text-gray-400 left-0 top-1/2 transform -translate-y-1/2 ml-3" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-10 pr-10 border-b border-gray-400 focus:outline-none focus:border-blue-600 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className={`w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {errorMessage && (
            <div className="flex items-start gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-1" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
