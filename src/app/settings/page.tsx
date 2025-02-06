"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import withAuth from "../../utils/withAuth";
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert as MuiAlert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from "@mui/material";
import { AiOutlineEdit, AiOutlineClose, AiOutlineCopy, AiOutlinePlus, AiOutlineDelete } from "react-icons/ai"; // Import icons
import api from "../../utils/api";
import { CSVLink } from "react-csv";

interface Account {
  _id: string;
  nickName: string;
  accountNumber: string;
  alertStatus: boolean;
  tradeStatus: boolean;
  broker: string;
  currency: string;
  balance: number;
}

interface Configuration {
  _id: string;
  name: string;
  asset: string;
}

interface Alert {
  asset: string;
  timeframe: string;
  direction: string;
  receivedAt: string;
}

const Settings: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [addAccountDrawerOpen, setAddAccountDrawerOpen] = useState<boolean>(false);

  const [searchFilter, setSearchFilter] = useState<{ asset: string; strategy: string; timeframe: string }>({ asset: "", strategy: "", timeframe: "" });
  const [availableConfigurations, setAvailableConfigurations] = useState<Configuration[]>([]); // Default to an empty array
  const [linkedConfigurations, setLinkedConfigurations] = useState<Configuration[]>([]); // Default to an empty array

  const [newAccount, setNewAccount] = useState<{ nickName: string; accountNumber: string; accountType: string; tradeStatus: string; alertStatus: string; broker: string; currency: string; balance: number }>({
    nickName: "",
    accountNumber: "",
    accountType: "MetaTrader 5",
    tradeStatus: "Enabled",
    alertStatus: "Enabled",
    broker: "",
    currency: "USD",
    balance: 0,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const userResponse = await api.get("/api/users/me");
        const { email, webhookUrl } = userResponse.data;
        setEmail(email);
        setWebhookUrl(webhookUrl.replace("hookviewpro.com", "api.hookviewpro.com") || "");

        const accountsResponse = await api.get("/api/accounts");
        setAccounts(accountsResponse.data.accounts || []); // Default to empty array if undefined

      } catch (err) {
        console.error("Failed to fetch data", err);
        setErrorMessage("Failed to load data.");
      }
    };

    fetchDetails();
  }, []);

  const handleSave = async () => {
    try {
      const payload: { email: string; password?: string } = { email };
      if (newPassword) payload.password = newPassword;

      await api.patch("/api/users/me", payload);
      setSuccessMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Failed to save settings", err);
      setErrorMessage("Failed to save settings.");
    }
  };

  const handleAccountClick = async (account: Account) => {
    setSelectedAccount(account);
    setDrawerOpen(true);

    try {
      const response = await api.get(`/api/accounts/configurations/${account._id}`);
      setLinkedConfigurations(response.data.configurations || []); // Access the configurations array
    } catch (err) {
      console.error("Failed to load configurations", err);
      setErrorMessage("Failed to load configurations.");
    }
  };

  const handleAccountDelete = async (account: Account) => {
    try {
      await api.post(`/api/accounts/delete/${account._id}`);
      setAccounts((prev) => prev.filter((a) => a._id !== account._id));
      setSuccessMessage("Account deleted successfully.");
    } catch (err) {
      console.error("Failed to delete account", err);
      setErrorMessage("Failed to delete account.");
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    try {
      const { nickName, accountNumber } = selectedAccount;

      await api.post(`/api/accounts/edit/${selectedAccount._id}`, { nickName, accountNumber });

      setAccounts((prev) =>
        prev.map((account) => (account._id === selectedAccount._id ? selectedAccount : account))
      );
      setSuccessMessage("Account updated successfully.");
      setDrawerOpen(false);
    } catch (err) {
      console.error("Failed to update account", err);
      setErrorMessage("Failed to update account.");
    }
  };

  const handleSearchConfigurations = async () => {
    try {
      const response = await api.get("/api/configurations/search", { params: searchFilter });
      const linkedConfigIds = linkedConfigurations.map((config) => config._id);
      const filteredConfigurations = response.data.filter((config: Configuration) => !linkedConfigIds.includes(config._id));
      setAvailableConfigurations(filteredConfigurations);
    } catch (err) {
      console.error("Failed to search configurations", err);
      setErrorMessage("Failed to search configurations.");
    }

  };

  const handleAddConfiguration = async (configId: string, name: string, asset: string) => {
    if (!selectedAccount) return;

    try {
      await api.post("/api/accounts/configurations/add", {
        accountId: selectedAccount._id,
        configurationId: configId,
        name,
        asset,
      });

      const addedConfig = availableConfigurations.find((c) => c._id === configId);
      if (addedConfig) {
        setLinkedConfigurations((prev) => (Array.isArray(prev) ? [...prev, addedConfig] : [addedConfig]));
      }

      setSuccessMessage("Configuration added successfully.");
    } catch (err) {
      console.error("Failed to add configuration", err);
      setErrorMessage("Failed to add configuration.");
    }
  };

  const handleRemoveConfiguration = async (configId: string) => {
    try {
      await api.post(`/api/accounts/configurations/delete/${configId}`);

      setLinkedConfigurations((prev) => prev.filter((c) => c._id !== configId));
      setSuccessMessage("Configuration removed successfully.");
    } catch (err) {
      console.error("Failed to remove configuration", err);
      setErrorMessage("Failed to remove configuration.");
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await api.post("/api/accounts/add", newAccount);
      setAccounts((prev) => [...prev, response.data.account]);
      setNewAccount({ nickName: "", accountNumber: "", accountType: "MetaTrader 5", tradeStatus: "Enabled", alertStatus: "Enabled", broker: "", currency: "USD", balance: 0 });
      setAddAccountDrawerOpen(false);
      setSuccessMessage("Account added successfully.");
    } catch (err) {
      console.error("Failed to add account", err);
      setErrorMessage("Failed to add account.");
    }
  };

  const generateCSVData = () => {
    if (!selectedAccount) return [];
    return linkedConfigurations.map(config => ({
      name: config.name,
      asset: config.asset,
    }));
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={4} bgcolor="#f4f6f8">
        <Header />
        <Typography variant="h4" fontWeight="bold" mb={4} color="textSecondary">
          Settings
        </Typography>

        {/* User Settings */}
        <Box display="flex" flexDirection="column" gap={4}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Webhook URL"
            type="url"
            variant="outlined"
            fullWidth
            value={webhookUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                  <AiOutlineCopy />
                </IconButton>
              ),
            }}
          />

<TextField
            label="Expert Advisor URL"
            type="url"
            variant="outlined"
            fullWidth
            value={webhookUrl.replace("api.hookviewpro.com", "ea.hookviewpro.com")}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                  <AiOutlineCopy />
                </IconButton>
              ),
            }}
          />
          <TextField
            label="New Password"
            type="password"
            variant="outlined"
            fullWidth
            placeholder="Enter a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>

        {/* Accounts Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={6} mb={2}>
          <Typography variant="h5" fontWeight="bold" color="textSecondary">
            Trading Accounts
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AiOutlinePlus />} onClick={() => setAddAccountDrawerOpen(true)}>
            Add Account
          </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nickname</TableCell>
              <TableCell>Broker</TableCell>
              <TableCell>Account Number</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Alert Status</TableCell>
              <TableCell>Trade Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell>{account.nickName}</TableCell>
                <TableCell>{account.broker}</TableCell>
                <TableCell>{account.accountNumber}</TableCell>
                <TableCell>{account.balance}</TableCell>
                <TableCell>{account.alertStatus}</TableCell>
                <TableCell>{account.tradeStatus}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleAccountClick(account)}>
                    <AiOutlineEdit />
                  </IconButton>
                  <IconButton onClick={() => handleAccountDelete(account)}>
                    <AiOutlineDelete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add Account Drawer */}
        <Drawer anchor="right" open={addAccountDrawerOpen} onClose={() => setAddAccountDrawerOpen(false)}>
          <Box width="50vw" p={4}> {/* Expanded width */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Add New Account</Typography>
              <IconButton onClick={() => setAddAccountDrawerOpen(false)}>
                <AiOutlineClose />
              </IconButton>
            </Box>
            <Divider />
            {/* Account Fields */}
            <TextField
              label="Nickname"
              value={newAccount.nickName}
              onChange={(e) => setNewAccount({ ...newAccount, nickName: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Account Number"
              type="number"
              value={newAccount.accountNumber}
              onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={newAccount.accountType}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as string })}
              >
                <MenuItem value="MetaTrader 5">MetaTrader 5</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Trade Status</InputLabel>
              <Select
                value={newAccount.tradeStatus}
                onChange={(e) => setNewAccount({ ...newAccount, tradeStatus: e.target.value as string })}
              >
                <MenuItem value="Enabled">Enabled</MenuItem>
                <MenuItem value="Disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Alert Status</InputLabel>
              <Select
                value={newAccount.alertStatus}
                onChange={(e) => setNewAccount({ ...newAccount, alertStatus: e.target.value as string })}
              >
                <MenuItem value="Enabled">Enabled</MenuItem>
                <MenuItem value="Disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Broker"
              value={newAccount.broker}
              onChange={(e) => setNewAccount({ ...newAccount, broker: e.target.value })}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                value={newAccount.currency}
                onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value as string })}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Balance"
              type="number"
              value={newAccount.balance}
              onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleAddAccount}
              sx={{ mt: 4 }}
            >
              Add Account
            </Button>
          </Box>
        </Drawer>

        {/* Expandable Drawer */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box width="50vw" p={4}> {/* Expanded width */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Edit Account</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <AiOutlineClose />
              </IconButton>
            </Box>
            <Divider />
            {/* Account Fields */}
            <TextField
              label="Nickname"
              value={selectedAccount?.nickName || ""}
              onChange={(e) => setSelectedAccount({ ...selectedAccount, nickName: e.target.value } as Account)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Account Number"
              value={selectedAccount?.accountNumber || ""}
              onChange={(e) =>
                setSelectedAccount({ ...selectedAccount, accountNumber: e.target.value } as Account)
              }
              fullWidth
              margin="normal"
            />

            {/* Manage Configurations */}
            <Typography variant="h6" mt={4}>
              Manage Configurations
            </Typography>

            <Box display="flex" gap={2} my={2}>
              <TextField
                label="Asset"
                value={searchFilter.asset}
                onChange={(e) => setSearchFilter({ ...searchFilter, asset: e.target.value })}
                fullWidth
              />
              <TextField
                label="Strategy"
                value={searchFilter.strategy}
                onChange={(e) => setSearchFilter({ ...searchFilter, strategy: e.target.value })}
                fullWidth
              />
              <TextField
                label="Timeframe"
                value={searchFilter.timeframe}
                onChange={(e) => setSearchFilter({ ...searchFilter, timeframe: e.target.value })}
                fullWidth
              />
              <Button variant="contained" color="primary" onClick={handleSearchConfigurations}>
                Search
              </Button>
            </Box>

            <Typography variant="h6" mt={2}>
              Search Results
            </Typography>
            <Table>
              <TableBody>
                {availableConfigurations.map((config) => (
                  <TableRow key={config._id}>
                    <TableCell>{config.name}</TableCell>
                    <TableCell>{config.asset}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => handleAddConfiguration(config._id, config.name, config.asset)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
              <Typography variant="h6">
                Linked Configurations
              </Typography>
              <CSVLink
                data={generateCSVData()}
                filename={`${selectedAccount?.nickName}_activeconfigurations.csv`}
                className="btn btn-primary"
              >
                <Button variant="contained" color="primary">
                  Export to CSV
                </Button>
              </CSVLink>
            </Box>
            <Table>
              <TableBody>
                {Array.isArray(linkedConfigurations) && linkedConfigurations.map((config) => (
                  <TableRow key={config._id}>
                    <TableCell>{config.name}</TableCell>
                    <TableCell>{config.asset}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="secondary"
                        onClick={() => handleRemoveConfiguration(config._id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleUpdateAccount}
              sx={{ mt: 4 }}
            >
              Save Changes
            </Button>
          </Box>
        </Drawer>

        {/* Notifications */}
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
        >
          <MuiAlert severity="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </MuiAlert>
        </Snackbar>
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={3000}
          onClose={() => setErrorMessage("")}
        >
          <MuiAlert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default withAuth(Settings);
