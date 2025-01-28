"use client";

import React, { useState, useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import {
  Box,
  Typography,
  Drawer,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Paper,
  Button,
  Snackbar,
  Alert as MuiAlert,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
} from "@mui/material";
import { AiOutlineSearch } from "react-icons/ai";
import { BsCircleFill } from "react-icons/bs";
import CloseIcon from "@mui/icons-material/Close";
import { formatDate, capitalizeFirstLetter, formatNumber } from "@/utils/utils";

//
// -- TRADINGVIEW EMBED (DARK THEME + RESPONSIVE)
//
interface TradingViewProps {
  symbol: string;
  interval?: string;
}
function TradingViewEmbed({ symbol, interval = "60" }: TradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueIdRef = useRef(`tv_container_${Date.now()}`);
  
  const [widgetCreated, setWidgetCreated] = useState(false);
  
  // Use react-resize-detector to get container's width/height
  const { width = 0, height = 0, ref: resizeRef } = useResizeDetector();

  useEffect(() => {
    if (!containerRef.current || !width || !height) return;

    // Clear old widget
    containerRef.current.innerHTML = `<div id="${uniqueIdRef.current}" 
      style="width:${width}px; height:${height}px;"
    ></div>`;

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
          width: width.toString(),
          height: height.toString(),
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1d1d1d",
          hide_side_toolbar: false,
          allow_symbol_change: true,
          enable_publishing: false,
        });
        setWidgetCreated(true);
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol, interval, width, height]);

  return (
    <div
      ref={resizeRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        minHeight: 400, // never collapse below 400px
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {!widgetCreated && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1d1d1d",
            color: "#ccc",
          }}
        >
          Loading chart...
        </div>
      )}
    </div>
  );
}

//
// -- TRADE & NOTE INTERFACES
// (If you store notes or have separate fields, adapt accordingly)
//
interface TradePayload {
  close: string;
  open: string;
  high: string;
  low: string;
  time: string;        // e.g. "2024-12-23T16:00:00Z"
  ticker: string;      // e.g. "US500"
  interval: string;    // e.g. "60"
  volume: string;      // e.g. "9206"
  strategy: string;
  asset: string;
  timeframe: string;
  description: string;
  status: string;      // e.g. "active"
  direction: string;   // "buy" or "sell"
}

interface Trade {
  _id: string;
  userId: string;
  configurationId: string;
  alertId: string;
  payload: TradePayload;
  createdAt: string;
  updatedAt: string;
  closedAt: string;
  openPrice?: number | null;
  closePrice?: number | null;
  slPrice?: number | null;
  tpPrice?: number | null;
  orderType: string;   // e.g. "market"
  status: string;      // e.g. "wait", "open", "pending", ...
  profitLoss:number | null;
  executionId?: number | null;
  currentPrice?:number | null;
  profitloss: number;
}

//
// -- MAIN TRADES COMPONENT
//
const Trades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Notifications
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Filters (similar to alerts)
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    strategy: "",
    asset: "",
    status: "",
    direction: "",
  });

  // Unique sets
  const [uniqueStrategies, setUniqueStrategies] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
  const [uniqueDirections, setUniqueDirections] = useState<string[]>([]);

  // Interval mapping for chart
  const intervalMapping: { [key: string]: string } = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "4h": "240",
    "1d": "D",
  };

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sorting
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<keyof Trade>("createdAt");

  const handleRequestSort = (property: keyof Trade) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedTrades = trades.sort((a, b) => {
    if (orderBy === "createdAt") {
      return order === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (orderBy === "profitloss") {
      return order === "asc"
        ? (a.profitloss ?? 0) - (b.profitloss ?? 0)
        : (b.profitloss ?? 0) - (a.profitloss ?? 0);
    }
    return 0;
  });

  // --------------------------------------
  // Fetch Trades
  //  - Adjust endpoint if needed: e.g. /api/trades
  // --------------------------------------
  const fetchTrades = async () => {
    try {
      // response.data => { trades: [...] }
      const response = await api.get("/api/trades"); 
      // Extract the array from the object
      const { trades } = response.data; // trades is now an array
  
      // Build unique sets
      const strategies = new Set<string>();
      const assets = new Set<string>();
      const statuses = new Set<string>();
      const directions = new Set<string>();
  
      // Now trades is an array, so you can do forEach
      trades.forEach((trade: Trade) => {
        if (trade.payload.strategy) strategies.add(trade.payload.strategy);
        if (trade.payload.asset) assets.add(trade.payload.asset);
        if (trade.status) statuses.add(trade.status);
        if (trade.payload.direction) directions.add(trade.payload.direction);
      });
  
      setUniqueStrategies(Array.from(strategies));
      setUniqueAssets(Array.from(assets));
      setUniqueStatuses(Array.from(statuses));
      setUniqueDirections(Array.from(directions));
  
      // Sort descending by createdAt
      const sorted = trades.sort(
        (a: Trade, b: Trade) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTrades(sorted);
  
    } catch (err) {
      console.error("Failed to fetch trades", err);
      setError("Failed to load trades.");
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);



  // For status color coding (like Alerts)
  function getStatusColor(status: string) {
    switch (status) {
      case "wait":
        return "gray";
      case "open":
        return "blue";
      case "pending":
        return "blue";
      case "closed":
        return "silver";
      case "TP":
        return "green";
      case "SL":
        return "red";
      default:
        return "black";
    }
  }

  // A row background if we like
  function formatRowColor(status: string, profitloss: number|null) {
    switch (status) {
      case "wait":
        return "#f0f0f0";
      case "open":
        if(profitloss && profitloss > 0){
          return "#77AF77FF";
        }else if(profitloss && profitloss < 0){
          return "#DA8B8BFF";
        }
        return "#eaffea";
      case "closed":
        if(profitloss && profitloss > 0){
          return "#77AF77FF";
        }else if(profitloss && profitloss < 0){
          return "#DA8B8BFF";
        }
        return "#f5f5f5";
      case "TP":
        return "#83B47CFF";
      case "SL":
        return "#ffeaea";
      default:
        return "#fff";
    }
  }

  // Filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<{ name: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value as string }));
  };

  // Filtered trades
  const filteredTrades = trades.filter((trade) => {
    const { strategy, asset, status, direction } = filter;

    const matchesStrategy = strategy ? trade.payload.strategy === strategy : true;
    const matchesAsset = asset ? trade.payload.asset === asset : true;
    const matchesStatus = status ? trade.status === status : true;
    const matchesDirection = direction ? trade.payload.direction === direction : true;

    const matchesSearch = searchTerm
      ? JSON.stringify(trade.payload).toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return (
      matchesStrategy &&
      matchesAsset &&
      matchesStatus &&
      matchesDirection &&
      matchesSearch
    );
  });

  // Drawer open/close
  const openDrawerForTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedTrade(null);
  };

  // Possibly update trade status or some fields
  // (Similar logic to handleActive, handleArchive in alerts)
  // Here we might do something like handleTradeStatusChange
  const handleTradeStatusChange = async (id: string, newStatus: string) => {
    try {
      // Suppose you have an endpoint /api/trades/update/{id}
      await api.post(`/api/trades/update/${id}`, { status: newStatus });
      setSuccess("Trade status updated.");
      fetchTrades(); // refresh
    } catch (err) {
      console.error("Failed to update trade status", err);
      setError("Failed to update trade status.");
    }
  };

  // We can do similarly for openPrice, slPrice, etc. if the API supports updates

  // (No "execute" logic here, since metatrader handles that externally)

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={2} bgcolor="#f4f6f8">
        <Header />

        <Typography variant="h5" fontWeight="bold" mb={1} color="textSecondary">
          Trades - {filteredTrades.length}
        </Typography>

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
              {uniqueStrategies.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
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
              {uniqueAssets.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
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
              {uniqueStatuses.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
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
              {uniqueDirections.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
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

        {/* TABLE */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === "createdAt" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "createdAt"}
                    direction={orderBy === "createdAt" ? order : "asc"}
                    onClick={() => handleRequestSort("createdAt")}
                  >
                    Created At
                  </TableSortLabel>
                </TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order Type</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Open Price</TableCell>
                <TableCell>Close Price</TableCell>
                <TableCell sortDirection={orderBy === "profitloss" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "profitloss"}
                    direction={orderBy === "profitloss" ? order : "asc"}
                    onClick={() => handleRequestSort("profitloss")}
                  >
                    P / L
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => (
                  <TableRow
                    key={trade._id}
                    hover
                    style={{
                      cursor: "pointer",
                      backgroundColor: formatRowColor(trade.status, trade.profitloss ?? 0),
                      margin:0,
                    }}
                    onClick={() => openDrawerForTrade(trade)}
                  >
                    <TableCell>{formatDate(trade.createdAt)}</TableCell>
                    <TableCell>
                      {trade.payload.strategy}
                      <BsCircleFill
                        color={getStatusColor(trade.status)}
                        style={{ marginLeft: 4 }}
                      />
                    </TableCell>
                    <TableCell>{trade.payload.asset}</TableCell>
                    {trade.closedAt === null ? (
                      <TableCell>{capitalizeFirstLetter(trade.status)}</TableCell>
                    ) : (
                      <TableCell>{capitalizeFirstLetter(trade.status)} - {formatDate(trade.closedAt)}</TableCell>
                    )}
                  
                    
                    <TableCell>{capitalizeFirstLetter(trade.orderType)}</TableCell>
                    <TableCell>{capitalizeFirstLetter(trade.payload.direction)}</TableCell>
                    <TableCell>{trade.openPrice ?? ""}</TableCell>
                    <TableCell>{trade.closePrice ?? ""}</TableCell>
                    {trade.profitloss === null ? (
                      <TableCell></TableCell>
                    ) : (
                      <TableCell>${formatNumber(trade.profitloss)}</TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
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

      {/* DRAWER for Trade Details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: "100%", md: 840 }, maxWidth: "100vw" } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
          <Typography variant="h6">Trade Details</Typography>
          <IconButton onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedTrade && (
          <Box p={2} sx={{ overflowY: "auto", flex: 1 }}>
            {/* TRADINGVIEW CHART */}
            <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
              <CardHeader title="Chart" />
              <CardContent sx={{ p: 0 }}>
                <TradingViewEmbed
                  symbol={selectedTrade.payload.asset}
                  interval={intervalMapping[selectedTrade.payload.timeframe?.toLowerCase()] || "60"}
                />
              </CardContent>
            </Card>

            {/* TRADE INFO */}
            <Card sx={{ mb: 2 }}>
              <CardHeader
                title={`${selectedTrade.payload.strategy || ""} - ${
                  selectedTrade.payload.direction || ""
                }`}
                subheader={`Asset: ${selectedTrade.payload.asset || ""}`}
              />
              <CardContent>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Status: {capitalizeFirstLetter(selectedTrade.status)} Profit: ${selectedTrade.profitloss ?? ""}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Order Type: {capitalizeFirstLetter(selectedTrade.orderType)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Open Price: {selectedTrade.openPrice ?? "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Close Price: {selectedTrade.closePrice ?? "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Stop Loss: {selectedTrade.slPrice ?? "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Take Profit: {selectedTrade.tpPrice ?? "N/A"}
                </Typography>
              </CardContent>
              <CardActions>
                {/* External link to TradingView, if desired */}
                <Button
                  variant="outlined"
                  color="primary"
                  href={`https://www.tradingview.com/chart?symbol=${
                    selectedTrade.payload.asset
                  }&interval=${
                    intervalMapping[selectedTrade.payload.timeframe?.toLowerCase()] || "60"
                  }`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in TradingView
                </Button>
              </CardActions>
            </Card>

            {/* If you want to update trade fields, do so with additional forms/inputs */}
            {/* e.g. update the trade's status in the DB */}
            {/* Or a button to forcibly "close" the trade by setting closePrice, etc. */}
            
            {/* Example: A status <Select> to update trade status */}
            <FormControl size="small" sx={{ minWidth: 150, mb: 2 }}>
              <InputLabel>Trade Status</InputLabel>
              <Select
                label="Trade Status"
                value={selectedTrade.status}
                onChange={(e) => handleTradeStatusChange(selectedTrade._id, e.target.value as string)}
              >
                <MenuItem value="wait">Wait</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="TP">TP</MenuItem>
                <MenuItem value="SL">SL</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default Trades;
