"use client";

import React, { useState } from "react";
import api from "../../utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container, Typography, TextField, Button, Paper, Box, Alert, Grid } from '@mui/material';

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
    <Container maxWidth={false} className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-center text-white" style={{ background: 'linear-gradient(to right, #1e1e2f, #2e2e3e)', textAlign: 'center', color: 'white' }}>
      <Typography variant="h3" component="h3" className="text-4xl font-bold">HookViewPro</Typography>
      <Box mt={4} mb={4} textAlign="center">
        <Typography variant="body1" fontSize="1rem">1. Manage your TradingView webhooks effortlessly and connect with MetaTrader 5 for plotting alerts in your trade terminal.</Typography>
        <Typography variant="body1" mt={2} fontSize="1rem">2. We offer trade execution for your TradingView alerts with custom stop loss and take profit levels for each asset and strategy.</Typography>
        <Typography variant="body1" mt={2} fontSize="1rem">3. Support for multiple trading accounts with any MetaTrader 5 broker. We are actively developing our product and features.</Typography>
      </Box>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="p-8 rounded-lg shadow-lg w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" component="h4" mb={2} className="text-1xl font-bold mb-6 text-gray-800">Register</Typography>
            {error && <Alert severity="error" className="mb-4">{error}</Alert>}
            {success && <Alert severity="success" className="mb-4">Registration successful!</Alert>}
            <form onSubmit={handleRegister}>
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
                Register
              </Button>
            </form>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="p-8 rounded-lg shadow-lg w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" component="h4" className="text-1xl font-bold mb-6 text-gray-800">Login</Typography>
            <Typography variant="body1" mb={4} mt={2} fontSize="1rem">Already have an account? Login now to access your dashboard!</Typography>
            <Link href="/login">
              <Button variant="outlined" color="secondary" fullWidth>
                Login
              </Button>
            </Link>
          </Paper>
        </Grid>
      </Grid>

    </Container>
  );
};

export default Register;
