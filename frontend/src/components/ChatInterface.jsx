import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => uuidv4());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          session_id: sessionId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();
      const botMessage = {
        type: 'bot',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'error',
        content: error.message || 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleCloseError = () => {
    setError(null);
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
          <Typography variant="h6">DevBot+ Assistant</Typography>
        </Box>
        <List
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor:
                        message.type === 'user'
                          ? 'primary.main'
                          : message.type === 'error'
                          ? 'error.main'
                          : 'success.main',
                    }}
                  >
                    {message.type === 'user' ? (
                      <UserIcon />
                    ) : message.type === 'error' ? (
                      '!'
                    ) : (
                      <BotIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        bgcolor:
                          message.type === 'user'
                            ? 'primary.light'
                            : message.type === 'error'
                            ? 'error.light'
                            : 'background.paper',
                        color:
                          message.type === 'user'
                            ? 'primary.contrastText'
                            : message.type === 'error'
                            ? 'error.contrastText'
                            : 'text.primary',
                        p: 1,
                        borderRadius: 1,
                        maxWidth: '80%',
                        ml: message.type === 'user' ? 'auto' : 0,
                        mr: message.type === 'user' ? 0 : 'auto',
                        border: message.type === 'error' ? '1px solid #d32f2f' : undefined,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: message.type === 'user' ? 'right' : 'left',
                        mt: 0.5,
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  }
                />
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            InputProps={{
              endAdornment: (
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              ),
            }}
          />
        </Box>
      </Paper>
      <Snackbar
        open={!!error}
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

export default ChatInterface; 