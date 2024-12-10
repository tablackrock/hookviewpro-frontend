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
  Grid,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { AiFillEdit, AiFillDelete, AiOutlineCopy, AiFillPlusCircle } from "react-icons/ai";
import { BsFillArchiveFill } from "react-icons/bs";

interface Configuration {
  _id: string;
  name: string;
  description?: string;
  strategy: string;
  asset: string;
  timeframe: string;
  jsonTemplate?: string;
}

const Configurations: React.FC = () => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentConfig, setCurrentConfig] = useState<Configuration | null>(null);
  const [newConfig, setNewConfig] = useState<Omit<Configuration, "_id" | "jsonTemplate">>({
    name: "",
    description: "",
    strategy: "",
    asset: "",
    timeframe: "",
  });
  const [generatedJson, setGeneratedJson] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch configurations from API
  const fetchConfigurations = async () => {
    try {
      const response = await api.get("/api/configurations");
      setConfigurations(response.data);
    } catch (err) {
      console.error("Failed to fetch configurations", err);
      setError("Failed to load configurations.");
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Generate JSON Template
  const generateJsonTemplate = () => {
    const jsonTemplate = {
      strategy: newConfig.strategy || "Unknown",
      asset: newConfig.asset || "Unknown",
      timeframe: newConfig.timeframe || "Unknown",
      name: newConfig.name || "Unnamed Configuration",
    };
    setGeneratedJson(JSON.stringify(jsonTemplate, null, 2));
  };

  // Open modal for adding or editing a configuration
  const handleOpenModal = (config: Configuration | null) => {
    if (config) {
      setEditMode(true);
      setCurrentConfig(config);
      setNewConfig({
        name: config.name,
        description: config.description || "",
        strategy: config.strategy,
        asset: config.asset,
        timeframe: config.timeframe,
      });
      setGeneratedJson(config.jsonTemplate || "");
    } else {
      setEditMode(false);
      setCurrentConfig(null);
      setNewConfig({ name: "", description: "", strategy: "", asset: "", timeframe: "" });
      setGeneratedJson("");
    }
    setOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setOpen(false);
  };

  // Save configuration
  const handleSaveConfiguration = async () => {
    try {
      const payload = { ...newConfig, jsonTemplate: generatedJson };

      if (editMode && currentConfig) {
        // Update existing configuration
        await api.patch(`/api/configurations/${currentConfig._id}`, payload);
        setSuccess("Configuration updated successfully.");
      } else {
        // Create new configuration
        await api.post("/api/configurations", payload);
        setSuccess("Configuration created successfully.");
      }

      fetchConfigurations();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save configuration", err);
      setError("Failed to save configuration.");
    }
  };

  // Handle input changes for text fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name) {
      setNewConfig((prev) => {
        const updatedConfig = { ...prev, [name]: value };
        setGeneratedJson(
          JSON.stringify(
            {
              strategy: updatedConfig.strategy,
              asset: updatedConfig.asset,
              timeframe: updatedConfig.timeframe,
              name: updatedConfig.name,
            },
            null,
            2
          )
        );
        return updatedConfig;
      });
    }
  };

  // Handle input changes for select fields
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setNewConfig((prev) => {
        const updatedConfig = { ...prev, [name]: value };
        setGeneratedJson(
          JSON.stringify(
            {
              strategy: updatedConfig.strategy,
              asset: updatedConfig.asset,
              timeframe: updatedConfig.timeframe,
              name: updatedConfig.name,
            },
            null,
            2
          )
        );
        return updatedConfig;
      });
    }
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

        <Button
          variant="contained"
          color="primary"
          startIcon={<AiFillPlusCircle />}
          onClick={() => handleOpenModal(null)}
          sx={{ mb: 2 }}
        >
          Add New Configuration
        </Button>

        <Grid container spacing={4}>
          {configurations.map((config) => (
            <Grid item xs={12} md={6} lg={4} key={config._id}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {config.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {config.description || "No description provided"}
                  </Typography>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Tooltip title="Edit/View">
                      <IconButton color="primary" onClick={() => handleOpenModal(config)}>
                        <AiFillEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error">
                        <AiFillDelete />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archive">
                      <IconButton color="secondary">
                        <BsFillArchiveFill />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Modal for Add/Edit */}
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
              {editMode ? "Edit Configuration" : "Add New Configuration"}
            </Typography>
            <TextField
              label="Name"
              name="name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.name}
              onChange={handleInputChange}
            />
            <TextField
              label="Description"
              name="description"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.description}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Strategy</InputLabel>
              <Select
                name="strategy"
                value={newConfig.strategy}
                onChange={handleSelectChange}
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
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Timeframe</InputLabel>
              <Select
                name="timeframe"
                value={newConfig.timeframe}
                onChange={handleSelectChange}
              >
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", bgcolor: "#f4f6f8", p: 2, borderRadius: 1, mt: 2 }}
            >
              {generatedJson}
            </Typography>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button onClick={handleCloseModal} variant="outlined" color="error">
                Cancel
              </Button>

              
              <Button
                onClick={handleCopy}
                variant="contained"
                color={copied ? "success" : "primary"}
                startIcon={<AiOutlineCopy />}
              >
                {copied ? "Copied!" : "Copy JSON"}
              </Button>

              <Button
                onClick={handleSaveConfiguration}
                variant="contained"
                color="primary"
                sx={{ ml: 2 }}
              >
                Save Configuration
              </Button>

            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default withAuth(Configurations);
