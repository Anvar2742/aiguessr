import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Please check your inbox.");
      setError(""); // Clear any previous errors
    } catch (err: any) {
      setError(err.message);
      setMessage(""); // Clear any previous messages
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Enter your email"
              required
            />
          </div>
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:ring focus:ring-indigo-200 focus:outline-none"
            >
              Send Reset Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
