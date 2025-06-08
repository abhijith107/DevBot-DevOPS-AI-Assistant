import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  List as ListIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import ChatInterface from './components/ChatInterface';
import LogsViewer from './components/LogsViewer';
import CommandExecutor from './components/CommandExecutor';

const drawerWidth = 240;

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          DevBot+
        </Typography>
      </Toolbar>
      <List>
        <ListItem
          button
          selected={currentView === 'chat'}
          onClick={() => handleViewChange('chat')}
        >
          <ListItemIcon>
            <ChatIcon color={currentView === 'chat' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Chat" />
        </ListItem>
        <ListItem
          button
          selected={currentView === 'logs'}
          onClick={() => handleViewChange('logs')}
        >
          <ListItemIcon>
            <ListIcon color={currentView === 'logs' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Logs" />
        </ListItem>
        <ListItem
          button
          selected={currentView === 'commands'}
          onClick={() => handleViewChange('commands')}
        >
          <ListItemIcon>
            <TerminalIcon
              color={currentView === 'commands' ? 'primary' : 'inherit'}
            />
          </ListItemIcon>
          <ListItemText primary="Commands" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {currentView === 'chat'
              ? 'Chat Interface'
              : currentView === 'logs'
              ? 'System Logs'
              : 'Command Executor'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <Container
          maxWidth={false}
          sx={{
            height: 'calc(100vh - 88px)',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {currentView === 'chat' && <ChatInterface />}
          {currentView === 'logs' && <LogsViewer />}
          {currentView === 'commands' && <CommandExecutor />}
        </Container>
      </Box>
    </Box>
  );
}

export default App; 