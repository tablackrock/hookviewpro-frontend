import React from "react";
import Link from "next/link";

const Home = () => {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-center text-white">
      <h1 className="text-5xl font-bold mb-6">Welcome to HookViewPro</h1>
      <p className="text-xl mb-6">
        Manage your TradingView webhooks effortlessly and connect with MetaTrader 5 for plotting alerts in your trade terminal.
      </p>
      <p className="text-lg mb-6">
        We offer trade execution for your TradingView alerts with custom stop loss and take profit levels for each asset and strategy.
      </p>
      <p className="text-lg mb-6">
        Support for multiple trading accounts with any MetaTrader 5 broker. We are actively developing our product and features.
      </p>
      <div className="flex gap-4">
        <Link href="/login" legacyBehavior>
          <a className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary">
            Login
          </a>
        </Link>
        <Link href="/register" legacyBehavior>
          <a className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary">
            Register
          </a>
        </Link>
        <Link href="/dashboard" legacyBehavior>
          <a className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary">
            Go to Dashboard
          </a>
        </Link>
      </div>
    </main>
  );
};

export default Home;
