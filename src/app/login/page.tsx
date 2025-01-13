"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Typography, TextField, Button, Paper, Box, Alert } from '@mui/material';

const Login = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/users/login", { email, password });
      login(response.data.token, { email });
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <Container maxWidth={false} className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-center text-white">
      <Typography variant="h3" component="h3" className="text-4xl font-bold mb-1">HookViewPro</Typography>
      <Box mt={4} mb={4} textAlign="center">
        <Typography variant="body1">1. Manage your TradingView webhooks effortlessly and connect with MetaTrader 5 for plotting alerts in your trade terminal.</Typography>
        <Typography variant="body1" mt={2}>2. We offer trade execution for your TradingView alerts with custom stop loss and take profit levels for each asset and strategy.</Typography>
        <Typography variant="body1" mt={2}>3. Support for multiple trading accounts with any MetaTrader 5 broker. We are actively developing our product and features.</Typography>
      </Box>
      <Paper elevation={3} className="p-8 rounded-lg shadow-lg w-full max-w-md">
        <Typography variant="h4" component="h4" className="text-3xl font-bold mb-6 text-gray-800">Login</Typography>
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <Box mb={4}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              fullWidth
              required
            />
          </Box>
          <Box mb={4}>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              fullWidth
              required
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="mb-4"
          >
            Login
          </Button>
        </form>
      </Paper>
      <Paper elevation={3} className="p-8 rounded-lg shadow-lg w-full max-w-md mt-4">
        <Typography variant="h4" component="h4" className="text-3xl font-bold mb-6 text-gray-800">Register</Typography>
        <Typography variant="body1" mb={4}>Register for beta access now and be the first to experience our new features!</Typography>
        <Link href="/register">
          <Button variant="outlined" color="secondary" fullWidth>
            Register
          </Button>
        </Link>
      </Paper>
    </Container>
  );
};

export default Login;
