import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import { AiFillDashboard, AiFillSetting, AiFillContainer, AiFillBank } from "react-icons/ai";
import { MdOutlineManageAccounts } from "react-icons/md";
import { RiNotification2Fill } from "react-icons/ri";
import { BiLogOut } from "react-icons/bi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

interface FXStrength {
  [currency: string]: number | string; // Dynamic keys for currencies, metadata will still be strings
  _id: string;
  timeframe: string;
  receivedAt: string;
}

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [fxData, setFxData] = useState<FXStrength[]>([]);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <AiFillDashboard /> },
    { name: "Configurations", path: "/configurations", icon: <MdOutlineManageAccounts /> },
    { name: "Alerts", path: "/alerts", icon: <RiNotification2Fill /> },
    { name: "Trades", path: "/trades", icon: <AiFillBank /> },
    { name: "Payloads", path: "/payloads", icon: <AiFillContainer /> },
    { name: "Settings", path: "/settings", icon: <AiFillSetting /> },
  ];

  useEffect(() => {
    const fetchFxData = async () => {
      try {
        const response = await api.get("api/data/fxs");
        
        if (response.data) {
          setFxData(response.data);
          console.log(response.data);
        } else {
          console.error("Failed to fetch FX strength data");
        }


      } catch (error) {
        console.error("Error fetching FX strength data:", error);
      }
    };

    fetchFxData();
  }, []);

  const renderFxData = () => {
    if (fxData.length < 2) {
      return <Typography textAlign="center" color="#ccc">Loading FX data...</Typography>;
    }

    const [latest, previous] = fxData;

    return Object.entries(latest)
      .filter(([key]) => key !== "_id" && key !== "timeframe" && key !== "receivedAt" && key !== "__v")
      .map(([currency, value]) => {
      const latestValue = typeof value === "number" ? value : parseFloat(value as string);
      const previousValue =
        typeof previous[currency] === "number"
        ? (previous[currency] as number)
        : parseFloat(previous[currency] as string);

      const change = latestValue - previousValue;

      return { currency, latestValue, change };
      })
      .sort((a, b) => b.latestValue - a.latestValue)
      .map(({ currency, latestValue, change }) => {

        return (
          <Typography
            key={currency}
            textAlign="center"
            sx={{
              color: latestValue > 0 ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {currency}: {latestValue.toFixed(2)} ({change >= 0 ? "+" : ""}{change.toFixed(2)})
          </Typography>
        );
      });
  };

  return (
    <Box
      component="aside"
      width="250px"
      bgcolor="#282c34"
      color="#fff"
      height="100vh"
      display="flex"
      flexDirection="column"
    >
      <Box p={2} textAlign="center" fontWeight="bold" fontSize="1.5rem">
        HookViewPro
      </Box>

      <Box p={2} textAlign="center" fontSize="1rem" color="#ccc">
        {user?.email || "User"}
      </Box>

      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              selected={pathname === item.path}
              sx={{
                color: pathname === item.path ? "#007BFF" : "#fff",
                "&:hover": { bgcolor: "#444" },
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItemButton
          onClick={logout}
          sx={{
            color: "#fff",
            "&:hover": { bgcolor: "#444" },
          }}
        >
          <ListItemIcon sx={{ color: "#fff" }}>
            <BiLogOut />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>

      <Box mt="auto" p={2} mb={4} bgcolor="#333" borderTop="1px solid #444">
        <Typography variant="h6" textAlign="center" color="#fff" mb={2}>
          FX Strength
        </Typography>
        {renderFxData()}
      </Box>
    </Box>
  );
};

export default Sidebar;
