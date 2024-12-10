"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  // Fetch alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get("/api/alerts");
        setAlerts(response.data);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
        setError("Failed to load alerts.");
      }
    };

    fetchAlerts();
  }, []);

  // Format receivedAt date
  const formatDate = (dateString: string) => {
    try {
      const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Alerts
        </Typography>

        <Grid container spacing={4}>
          {alerts.map((alert, index) => (
            <Grid item xs={12} md={6} lg={4} key={alert.id || index}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {alert.payload?.strategy || "No strategy"}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {alert.payload?.asset || "No asset"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(alert.receivedAt)}
                  </Typography>
                  <Typography variant="body1" mt={2}>
                    {JSON.stringify(alert.payload, null, 2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Snackbar Notifications */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={3000}
          onClose={() => setError("")}
        >
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Alerts;
