"use client";

import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import withAuth from "../../utils/withAuth";
import { Box, Typography, TextField, Button } from "@mui/material";

const Settings = () => {
  const handleSave = () => {
    // Implement save logic here
    console.log("Save settings");
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Settings
        </Typography>

        <Box display="flex" flexDirection="column" gap={4}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            defaultValue="user@example.com"
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            placeholder="Enter a new password"
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default withAuth(Settings);
