"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Snackbar,
  Alert as MuiAlert,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper
} from "@mui/material";
import { AiOutlineSearch } from "react-icons/ai";
import { BsCircleFill } from "react-icons/bs";
import { capitalizeFirstLetter,formatDate} from "@/utils/utils";

//
// TRADINGVIEW EMBED (DARK THEME)
//
interface TradingViewProps {
  symbol: string;
  interval?: string;
  width?: string | number;
  height?: string | number;
}

function TradingViewEmbed({
  symbol,
  interval = "60",
  width = "100%",
  height = 400,
}: TradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueIdRef = useRef(`tradingview_container_${symbol}_${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = `<div id="${uniqueIdRef.current}" style="height:${height}px; width:${typeof width === "number" ? width + "px" : width};"></div>`;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          symbol,
          interval,
          container_id: uniqueIdRef.current,
          width: "100%",
          height,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1d1d1d",
          hide_side_toolbar: false,
          allow_symbol_change: true,
          enable_publishing: false,
        });
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      script.remove();
    };
  }, [symbol, interval, width, height]);

  return <div ref={containerRef} style={{ width }} />;
}

//
// MAIN ALERTS COMPONENT
//
interface Alert {
  _id: string;
  payload: {
    strategy: string;
    asset: string;
    timeframe: string;
    direction: string;
    volume?: number;
    close?: number;
    [key: string]: any;
  };
  receivedAt: string;
  status: string;
  notes?: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Notifications
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Sorting
  const [orderBy, setOrderBy] = useState<keyof Alert["payload"] | "receivedAt">("receivedAt");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (property: keyof Alert["payload"] | "receivedAt") => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Global store of notes, if desired
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Local text for the selected alert
  const [localNotes, setLocalNotes] = useState("");

  // We'll directly manipulate this ref's `.innerText`
  const editableRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState({
    strategy: "",
    asset: "",
    direction: "",
    status: "",
  });

  // Unique filter dropdowns
  const [uniqueStrategies, setUniqueStrategies] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState<string[]>([]);
  const [uniqueDirections, setUniqueDirections] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  // TradingView timeframe mapping
  const intervalMapping: { [key: string]: string } = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "h1":"60",
    "4h": "240",
    "1d": "D",
    "d1":"D",
  };

  // --------------------------------------
  // Fetch Alerts
  // --------------------------------------
  const fetchAlerts = async () => {
    try {
      const response = await api.get("/api/alerts");
      const sortedAlerts = response.data.sort(
        (a: Alert, b: Alert) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
      setAlerts(sortedAlerts);
      setSelectedAlert(sortedAlerts[0]);

      const strategies = new Set<string>();
      const assets = new Set<string>();
      const directions = new Set<string>();
      const statuses = new Set<string>();

      sortedAlerts.forEach((alert: Alert) => {
        if (alert.payload.strategy) strategies.add(alert.payload.strategy);
        if (alert.payload.asset) assets.add(alert.payload.asset);
        if (alert.payload.direction) directions.add(alert.payload.direction);
        if (alert.status) statuses.add(alert.status);
      });

      setUniqueStrategies(Array.from(strategies));
      setUniqueAssets(Array.from(assets));
      setUniqueDirections(Array.from(directions));
      setUniqueStatuses(Array.from(statuses));
    } catch (err) {
      console.error("Failed to fetch alerts", err);
      setError("Failed to load alerts.");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // --------------------------------------
  // On selectedAlert change, load initial local notes
  // and set the <div> text once
  // --------------------------------------
  useEffect(() => {
    if (selectedAlert) {
      const existing = notes[selectedAlert._id] ?? selectedAlert.notes ?? "";
      setLocalNotes(existing);

      // Also set the editable div's text manually
      if (editableRef.current) {
        editableRef.current.innerText = existing;
      }
    } else {
      setLocalNotes("");
      if (editableRef.current) {
        editableRef.current.innerText = "";
      }
    }
  }, [selectedAlert, notes]);



  // Filters
  const handleFilterChange = (
    e: React.ChangeEvent<{ name: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value as string }));
  };

  const filteredAlerts = alerts.filter((alert) => {
    const { strategy, asset, direction, status } = filter;
    const matchesStrategy = strategy
      ? alert.payload.strategy === strategy
      : true;
    const matchesAsset = asset ? alert.payload.asset === asset : true;
    const matchesDirection = direction
      ? alert.payload.direction === direction
      : true;
      const allowedStatuses = ["active", "new", "trade"];
      const matchesAllowedStatuses = status
        ? alert.status === status
        : allowedStatuses.includes(alert.status);
    const matchesSearch = searchTerm
      ? JSON.stringify(alert.payload)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;

    return (
      matchesStrategy &&
      matchesAsset &&
      matchesDirection &&
      matchesAllowedStatuses &&
      matchesSearch
    );
  });

  

  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "blue";
      case "active":
        return "green";
      case "trade":
        return "orange";
      case "archived":
        return "gray";
      case "rejected":
        return "red";
      default:
        return "black";
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

  // --------------------------------------
  // Status management
  // --------------------------------------
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    let newStatusUrl = newStatus;
    if (newStatusUrl === "archived") newStatusUrl = "archive";
    if (newStatusUrl === "rejected") newStatusUrl = "reject";

    try {
      await api.post(`/api/alerts/${newStatusUrl}/${id}`, { status: newStatus });
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === id ? { ...alert, status: newStatus } : alert
        )
      );
      setSuccess(`Alert status changed to ${newStatus}.`);
    } catch (err) {
      console.error("Failed to update status", err);
      setError("Failed to update status.");
    }
  };

  // --------------------------------------
  // Notes Handling
  // --------------------------------------
  // We store keystrokes in localNotes,
  // but do NOT re-inject them on each render.
  const onEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    setLocalNotes(e.currentTarget.innerText || "");
  };

  const saveNote = async (id: string) => {
    try {
      setNotes((prev) => ({ ...prev, [id]: localNotes }));
      await api.post(`/api/alerts/${id}/notes`, { note: localNotes });
      setSuccess("Note saved successfully.");
    } catch (err) {
      console.error("Failed to save note", err);
      setError("Failed to save note.");
    }
  };

  // Row click -> select
  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  // --------------------------------------
  // RENDER
  // --------------------------------------
  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={1} bgcolor="#f4f6f8">
        <Header />

        <Typography variant="h5" fontWeight="bold" mb={1} color="textSecondary">
          Alerts - {filteredAlerts.length} 
        </Typography>

        {/* TOP SECTION */}
        <Box
          mb={4}
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={2}
          minHeight={400}
        >
          {/* LEFT - Dark Chart */}
          <Box
            flexBasis={{ xs: "100%", md: "66.666%" }}
            bgcolor="#1d1d1d"
            borderRadius="4px"
            p={1}
            minHeight={400}
            display="flex"
          >
            {selectedAlert ? (
              <TradingViewEmbed
                symbol={selectedAlert.payload.asset}
                interval={
                  intervalMapping[
                    selectedAlert.payload.timeframe?.toLowerCase()
                  ] || "60"
                }
                height={400}
                width="100%"
              />
            ) : (
              <Typography variant="body1" color="#fff" m="auto">
                Select an alert to view its chart
              </Typography>
            )}
          </Box>

          {/* RIGHT - Notes & Status */}
          <Box
            flexBasis={{ xs: "100%", md: "33.333%" }}
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            p={1}
            borderRadius="4px"
            bgcolor="#fff"
            minHeight={400}
          >
            {selectedAlert ? (
              <>
                <Typography variant="h6" fontWeight="bold" color="textSecondary">
                                    Configuration : {selectedAlert.payload.strategy || "Unknown Strategy"} - {capitalizeFirstLetter(selectedAlert.payload.direction) || ""}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Asset: {selectedAlert.payload.asset || "Unknown Asset"} : {capitalizeFirstLetter(selectedAlert.status) || ""}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Timeframe: {selectedAlert.payload.timeframe || "Unknown Timeframe"}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Volume: {selectedAlert.payload.volume + " @ " + selectedAlert.payload.close|| "Unknown Volume"}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Received: {new Date(selectedAlert.receivedAt).toLocaleString()}
                                  </Typography>
                <Typography variant="h6" color="textSecondary">Notes</Typography>

                <Box
                  ref={editableRef}
                  mt={1}
                  mb={2}
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minHeight: "80px",
                    backgroundColor: "#fff",
                    p: 1,
                    overflow: "auto",
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={onEditableInput}
                />
                {/* ^ We do NOT put {localNotes} inside here; we manually set .innerText in useEffect. */}

                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  sx={{ mb: 2 }}
                  onClick={() => saveNote(selectedAlert._id)}
                >
                  Save Note
                </Button>

                <FormControl size="small" sx={{ mb: 2, minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={selectedAlert.status || ""}
                    onChange={(e) =>
                      handleStatusChange(selectedAlert._id, e.target.value)
                    }
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="trade">Trade</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>

                {/* Action Buttons */}
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant={
                      selectedAlert.status === "active" ? "contained" : "outlined"
                    }
                    color="secondary"
                    onClick={() => handleActive(selectedAlert._id)}
                  >
                    Active
                  </Button>
                  <Button
                    size="small"
                    variant={
                      selectedAlert.status === "trade" ? "contained" : "outlined"
                    }
                    color="success"
                    onClick={() => handleTrade(selectedAlert._id)}
                  >
                    Trade
                  </Button>
                  <Button
                    size="small"
                    variant={
                      selectedAlert.status === "rejected"
                        ? "contained"
                        : "outlined"
                    }
                    color="error"
                    onClick={() => handleReject(selectedAlert._id)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant={
                      selectedAlert.status === "archived"
                        ? "contained"
                        : "outlined"
                    }
                    color="warning"
                    onClick={() => handleArchive(selectedAlert._id)}
                  >
                    Archive
                  </Button>
                  <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      href={`https://www.tradingview.com/chart?symbol=${selectedAlert.payload.asset}&interval=${intervalMapping[selectedAlert.payload.timeframe.toLowerCase()]}`}
                                      target="_new"
                                    >
                                      TradingView
                                    </Button>
                </Box>
              </>
            ) : (
              <Typography variant="body1">
                Select an alert to edit notes & status
              </Typography>
            )}
          </Box>
        </Box>

        {/* FILTERS */}
        <Box display="flex" gap={2} mb={4} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              name="strategy"
              value={filter.strategy}
              onChange={handleFilterChange as any}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStrategies.map((strategy) => (
                <MenuItem key={strategy} value={strategy}>
                  {strategy}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Asset</InputLabel>
            <Select
              name="asset"
              value={filter.asset}
              onChange={handleFilterChange as any}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueAssets.map((asset) => (
                <MenuItem key={asset} value={asset}>
                  {asset}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              name="direction"
              value={filter.direction}
              onChange={handleFilterChange as any}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueDirections.map((direction) => (
                <MenuItem key={direction} value={direction}>
                  {direction}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filter.status}
              onChange={handleFilterChange as any}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <AiOutlineSearch style={{ marginRight: 5 }} />,
            }}
          />
        </Box>

        {/* ALERTS TABLE */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === "strategy" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "strategy"}
                    direction={orderBy === "strategy" ? order : "asc"}
                    onClick={() => handleSort("strategy")}
                  >
                    Strategy
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === "asset" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "asset"}
                    direction={orderBy === "asset" ? order : "asc"}
                    onClick={() => handleSort("asset")}
                  >
                    Asset
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Close</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Timeframe</TableCell>
                <TableCell sortDirection={orderBy === "receivedAt" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "receivedAt"}
                    direction={orderBy === "receivedAt" ? order : "asc"}
                    onClick={() => handleSort("receivedAt")}
                  >
                    Received At
                  </TableSortLabel>
                </TableCell>
                <TableCell>Previous Alert</TableCell>
                <TableCell>Previous D1 Alert</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow
                  key={alert._id}
                  hover
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(alert)}
                >
                  <TableCell>
                    {alert.payload.strategy}{" "}
                    <BsCircleFill
                      color={getStatusColor(alert.status || "")}
                      style={{ marginLeft: 8 }}
                    />
                  </TableCell>
                  <TableCell>{alert.payload.asset}</TableCell>
                  <TableCell>{capitalizeFirstLetter(alert.status)}</TableCell>
                  <TableCell>{alert.payload.volume}</TableCell>
                  <TableCell>{alert.payload.close}</TableCell>
                  <TableCell>{capitalizeFirstLetter(alert.payload.direction)}</TableCell>
                  <TableCell>{alert.payload.timeframe}</TableCell>
                  <TableCell>{formatDate(alert.receivedAt)}</TableCell>
                  <TableCell>{getLastAlert(alert.payload.asset,alert.receivedAt)}</TableCell>
                  <TableCell>{getLastD1Alert(alert.payload.asset,alert.receivedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* SNACKBARS */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={3000}
          onClose={() => setError("")}
        >
          <MuiAlert severity="error" onClose={() => setError("")}>
            {error}
          </MuiAlert>
        </Snackbar>

        <Snackbar
          open={Boolean(success)}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
        >
          <MuiAlert severity="success" onClose={() => setSuccess("")}>
            {success}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Alerts;
