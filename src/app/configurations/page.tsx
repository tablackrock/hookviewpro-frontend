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
  status: string;
  direction: string;
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
    status: "active",
    direction:"",
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

  // Open modal for adding or editing a configuration
  const handleOpenModal = (config: Configuration | null) => {
    if (config) {
      generateJsonTemplate(config);
      setEditMode(true);
      setCurrentConfig(config);
      setNewConfig({
        name: config.name,
        description: config.description || "",
        strategy: config.name || "",
        asset: config.asset,
        timeframe: config.timeframe,
        status: config.status,
        direction: config.direction || "",
      });
    
      
    } else {
      setEditMode(false);
      setCurrentConfig(null);
      setNewConfig({
        name: "",
        description: "",
        strategy: "",
        asset: "",
        timeframe: "",
        status: "active",
        direction: "",
      });
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
      const payload = { ...newConfig, jsonTemplate: JSON.parse(generatedJson) };
      payload.strategy = payload.name
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

  // Delete configuration
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/configurations/${id}`);
      setSuccess("Configuration deleted successfully.");
      fetchConfigurations();
    } catch (err) {
      console.error("Failed to delete configuration", err);
      setError("Failed to delete configuration.");
    }
  };

  // Archive configuration
  const handleArchive = async (id: string) => {
    try {
      await api.post(`/api/configurations/archive/${id}`);
      setSuccess("Configuration archived successfully.");
      fetchConfigurations();
    } catch (err) {
      console.error("Failed to archive configuration", err);
      setError("Failed to archive configuration.");
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewConfig((prev) => ({ ...prev, [name]: value }));
    generateJsonTemplate({ ...newConfig, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewConfig((prev) => ({ ...prev, [name]: value }));
    generateJsonTemplate({ ...newConfig, [name]: value });
  };

  // Generate JSON template dynamically
  const generateJsonTemplate = (config: Partial<Configuration>) => {
    const template = {
      close: "{{close}}",
      open: "{{open}}",
      high: "{{high}}",
      low: "{{low}}",
      time: "{{time}}",
      ticker: "{{ticker}}",
      interval: "{{interval}}",
      volume: "{{volume}}",
      strategy: config.name || "",
      asset: config.asset || "",
      timeframe: config.timeframe || "",
      description: config.description || "",
      status: config.status || "active",
      direction: config.direction || "",
    };
    setGeneratedJson(JSON.stringify(template, null, 2));
  };
  

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={1} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h5" fontWeight="bold" mb={1}>
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
            <Grid item xs={12} md={2} lg={2} key={config._id}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {config.name} - {config.asset || "No asset provided"} - {config.direction || "No direction provided"}
                  </Typography>
                
                  <Typography variant="body2" color="textSecondary">
                    Timeframe : {config.timeframe || "No timeframe" }
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                  Description : {config.description || "No description provided"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {config.status}
                  </Typography>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Tooltip title="Edit/View">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenModal(config)}
                      >
                        <AiFillEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(config._id)}
                      >
                        <AiFillDelete />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archive">
                      <IconButton
                        color="secondary"
                        onClick={() => handleArchive(config._id)}
                      >
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
              p: 5,
              width: 500,
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
            <TextField
              label="Timeframe"
              name="timeframe"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newConfig.timeframe}
              onChange={handleInputChange}
            />
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
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newConfig.status}
                onChange={handleSelectChange}
              >
                             <MenuItem value="active">Active</MenuItem>
             <MenuItem value="disabled">Disabled</MenuItem>
             <MenuItem value="archived">Archived</MenuItem>
           </Select>
         </FormControl>

         <FormControl fullWidth margin="normal">
              <InputLabel>Direction</InputLabel>
              <Select
                name="direction"
                value={newConfig.direction}
                onChange={handleSelectChange}
              >
                             <MenuItem value="buy">Buy</MenuItem>
             <MenuItem value="sell">Sell</MenuItem>
           </Select>
         </FormControl>

         <Typography variant="body2" mt={3} mb={1} fontWeight="bold">
           Generated JSON:
         </Typography>
         <Box
           component="pre"
           bgcolor="#f4f6f8"
           p={2}
           borderRadius={2}
           sx={{ overflow: "auto", maxHeight: 150 }}
         >
           {generatedJson}
         </Box>
         <Button
           variant="outlined"
           color={copied ? "success" : "primary"}
           startIcon={<AiOutlineCopy />}
           onClick={handleCopy}
           sx={{ mt: 1 }}
         >
           {copied ? "Copied!" : "Copy to Clipboard"}
         </Button>

         <Box mt={2} display="flex" justifyContent="space-between">
           <Button onClick={handleCloseModal} variant="outlined" color="error">
             Cancel
           </Button>
           <Button
             onClick={handleSaveConfiguration}
             variant="contained"
             color="primary"
           >
             Save Configuration
           </Button>
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
