"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import withAuth from "../../utils/withAuth";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { AiOutlineCopy } from "react-icons/ai";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [stats, setStats] = useState({ configurations: 0, alerts: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("api/dashboard");
        setWebhookUrl(response.data.webhookUrl);
        setStats(response.data.stats);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Dashboard
        </Typography>

        <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Your Webhook URL
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1" sx={{ overflowWrap: "break-word" }}>
              {webhookUrl}
            </Typography>
            <Button
              variant="contained"
              color={copied ? "success" : "primary"}
              startIcon={<AiOutlineCopy />}
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Box>
        </Card>

        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card variant="outlined" sx={{ bgcolor: "#007BFF", color: "#fff", p: 2 }}>
              <CardContent>
                <Typography variant="h6">Active Configurations</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {stats.configurations}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card variant="outlined" sx={{ bgcolor: "#6A0DAD", color: "#fff", p: 2 }}>
              <CardContent>
                <Typography variant="h6">Alerts Received</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {stats.alerts}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default withAuth(Dashboard);
