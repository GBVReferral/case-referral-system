import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EnvelopeIcon, LockClosedIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Case Referral Sign In</h1>

        <form onSubmit={handleSignIn} className="flex flex-col gap-6">
          <div className="relative">
            <EnvelopeIcon className="absolute w-5 h-5 text-gray-400 left-0 top-1/2 transform -translate-y-1/2 ml-3" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 border-b border-gray-400 focus:outline-none focus:border-blue-600 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute w-5 h-5 text-gray-400 left-0 top-1/2 transform -translate-y-1/2 ml-3" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 border-b border-gray-400 focus:outline-none focus:border-blue-600 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
          >
             Sign In
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
