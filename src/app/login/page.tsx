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
    <Container maxWidth={false} className="flex flex-col items-center justify-center h-screen" style={{ background: 'linear-gradient(to right, #1e1e2f, #2e2e3e)', textAlign: 'center', color: 'white' }}>
      <Typography variant="h4" component="h4" className="text-4xl font-bold mb-1">HookViewPro</Typography>
      <Box mt={2} mb={2} textAlign="center">
        <Typography variant="body1">1. Manage your TradingView webhooks effortlessly and connect with MetaTrader 5 for plotting alerts in your trade terminal.</Typography>
        <Typography variant="body1" mt={1}>2. We offer trade execution for your TradingView alerts with custom stop loss and take profit levels for each asset and strategy.</Typography>
        <Typography variant="body1" mt={1}>3. Support for multiple trading accounts with any MetaTrader 5 broker. We are actively developing our product and features.</Typography>
      </Box>
      <Paper elevation={3} className="p-4 rounded-lg shadow-lg w-full max-w-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h5" component="h5" className="text-3xl font-bold mb-6 text-gray-800">Login</Typography>
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
      <Paper elevation={3} className="p-4 rounded-lg shadow-lg w-full max-w-md mt-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h5" component="h5" className="text-3xl font-bold mb-6 text-gray-800">Register</Typography>
        <Typography variant="body1" mb={2}>Register for beta access now and be the first to experience our new features!</Typography>
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
