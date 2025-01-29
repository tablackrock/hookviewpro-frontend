"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import withAuth from "../../utils/withAuth";
import { capitalizeFirstLetter,formatDate, formatStringLower,getSupertrendStatusColor, getSupertrendDailyStatusColor,formatDateAgo} from "@/utils/utils";
import { BsCircleFill } from "react-icons/bs";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

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
  receivedAt: string;
}

interface Rsi{
  _id: string;
  asset: string;
  condition: string;
  rsi: number;
  timeframe: string;
}


const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [superTrends, setSuperTrends] = useState<SuperTrends[]>([]);
  const [superTrendsDaily, setSuperTrendsDaily] = useState<SuperTrends[]>([]);
  const [rsis, setRsis] = useState<Rsi[]>([]);
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

  const fetchSuperTrendsDaily = async () => {
    try {
      const response = await api.get("api/data/superTrendDaily");
      const fetchedSuperTrends = response.data;
  
      setSuperTrendsDaily(fetchedSuperTrends);
  
    } catch (err) {
      console.error("Failed to fetch superTrends", err);
      setError("Failed to load supertTrends.");
    }
  }

  const fetchRsi = async () => {
    try {
      const response = await api.get("api/data/rsi");
      const fetchedRsi = response.data;
  
      setRsis(fetchedRsi);
  
    } catch (err) {
      console.error("Failed to fetch Rsi", err);
      setError("Failed to load Rsi.");
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
    fetchRsi();
    fetchSuperTrends();
    fetchSuperTrendsDaily();
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
    return formatDateAgo(configAlerts[0].receivedAt) + " - " + capitalizeFirstLetter(configAlerts[0].payload.direction) + " - " + configAlerts[0].payload.timeframe;
  };

  const getLastD1Alert = (asset: string,received: string) => {
    const configAlerts = alerts.filter(alert => alert.payload.asset === asset && alert.receivedAt !== received && new Date(alert.receivedAt).getTime() < new Date(received).getTime() && alert.payload.timeframe === "1D"); 
    if (configAlerts.length === 0) return "No alerts received";
    return formatDateAgo(configAlerts[0].receivedAt) + " - " + capitalizeFirstLetter(configAlerts[0].payload.direction) + " - " + configAlerts[0].payload.timeframe;
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

  const getSuperTrendDaily = (asset: string) => {
    var changed;
    const superTrend = superTrendsDaily.filter(superTrends => superTrends.asset === asset);
    if (superTrend.length === 0) return "No SuperTrend";
    if (superTrend[0].changed ==="false"){
      changed = "";
    }else{
      changed = " - New Trend"
    }
    return formatStringLower(superTrend[0].trend) + changed;
  }

  const getRsi = (asset: string,timeframe: string) => {
    const rsi = rsis.filter(rsi => rsi.asset === asset);
    if (rsi.length === 0) return "No Rsi";
    return rsi[0].rsi + " " + rsi[0].condition;
  };


  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: string; }>) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name as string]: value }));
  }

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSearchTerm(e.target.value);
  };

  const recentDailyAlerts = alerts
    .filter(alert => alert.payload.timeframe === "1D")
    .slice(0, 5);

  const recentSuperTrends = superTrends.filter(trend => {
    const twelveHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return trend.changed === "true" && new Date(trend.receivedAt) > twelveHoursAgo;
  });

  const filteredRsi = rsis.filter(rsi => rsi.rsi > 60 || rsi.rsi < 40);

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={2} bgcolor="#f4f6f8" display="flex">
        <Box flexGrow={1}>
          <Box position="sticky" top={0} zIndex={1} bgcolor="#ffffff" boxShadow={1} p={2}>
            <Header />

            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>

            <Typography variant="h5" fontWeight="bold" mb={2} color="text">
              Dashboard - {filteredAlerts.length} Alerts
            </Typography>
            </FormControl>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
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

              <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
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

              <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
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

              <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
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

              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
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
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <TextField
                size="small"
                placeholder="Search..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
                }}
                sx={{ minWidth: 150 }}
              />
              </FormControl>

              
            </Box>
          </Box>

          <Grid container spacing={1}>
            {filteredAlerts.map((alert) => (
              <Grid item xs={12} md={6} lg={4} key={alert._id}>
                <Card variant="outlined" sx={{ boxShadow: 3, bgcolor: "#ffffff", borderRadius: 2 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="textPrimary" gutterBottom>
                      Strategy: {alert.payload.strategy || "Unknown Strategy"} - {capitalizeFirstLetter(alert.payload.direction) || ""}
                      <BsCircleFill
                        size={12}
                        className="inline-block"
                        color={getSupertrendStatusColor(getSuperTrend(alert.payload.asset,alert.payload.timeframe).split("-")[0].trim(),alert.payload.direction)}
                        style={{ marginLeft: 4 }}
                      />
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Asset: {alert.payload.asset || "Unknown Asset"} : {capitalizeFirstLetter(alert.status) || ""}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Timeframe: {alert.payload.timeframe || "Unknown Timeframe"}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Volume: {alert.payload.volume + "@"  + alert.payload.close || "Unknown Volume"}
                          <BsCircleFill
                            size={12}
                            className="inline-block"
                            color={isAboveAverageVolume(alert.payload.asset,alert.payload.volume,alert.payload.timeframe)}
                            style={{ marginLeft: 4 }}
                          />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          SuperTrend: {getSuperTrend(alert.payload.asset, alert.receivedAt)} Daily: {getSuperTrendDaily(alert.payload.asset)}
                          <BsCircleFill
                            size={12}
                            className="inline-block"
                            color={getSupertrendDailyStatusColor(getSuperTrend(alert.payload.asset,alert.receivedAt).split("-")[0].trim(),getSuperTrendDaily(alert.payload.asset).split("-")[0].trim())}
                            style={{ marginLeft: 4 }}
                          />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          RSI: {getRsi(alert.payload.asset, alert.payload.timeframe)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Received: {formatDate(alert.receivedAt)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Previous: {getLastAlert(alert.payload.asset, alert.receivedAt)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Previous Daily: {getLastD1Alert(alert.payload.asset, alert.receivedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box mt={2} display="flex" justifyContent="space-between" flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        href={`https://www.tradingview.com/chart?symbol=${alert.payload.asset}&interval=${intervalMapping[alert.payload.timeframe.toLowerCase()]}`}
                        target="_new"
                        sx={{ mb: 1 }}
                      >
                        TradingView
                      </Button>
                      
                      <Button
                        size="small"
                        variant={alert.status === "active" ? "contained" : "outlined"}
                        color="secondary"
                        onClick={() => handleActive(alert._id)}
                        sx={{ mb: 1 }}
                      >
                        Active
                      </Button>
                      <Button
                        size="small"
                        variant={alert.status === "trade" ? "contained" : "outlined"}
                        color="success"
                        onClick={() => handleTrade(alert._id)}
                        sx={{ mb: 1 }}
                      >
                        Trade
                      </Button>
                      <Button
                        size="small"
                        variant={alert.status === "rejected" ? "contained" : "outlined"}
                        color="error"
                        onClick={() => handleReject(alert._id)}
                        sx={{ mb: 1 }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant={alert.status === "archived" ? "contained" : "outlined"}
                        color="warning"
                        onClick={() => handleArchive(alert._id)}
                        sx={{ mb: 1 }}
                      >
                        Archive
                      </Button>
                    </Box>
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

        <Box width={400} ml={2} sx={{ position: "sticky", top: 0, bgcolor: "#1e1e2f", boxShadow: 3, borderRadius: 2, p:1, color: "#fff" }}>
          <Box mb={3}>
            <Typography variant="h6" fontWeight="bold" color="textWhite" gutterBottom>
              Daily Alerts - {recentDailyAlerts.length}
            </Typography>
            <List>
              {recentDailyAlerts.map((alert) => (
                <ListItem key={alert._id} sx={{ mb: 1, bgcolor: "#2e2e3e", borderRadius: 1 }}>
                  <ListItemText
                    primary={`${alert.payload.asset} - ${capitalizeFirstLetter(alert.payload.direction)} - ${formatDateAgo(alert.receivedAt)}`}
                    primaryTypographyProps={{ color: "#fff" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box mb={3}>
            <Typography variant="h6" fontWeight="bold" color="textWhite" gutterBottom>
              SuperTrend - {recentSuperTrends.length}
            </Typography>
            <List>
              {recentSuperTrends.map((trend) => (
                <ListItem key={trend._id} sx={{ mb: 1, bgcolor: "#2e2e3e", borderRadius: 1 }}>
                  <ListItemText
                    primary={`${trend.asset} - ${formatStringLower(trend.trend)}`}
                    primaryTypographyProps={{ color: "#fff" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight="bold" color="textWhite" gutterBottom>
              RSI Alerts: {filteredRsi.length}
            </Typography>
            <List>
              {filteredRsi.map((rsi) => (
                <ListItem key={rsi._id} sx={{ mb: 1, bgcolor: "#2e2e3e", borderRadius: 1 }}>
                  <ListItemText
                    primary={`${rsi.asset} - ${rsi.rsi} ${capitalizeFirstLetter(rsi.condition)}`}
                    primaryTypographyProps={{ color: "#fff" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default withAuth(Dashboard);
