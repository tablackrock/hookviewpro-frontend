"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import withAuth from "../../utils/withAuth";
import { capitalizeFirstLetter,formatDate, formatStringLower,getSupertrendStatusColor } from "@/utils/utils";
import { BsCircleFill } from "react-icons/bs";

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
    status: string;
    volume: number;
    [key: string]: any;
  };
  status: string;
  receivedAt: string;
}

interface SuperTrends{
  _id: string;
  asset: string;
  changed: string;
  trend: string;
  timeframe: string;
}

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [superTrends, setSuperTrends] = useState<SuperTrends[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [filter, setFilter] = useState({
    strategy: "",
    asset: "",
    timeframe: "",
    direction: "",
    status:"",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [uniqueStrategies, setUniqueStrategies] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState<string[]>([]);
  const [uniqueStatus, setUniqueStatus] = useState<string[]>([]);
  

  const intervalMapping: { [key: string]: string } = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "h1": "60",
    "4h": "240",
    "1d": "1440",
  };

  // Fetch alerts from API
  const [uniqueDirections, setUniqueDirections] = useState<string[]>([]);

  const fetchSuperTrends = async () => {
    try {
      const response = await api.get("api/data/supertrend");
      const fetchedSuperTrends = response.data;
  
      setSuperTrends(fetchedSuperTrends);
  
    } catch (err) {
      console.error("Failed to fetch superTrends", err);
      setError("Failed to load supertTrends.");
    }
  }

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
      const directions = new Set<string>();
      const alertStatus = new Set<string>();
  
      // Use sortedAlerts for processing
      sortedAlerts.forEach((alert: Alert) => {
        if (alert.payload.strategy) strategies.add(alert.payload.strategy);
        if (alert.payload.asset) assets.add(alert.payload.asset);
        if (alert.payload.direction) directions.add(alert.payload.direction);
        if (alert.status) alertStatus.add(alert.status);
      });
  
      setUniqueStrategies(Array.from(strategies));
      setUniqueAssets(Array.from(assets));
      setUniqueDirections(Array.from(directions));
      setUniqueStatus(Array.from(alertStatus));
    } catch (err) {
      console.error("Failed to fetch alerts", err);
      setError("Failed to load alerts.");
    }
  };
  

  useEffect(() => {
    fetchAlerts();
    fetchSuperTrends();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const { strategy, asset, timeframe, direction, status } = filter;

    const allowedStatuses = ["active", "new", "trade"];
    const matchesAllowedStatuses = status
      ? alert.status === status
      : allowedStatuses.includes(alert.status);
    const matchesStrategy = strategy ? alert.payload.strategy === strategy : true;
    const matchesAsset = asset ? alert.payload.asset === asset : true;
    const matchesTimeframe = timeframe ? alert.payload.timeframe.toLowerCase() === timeframe : true;
    const matchesDirection = direction ? alert.payload.direction === direction : true;
    const matchesSearch = searchTerm
      ? JSON.stringify(alert.payload).toLowerCase().includes(searchTerm.toLowerCase())
      : true;
  
    return (
      matchesStrategy &&
      matchesAsset &&
      matchesTimeframe &&
      matchesDirection &&
      matchesAllowedStatuses &&
      matchesSearch
    );
  });
   // Reject Alert
   const handleReject = async (id: string) => {
    try {
      await api.post(`/api/alerts/reject/${id}`);
      setSuccess("Alert rejected successfully.");
      fetchAlerts();
    } catch (err) {
      console.error("Failed to reject alert", err);
      setError("Failed to reject alert.");
    }
  };

  // Active Alert
  const handleActive = async (id: string) => {
    try {
      await api.post(`/api/alerts/active/${id}`);
      setSuccess("Alert activated successfully.");
      fetchAlerts();
    } catch (err) {
      console.error("Failed to activate alert", err);
      setError("Failed to activate alert.");
    }
  };

  // TradeAlert
  const handleTrade = async (id: string) => {
    try {
      await api.post(`/api/alerts/trade/${id}`);
      setSuccess("Alert trading successfully.");
      fetchAlerts();
    } catch (err) {
      console.error("Failed to trade alert", err);
      setError("Failed to trade alert.");
    }
  };

  // TradeAlert
  const handleArchive = async (id: string) => {
    try {
      await api.post(`/api/alerts/archive/${id}`);
      setSuccess("Alert archived successfully.");
      fetchAlerts();
    } catch (err) {
      console.error("Failed to archive alert", err);
      setError("Failed to archive alert.");
    }
  };

  const getLastAlert = (asset: string,received: string) => {
    const configAlerts = alerts.filter(alert => alert.payload.asset === asset && alert.receivedAt !== received && new Date(alert.receivedAt).getTime() < new Date(received).getTime());
    if (configAlerts.length === 0) return "No alerts received";
    return formatDate(configAlerts[0].receivedAt) + " - " + capitalizeFirstLetter(configAlerts[0].payload.direction) + " - " + configAlerts[0].payload.timeframe;
  };

  const getLastD1Alert = (asset: string,received: string) => {
    const configAlerts = alerts.filter(alert => alert.payload.asset === asset && alert.receivedAt !== received && new Date(alert.receivedAt).getTime() < new Date(received).getTime() && alert.payload.timeframe === "1D"); 
    if (configAlerts.length === 0) return "No alerts received";
    return formatDate(configAlerts[0].receivedAt) + " - " + capitalizeFirstLetter(configAlerts[0].payload.direction) + " - " + configAlerts[0].payload.timeframe;
  };

  //check if volume is above average return volumeColor
  const isAboveAverageVolume = (asset: string, volume: number, timeframe: string) => {
    const configAlerts = alerts.filter(alert => alert.payload.asset === asset && alert.payload.timeframe === timeframe);
    if (configAlerts.length === 0) return "blue";
    //calculate average volume
    let totalVolume: number = 0;
    configAlerts.forEach(alert => {
      totalVolume += Number(alert.payload.volume);
    });
    const averageVolume = totalVolume / configAlerts.length;
    //console.log("Total Volume : " + totalVolume + " Total Alerts :" + configAlerts.length + " for " + asset + " Average Volume: " + averageVolume + " " + "Volume: " + volume);
    if (volume > averageVolume) {
      return "green";
    } else {
      return "red";
    }
  };


  const getSuperTrend = (asset: string,timeframe: string) => {
    var changed;
    const superTrend = superTrends.filter(superTrends => superTrends.asset === asset);
    if (superTrend.length === 0) return "No SuperTrend";
    if (superTrend[0].changed ==="false"){
      changed = "";
    }else{
      changed = " - New Trend"
    }
    return formatStringLower(superTrend[0].trend) + changed;
  };


  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: string; }>) {
    const { name, value } = e.target;
    //if(name != 'status'){
    setFilter((prev) => ({ ...prev, [name as string]: value }));
    //}else{
    //  setSearchTerm(value);
    //}
  }

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={1} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h5" fontWeight="bold" mb={1} color="textSecondary">
          Dashboard - {filteredAlerts.length} Alerts
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
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filter.status}
              onChange={handleFilterChange as any}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatus.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
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
              <MenuItem value="h1">1 Hour</MenuItem>
              <MenuItem value="h4">4 Hours</MenuItem>
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
            
            <Grid item xs={12} md={3} lg={3} key={alert._id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    Strategy: {alert.payload.strategy || "Unknown Strategy"} - {capitalizeFirstLetter(alert.payload.direction) || ""}
                    <BsCircleFill
                    size={12}
                    className="inline-block"
                    color={getSupertrendStatusColor(getSuperTrend(alert.payload.asset,alert.payload.timeframe).split("-")[0].trim(),alert.payload.direction)}
                    style={{ marginLeft: 4 }}
                     />
                  </Typography>
                  <Typography variant="body2">
                    Asset: {alert.payload.asset || "Unknown Asset"} : {capitalizeFirstLetter(alert.status) || ""}
                  </Typography>
                  <Typography variant="body2">
                    Timeframe: {alert.payload.timeframe || "Unknown Timeframe"}
                  </Typography>
                  <Typography variant="body2">
                    Volume: {alert.payload.volume + " @ " + alert.payload.close|| "Unknown Volume"}
                    <BsCircleFill
                    size={12}
                    className="inline-block"
                    color={isAboveAverageVolume(alert.payload.asset,alert.payload.volume,alert.payload.timeframe)}
                    style={{ marginLeft: 4 }}
                     />
                  </Typography>
                  <Typography variant="body2">
                    SuperTrend: {getSuperTrend(alert.payload.asset, alert.receivedAt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Received: {formatDate(alert.receivedAt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Previous: {getLastAlert(alert.payload.asset, alert.receivedAt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Previous Daily: {getLastD1Alert(alert.payload.asset, alert.receivedAt)}
                  </Typography>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    href={`https://www.tradingview.com/chart?symbol=${alert.payload.asset}&interval=${intervalMapping[alert.payload.timeframe.toLowerCase()]}`}
                    target="_new"
                    sx={{ mt: 1 }}
                  >
                    TradingView
                  </Button>
                  
                  <Button
                    size="small"
                    variant={alert.status === "active" ? "contained" : "outlined"}
                    color="secondary"
                    onClick={() => handleActive(alert._id)}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    Active
                  </Button>
                  <Button
                    size="small"
                    variant={alert.status === "trade" ? "contained" : "outlined"}
                    color="success"
                    onClick={() => handleTrade(alert._id)}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    Trade
                  </Button>
                  <Button
                    size="small"
                    variant={alert.status === "rejected" ? "contained" : "outlined"}
                    color="error"
                    onClick={() => handleReject(alert._id)}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant={alert.status === "archived" ? "contained" : "outlined"}
                    color="warning"
                    onClick={() => handleArchive(alert._id)}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    Archive
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
