"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import withAuth from "../../utils/withAuth";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Button,
  Tooltip,
  Drawer,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  TableContainer,
  Paper,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { AiFillEdit, AiFillDelete, AiOutlineCopy, AiFillPlusCircle } from "react-icons/ai";
import { BsFillArchiveFill } from "react-icons/bs";
import { capitalizeFirstLetter } from "../../utils/utils";

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
  createdAt: string;
}

interface Alert {
  _id: string;
  configurationId: string;
  receivedAt: string;
}

const Configurations: React.FC = () => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentConfig, setCurrentConfig] = useState<Configuration | null>(null);
  const [newConfig, setNewConfig] = useState<Omit<Configuration, "_id" | "jsonTemplate">>({
    name: "",
    description: "",
    strategy: "",
    asset: "",
    timeframe: "",
    status: "active",
    direction: "",
    createdAt: "",
  });
  const [generatedJson, setGeneratedJson] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<keyof Configuration | "totalAlerts" | "lastAlert">("name");

  // Fetch configurations and alerts from API
  const fetchConfigurations = async () => {
    try {
      const response = await api.get("/api/configurations");
      setConfigurations(response.data);
    } catch (err) {
      console.error("Failed to fetch configurations", err);
      setError("Failed to load configurations.");
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/api/alerts");
      setAlerts(response.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
      setError("Failed to load alerts.");
    }
  };

  useEffect(() => {
    fetchConfigurations();
    fetchAlerts();
  }, []);

  // Open drawer for adding or editing a configuration
  const handleOpenDrawer = (config: Configuration | null) => {
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
        createdAt: config.createdAt,
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
        createdAt: new Date().toISOString(),
      });
      setGeneratedJson("");
    }
    setDrawerOpen(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Save configuration
  const handleSaveConfiguration = async () => {
    try {
      const payload = { ...newConfig, jsonTemplate: JSON.parse(generatedJson) };
      payload.strategy = payload.name;
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
      handleCloseDrawer();
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
      createdAt: config.createdAt || new Date().toISOString(),
    };
    setGeneratedJson(JSON.stringify(template, null, 2));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get total alerts and last alert for a configuration
  const getTotalAlerts = (configId: string) => {
    return alerts.filter(alert => alert.configurationId === configId).length;
  };

  const getLastAlert = (configId: string) => {
    const configAlerts = alerts.filter(alert => alert.configurationId === configId);
    if (configAlerts.length === 0) return "No alerts received";
    return new Date(configAlerts[0].receivedAt).toLocaleString();
  };

  // Sorting
  const handleRequestSort = (property: keyof Configuration | "totalAlerts" | "lastAlert") => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedConfigurations = configurations.sort((a, b) => {
    if (orderBy === "name") {
      return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (orderBy === "asset") {
      return order === "asc" ? a.asset.localeCompare(b.asset) : b.asset.localeCompare(a.asset);
    }
    if (orderBy === "timeframe") {
      return order === "asc" ? a.timeframe.localeCompare(b.timeframe) : b.timeframe.localeCompare(a.timeframe);
    }
    if (orderBy === "status") {
      return order === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    if (orderBy === "totalAlerts") {
      return order === "asc" ? getTotalAlerts(a._id) - getTotalAlerts(b._id) : getTotalAlerts(b._id) - getTotalAlerts(a._id);
    }
    if (orderBy === "lastAlert") {
      return order === "asc" ? new Date(getLastAlert(a._id)).getTime() - new Date(getLastAlert(b._id)).getTime() : new Date(getLastAlert(b._id)).getTime() - new Date(getLastAlert(a._id)).getTime();
    }
    if (orderBy === "createdAt") {
      return order === "asc" ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (orderBy === "direction") {
      return order === "asc" ? a.direction.localeCompare(b.direction) : b.direction.localeCompare(a.direction);
    }
    return 0;
  });

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4} color="textSecondary">
          Configurations
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AiFillPlusCircle />}
          onClick={() => handleOpenDrawer(null)}
          sx={{ mb: 2 }}
        >
          Add New Configuration
        </Button>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={() => handleRequestSort("name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "asset"}
                    direction={orderBy === "asset" ? order : "asc"}
                    onClick={() => handleRequestSort("asset")}
                  >
                    Asset
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "timeframe"}
                    direction={orderBy === "timeframe" ? order : "asc"}
                    onClick={() => handleRequestSort("timeframe")}
                  >
                    Timeframe
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "status"}
                    direction={orderBy === "status" ? order : "asc"}
                    onClick={() => handleRequestSort("status")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "totalAlerts"}
                    direction={orderBy === "totalAlerts" ? order : "asc"}
                    onClick={() => handleRequestSort("totalAlerts")}
                  >
                    Total Alerts
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "lastAlert"}
                    direction={orderBy === "lastAlert" ? order : "asc"}
                    onClick={() => handleRequestSort("lastAlert")}
                  >
                    Last Alert
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "createdAt"}
                    direction={orderBy === "createdAt" ? order : "asc"}
                    onClick={() => handleRequestSort("createdAt")}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "direction"}
                    direction={orderBy === "direction" ? order : "asc"}
                    onClick={() => handleRequestSort("direction")}
                  >
                    Direction
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedConfigurations.map((config) => (
                <TableRow key={config._id}>
                  <TableCell>{config.name}</TableCell>
                  <TableCell>{config.asset}</TableCell>
                  <TableCell>{config.timeframe}</TableCell>
                  <TableCell>{capitalizeFirstLetter(config.status)}</TableCell>
                  <TableCell>{getTotalAlerts(config._id)}</TableCell>
                  <TableCell>{getLastAlert(config._id)}</TableCell>
                  <TableCell>{new Date(config.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{capitalizeFirstLetter(config.direction)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit/View">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDrawer(config)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Drawer for Add/Edit */}
        <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
          <Box
            sx={{
              width: 500,
              p: 4,
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
              <Button onClick={handleCloseDrawer} variant="outlined" color="error">
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
        </Drawer>

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
