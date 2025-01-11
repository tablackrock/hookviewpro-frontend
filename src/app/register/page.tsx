"use client";

import React, { useState } from "react";
import api from "../../utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Register = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/users/register", { email, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-center text-white">
      <h1 className="text-4xl font-bold mb-2">HookViewPro</h1>
      <div className="mt-8 mb-8 text-lg" style={{ padding: "4" }}>
        <p>Manage your TradingView webhooks effortlessly and connect with MetaTrader 5 for plotting alerts in your trade terminal.</p>
        <p className="mt-4">We offer trade execution for your TradingView alerts with custom stop loss and take profit levels for each asset and strategy.</p>
        <p className="mt-4">Support for multiple trading accounts with any MetaTrader 5 broker. We are actively developing our product and features.</p>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">Registration successful!</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded p-2 w-full text-gray-700"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded p-2 w-full text-gray-700"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary w-full mb-4"
          >
            Register
          </button>
        </form>
        <Link href="/login">
          <button className="bg-secondary text-white px-4 py-2 rounded hover:bg-primary w-full block text-center">
            Login
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Register;
