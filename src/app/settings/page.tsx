"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import withAuth from "../../utils/withAuth";
import { Box, Typography, TextField, Button, Snackbar, Alert as MuiAlert, InputAdornment, IconButton } from "@mui/material";
import { AiOutlineCopy } from "react-icons/ai";
import api from "../../utils/api";

const Settings = () => {
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch user details on page load
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await api.get("/api/users/me"); // Adjust endpoint as necessary
        const { email, webhookUrl } = response.data;
        setEmail(email);
        setWebhookUrl(webhookUrl.replace("hookviewpro.com","api.hookviewpro.com") || ""); // Default to an empty string if not provided
      } catch (err) {
        console.error("Failed to fetch user details", err);
        setErrorMessage("Failed to load user details.");
      }
    };

    fetchUserDetails();
  }, []);

  const handleSave = async () => {
    try {
      const payload: any = { email };
      if (newPassword) payload.password = newPassword; // Only send password if it's updated

      await api.patch("/api/users/me", payload); // Adjust endpoint as necessary
      setSuccessMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Failed to save settings", err);
      setErrorMessage("Failed to save settings.");
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4} color="text-dark">
          Settings
        </Typography>

        <Box display="flex" flexDirection="column" gap={4}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Webhook URL"
            type="url"
            variant="outlined"
            fullWidth
            value={webhookUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleCopyToClipboard}>
                    <AiOutlineCopy color={copied ? "green" : "inherit"} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            type="password"
            variant="outlined"
            fullWidth
            placeholder="Enter a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>

        {/* Snackbar Notifications */}
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
        >
          <MuiAlert severity="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </MuiAlert>
        </Snackbar>
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={3000}
          onClose={() => setErrorMessage("")}
        >
          <MuiAlert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default withAuth(Settings);
