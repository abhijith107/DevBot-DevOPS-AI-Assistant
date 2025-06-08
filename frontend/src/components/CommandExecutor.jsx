import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Terminal as TerminalIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

function CommandExecutor() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExecute = async () => {
    if (!command.trim()) return;

    setLoading(true);
    setError('');

    const commandEntry = {
      command: command,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    setHistory((prev) => [commandEntry, ...prev]);
    setCommand('');

    try {
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command }),
      });

      const data = await response.json();

      setHistory((prev) =>
        prev.map((entry) =>
          entry === commandEntry
            ? {
                ...entry,
                status: 'success',
                output: data.output,
                exitCode: data.exit_code,
              }
            : entry
        )
      );
    } catch (error) {
      console.error('Error executing command:', error);
      setError('Failed to execute command. Please try again.');
      setHistory((prev) =>
        prev.map((entry) =>
          entry === commandEntry
            ? {
                ...entry,
                status: 'error',
                output: 'Command execution failed',
              }
            : entry
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <TerminalIcon color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Command Executor</Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        <List
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {history.map((entry, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>{getStatusIcon(entry.status)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {entry.command}
                      </Typography>
                      <Chip
                        label={entry.status}
                        size="small"
                        color={getStatusColor(entry.status)}
                      />
                      {entry.exitCode !== undefined && (
                        <Chip
                          label={`Exit Code: ${entry.exitCode}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="pre"
                        variant="body2"
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          overflow: 'auto',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {entry.output || 'Executing...'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < history.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter command..."
            disabled={loading}
            InputProps={{
              startAdornment: (
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    mr: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  $
                </Box>
              ),
              endAdornment: (
                <IconButton
                  color="primary"
                  onClick={handleExecute}
                  disabled={loading || !command.trim()}
                >
                  {loading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              ),
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default CommandExecutor; 