"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import withAuth from "../../utils/withAuth";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Tooltip,
  Modal,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";
import { AiFillEdit, AiFillDelete, AiOutlineCopy } from "react-icons/ai";
import { BsFillArchiveFill } from "react-icons/bs";

const Configurations = () => {
  const [configurations, setConfigurations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [newConfig, setNewConfig] = useState({
    name: "",
    description: "",
    strategy: "",
    asset: "",
    timeframe: "",
  });
  const [generatedJson, setGeneratedJson] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch configurations from API
  const fetchConfigurations = async () => {
    try {
      const response = await api.get("api/configurations");
      setConfigurations(response.data);
    } catch (err) {
      console.error("Failed to fetch configurations", err);
      setError("Failed to load configurations.");
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Delete configuration by ID
  const handleDelete = async (id) => {
    try {
      await api.delete(`api/configurations/${id}`);
      setSuccess("Configuration deleted successfully.");
      fetchConfigurations(); // Refresh configurations
    } catch (err) {
      console.error("Failed to delete configuration", err);
      setError("Failed to delete configuration.");
    }
  };

  // Open modal for viewing/editing configuration
  const handleOpenEditModal = (config) => {
    setEditMode(true);
    setCurrentConfig(config);
    setNewConfig({
      name: config.name,
      description: config.description,
      strategy: config.strategy,
      asset: config.asset,
      timeframe: config.timeframe,
    });
    setGeneratedJson(config.jsonTemplate);
    setOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setOpen(false);
    setEditMode(false);
    setCurrentConfig(null);
    setNewConfig({ name: "", description: "", strategy: "", asset: "", timeframe: "" });
    setGeneratedJson("");
  };

  // Update configuration
  const handleUpdateConfiguration = async () => {
    if (!currentConfig) return;

    try {
      const payload = {
        ...newConfig,
        jsonTemplate: generatedJson,
      };
      await api.patch(`api/configurations/${currentConfig._id}`, payload);
      setSuccess("Configuration updated successfully.");
      fetchConfigurations(); // Refresh configurations
      handleCloseModal();
    } catch (err) {
      console.error("Failed to update configuration", err);
      setError("Failed to update configuration.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewConfig({ ...newConfig, [name]: value });
  };

  const generateJsonTemplate = () => {
    const jsonTemplate = {
      strategy: newConfig.strategy,
      asset: newConfig.asset,
      timeframe: newConfig.timeframe,
      name: newConfig.name,
    };
    setGeneratedJson(JSON.stringify(jsonTemplate, null, 2));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Configurations
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
          {configurations.map((config) => (
            <Card key={config._id} variant="outlined" sx={{ p: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {config.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {config.description || "No description provided"}
                </Typography>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Tooltip title="Edit/View">
                    <IconButton color="primary" onClick={() => handleOpenEditModal(config)}>
                      <AiFillEdit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDelete(config._id)}>
                      <AiFillDelete />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Archive">
                    <IconButton color="secondary" onClick={() => console.log("Archive", config._id)}>
                      <BsFillArchiveFill />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Modal for Viewing/Editing Configuration */}
        <Modal open={open} onClose={handleCloseModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              width: 400,
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>
              {editMode ? "Edit Configuration" : "View Configuration"}
            </Typography>
            <TextField
              label="Name"
              name="name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.name}
              onChange={handleInputChange}
              disabled={!editMode}
            />
            <TextField
              label="Description"
              name="description"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.description}
              onChange={handleInputChange}
              disabled={!editMode}
            />
            <FormControl fullWidth margin="normal" disabled={!editMode}>
              <InputLabel>Strategy</InputLabel>
              <Select
                name="strategy"
                value={newConfig.strategy}
                onChange={handleInputChange}
              >
                <MenuItem value="Moving Average">Moving Average</MenuItem>
                <MenuItem value="RSI">RSI</MenuItem>
                <MenuItem value="MACD">MACD</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Asset"
              name="asset"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.asset}
              onChange={handleInputChange}
              disabled={!editMode}
            />
            <FormControl fullWidth margin="normal" disabled={!editMode}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                name="timeframe"
                value={newConfig.timeframe}
                onChange={handleInputChange}
              >
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", bgcolor: "#f4f6f8", p: 2, borderRadius: 1 }}>
              {generatedJson}
            </Typography>
            {editMode && (
              <Button
                
                variant="outlined"
                color={copied ? "success" : "primary"}
                startIcon={<AiOutlineCopy />}
                onClick={handleCopy}
                sx={{ mt: 1 }}
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            )}
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button onClick={handleCloseModal} variant="outlined" color="error">
                Cancel
              </Button>
              {editMode && (
                <Button onClick={handleUpdateConfiguration} variant="contained" color="primary">
                  Save
                </Button>
              )}
            </Box>
          </Box>
        </Modal>

        {/* Snackbar Notifications */}
        <Snackbar
          open={Boolean(success)}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
        >
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        </Snackbar>
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

export default withAuth(Configurations);
