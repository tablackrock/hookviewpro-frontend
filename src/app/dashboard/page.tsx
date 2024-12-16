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
  InputAdornment,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { AiFillEdit, AiFillDelete, AiOutlineCopy, AiFillPlusCircle } from "react-icons/ai";
import { BsFillArchiveFill } from "react-icons/bs";

interface Alert {
  _id: string;
  payload: {
    strategy: string;
    asset: string;
    timeframe: string;
    ticker: string;
    interval: string;
    [key: string]: any;
  };
  receivedAt: string;
}

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState({
    strategy: "",
    asset: "",
    timeframe: "",
    direction: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [uniqueStrategies, setUniqueStrategies] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState<string[]>([]);

  const intervalMapping: { [key: string]: string } = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "4h": "240",
    "1d": "1440",
  };

  // Fetch alerts from API
  const [uniqueDirections, setUniqueDirections] = useState<string[]>([]);

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/api/alerts?limit=50");
      const fetchedAlerts = response.data;

      // Sort alerts by receivedAt in descending order
    const sortedAlerts = fetchedAlerts.sort(
      (a: Alert, b: Alert) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    setAlerts(sortedAlerts);
  
      const strategies = new Set<string>();
      const assets = new Set<string>();
      const directions = new Set<string>(); // New
  
      fetchedAlerts.forEach((alert: Alert) => {
        if (alert.payload.strategy) strategies.add(alert.payload.strategy);
        if (alert.payload.asset) assets.add(alert.payload.asset);
        if (alert.payload.direction) directions.add(alert.payload.direction); // New
      });
  
      setUniqueStrategies(Array.from(strategies));
      setUniqueAssets(Array.from(assets));
      setUniqueDirections(Array.from(directions)); // New
    } catch (err) {
      console.error("Failed to fetch alerts", err);
      setError("Failed to load alerts.");
    }
  };
  

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const { strategy, asset, timeframe } = filter;
    const matchesStrategy = strategy ? alert.payload.strategy === strategy : true;
    const matchesAsset = asset ? alert.payload.asset === asset : true;
    const matchesTimeframe = timeframe ? alert.payload.timeframe === timeframe : true;
    const matchesSearch = searchTerm
      ? JSON.stringify(alert.payload).toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesStrategy && matchesAsset && matchesTimeframe && matchesSearch;
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: string }>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Dashboard
        </Typography>

        <Box display="flex" gap={2} mb={4}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              name="strategy"
              value={filter.strategy}
              onChange={handleFilterChange as any}
              label="Strategy"
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStrategies.map((strategy) => (
                <MenuItem key={strategy} value={strategy}>
                  {strategy}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Asset</InputLabel>
            <Select
              name="asset"
              value={filter.asset}
              onChange={handleFilterChange as any}
              label="Asset"
            >
              <MenuItem value="">All</MenuItem>
              {uniqueAssets.map((asset) => (
                <MenuItem key={asset} value={asset}>
                  {asset}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              name="direction"
              value={filter.direction}
              onChange={handleFilterChange as any}
              label="Direction"
            >
              <MenuItem value="">All</MenuItem>
              {uniqueDirections.map((direction) => (
                <MenuItem key={direction} value={direction}>
                  {direction}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              name="timeframe"
              value={filter.timeframe}
              onChange={handleFilterChange as any}
              label="Timeframe"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1m">1 Minute</MenuItem>
              <MenuItem value="5m">5 Minutes</MenuItem>
              <MenuItem value="15m">15 Minutes</MenuItem>
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="4h">4 Hours</MenuItem>
              <MenuItem value="1d">1 Day</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
            }}
          />
        </Box>

        <Grid container spacing={4}>
          {filteredAlerts.map((alert) => (
            <Grid item xs={12} md={6} lg={4} key={alert._id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {alert.payload.strategy || "Unknown Strategy"}
                  </Typography>
                  <Typography variant="body2">
                    Asset: {alert.payload.asset || "Unknown Asset"}
                  </Typography>
                  <Typography variant="body2">
                    Timeframe: {alert.payload.timeframe || "Unknown Timeframe"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Received: {new Date(alert.receivedAt).toLocaleString()}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    href={`https://www.tradingview.com/chart?symbol=${alert.payload.asset}&interval=${intervalMapping[alert.payload.timeframe.toLowerCase()]}`}
                    target="_blank"
                    sx={{ mt: 1 }}
                  >
                    Open in TradingView
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

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

export default withAuth(Dashboard);
