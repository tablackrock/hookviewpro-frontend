"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const withAuth = (Component: React.ComponentType) => {
  return (props: any) => {
    const { token } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
      if (!token) {
        router.push("/login");
      }
    }, [token, router]);

    if (!token) return null;
    return <Component {...props} />;
  };
};

export default withAuth;
