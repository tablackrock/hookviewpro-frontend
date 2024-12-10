import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box } from "@mui/material";
import { AiFillDashboard, AiFillSetting } from "react-icons/ai";
import { MdOutlineManageAccounts } from "react-icons/md";
import { RiNotification2Fill } from "react-icons/ri";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <AiFillDashboard /> },
    { name: "Configurations", path: "/configurations", icon: <MdOutlineManageAccounts /> },
    { name: "Alerts", path: "/alerts", icon: <RiNotification2Fill /> },
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
    </Box>
  );
};

export default Sidebar;
