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
import { AiFillEdit, AiFillDelete, AiOutlineCopy } from "react-icons/ai";
import { BsFillArchiveFill } from "react-icons/bs";

// Define the configuration type
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

  // Delete configuration by ID
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/configurations/${id}`);
      setSuccess("Configuration deleted successfully.");
      fetchConfigurations(); // Refresh configurations
    } catch (err) {
      console.error("Failed to delete configuration", err);
      setError("Failed to delete configuration.");
    }
  };

  // Open modal for viewing/editing configuration
  const handleOpenEditModal = (config: Configuration) => {
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
      await api.patch(`/api/configurations/${currentConfig._id}`, payload);
      setSuccess("Configuration updated successfully.");
      fetchConfigurations(); // Refresh configurations
      handleCloseModal();
    } catch (err) {
      console.error("Failed to update configuration", err);
      setError("Failed to update configuration.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setNewConfig({ ...newConfig, [name]: value as string });
    }
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
            </Grid>
          ))}
        </Grid>

        {/* Modal and Snackbar logic remains unchanged */}
      </Box>
    </Box>
  );
};

export default withAuth(Configurations);
