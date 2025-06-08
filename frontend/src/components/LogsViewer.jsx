import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const wsRef = useRef(null);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const setupWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws');
      
      wsRef.current.onopen = () => {
        setError('');
        setShowError(false);
        console.log('WebSocket connection established');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 100));
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to log server. Please ensure the backend server is running.');
        setShowError(true);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (autoRefresh) {
            setupWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError('Failed to connect to log server. Please ensure the backend server is running.');
      setShowError(true);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load logs. Please ensure the backend server is running.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = level === 'all' || log.level === level;
    return matchesFilter && matchesLevel;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">System Logs</Typography>
        <Box>
          <Tooltip title="Refresh Logs">
            <IconButton onClick={fetchLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Auto-refresh">
            <IconButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Logs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Log Level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {loading ? 'Loading logs...' : 'No logs to display.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor:
                      log.level === 'error'
                        ? 'error.light'
                        : log.level === 'warning'
                        ? 'warning.light'
                        : 'inherit',
                  }}
                >
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color:
                          log.level === 'error'
                            ? 'error.main'
                            : log.level === 'warning'
                            ? 'warning.main'
                            : 'info.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {log.level.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.source}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LogsViewer; 