import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box } from "@mui/material";
import { AiFillDashboard, AiFillSetting, AiFillContainer,AiFillBank  } from "react-icons/ai";
import { MdOutlineManageAccounts } from "react-icons/md";
import { RiNotification2Fill } from "react-icons/ri";
import { BiLogOut } from "react-icons/bi";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <AiFillDashboard /> },
    { name: "Configurations", path: "/configurations", icon: <MdOutlineManageAccounts /> },
    { name: "Alerts", path: "/alerts", icon: <RiNotification2Fill /> },
    { name: "Trades", path: "/trades", icon: <AiFillBank /> },
    { name: "Payloads", path: "/payloads", icon: <AiFillContainer /> },
    { name: "Settings", path: "/settings", icon: <AiFillSetting /> },
  ];

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
      </List>

      <Box mt="auto" p={2}>
        <ListItemButton
          onClick={logout}
          sx={{
            color: "#fff",
            "&:hover": { bgcolor: "#444" },
          }}
        >
          <ListItemIcon sx={{ color: "#fff" }}><BiLogOut /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default Sidebar;
