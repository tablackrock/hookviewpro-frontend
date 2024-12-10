import React from "react";
import Link from "next/link";

const Home = () => {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-background">
      <h1 className="text-3xl font-bold mb-4">Welcome to HookViewPro</h1>
      <p className="text-lg mb-6">Manage your TradingView webhooks effortlessly.</p>
      <div>
      <Link
        href="/dashboard"
        className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary"
      >
        Go to Dashboard
      </Link>

      </div>
    </main>
  );
};

export default Home;
