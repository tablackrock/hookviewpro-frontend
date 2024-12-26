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
  Collapse,
  Snackbar,
  Alert as MuiAlert,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
} from "@mui/material";
import { AiOutlineDown, AiOutlineUp, AiOutlineSearch } from "react-icons/ai";
import { BsCircleFill } from "react-icons/bs";
import { alignProperty } from "@mui/material/styles/cssUtils";

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
  status?: string;
  notes?: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState({
    strategy: "",
    asset: "",
    direction: "",
    status: "",
  });
  const [uniqueStrategies, setUniqueStrategies] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState<string[]>([]);
  const [uniqueDirections, setUniqueDirections] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/api/alerts");
      const sortedAlerts = response.data.sort(
        (a: Alert, b: Alert) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );

      setAlerts(sortedAlerts);

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

   // Format receivedAt date
   const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };
  

  const handleFilterChange = (e: React.ChangeEvent<{ name: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value as string }));
  };

  const filteredAlerts = alerts.filter((alert) => {
    const { strategy, asset, direction, status } = filter;

    const matchesStrategy = strategy ? alert.payload.strategy === strategy : true;
    const matchesAsset = asset ? alert.payload.asset === asset : true;
    const matchesDirection = direction ? alert.payload.direction === direction : true;
    const matchesStatus = status ? alert.status === status : true;
    const matchesSearch = searchTerm
      ? JSON.stringify(alert.payload).toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesStrategy && matchesAsset && matchesDirection && matchesStatus && matchesSearch;
  });

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

  const handleNoteChange = (id: string, content: string) => {
    setNotes((prev) => ({ ...prev, [id]: content }));
  };

  const saveNote = async (id: string) => {
    try {
      await api.post(`/api/alerts/${id}/notes`, { note: notes[id] });
    } catch (err) {
      console.error("Failed to save note", err);
      setError("Failed to save note.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    var newStatusUrl = newStatus;
    if(newStatusUrl == "archived"){ newStatusUrl = "archive"}
    if(newStatusUrl == "rejected"){ newStatusUrl = "reject"}
    try {
      await api.post(`/api/alerts/${newStatusUrl}/${id}`, { status: newStatus });
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === id ? { ...alert, status: newStatus } : alert
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
      setError("Failed to update status.");
    }
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Alerts
        </Typography>

        {/* Filters */}
        <Box display="flex" gap={2} mb={4}>
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
              startAdornment: <AiOutlineSearch />,
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Strategy</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell sx={{ textAlign: "center"}}>Status</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Close</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Timeframe</TableCell>
                <TableCell>Received At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <React.Fragment key={alert._id}>
                  <TableRow>
                    <TableCell>{alert.payload.strategy} <BsCircleFill color={getStatusColor(alert.status || "")} /></TableCell>
                    <TableCell>{alert.payload.asset}</TableCell>
                    <TableCell sx={{ textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      
                      <FormControl size="small" sx={{ ml: 1,minWidth:150 }}>
                        <Select
                          value={alert.status || ""}
                          onChange={(e) =>
                            handleStatusChange(alert._id, e.target.value)
                          }
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="trade">Trade</MenuItem>
                          <MenuItem value="archived">Archived</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>{alert.payload.volume}</TableCell>
                    <TableCell>{alert.payload.close}</TableCell>
                    <TableCell>{alert.payload.direction}</TableCell>
                    <TableCell>{alert.payload.timeframe}</TableCell>
                    <TableCell>{formatDate(alert.receivedAt)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setExpandedRow((prev) => (prev === alert._id ? null : alert._id))}
                        startIcon={
                          expandedRow === alert._id ? <AiOutlineUp /> : <AiOutlineDown />
                        }
                      >
                        Details
                      </Button>
                      
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Collapse in={expandedRow === alert._id} timeout="auto" unmountOnExit>
                        <Box margin={2}>
                          <Typography variant="body2">
                            {JSON.stringify(alert.payload, null, 2)}
                          </Typography>
                          <Typography variant="h6">Notes</Typography>
                          <div
                            contentEditable
                            dangerouslySetInnerHTML={{ __html: notes[alert._id] || "" }}
                            onInput={(e) =>
                              handleNoteChange(alert._id, e.currentTarget.innerHTML)
                            }
                            style={{
                              border: "1px solid #ccc",
                              padding: "8px",
                              borderRadius: "4px",
                              minHeight: "80px",
                              backgroundColor: "#fff",
                            }}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => saveNote(alert._id)}
                          >
                            Save Note
                          </Button>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar
          open={Boolean(error)}
          autoHideDuration={3000}
          onClose={() => setError("")}
        >
          <MuiAlert severity="error" onClose={() => setError("")}>
            {error}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Alerts;
