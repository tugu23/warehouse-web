import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Group as GroupIcon,
  MyLocation as LocationIcon,
  Brightness4,
  Brightness7,
  Logout,
  Category as CategoryIcon,
  Event as EventIcon,
  Assessment as ReportIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  AssignmentReturn as ReturnIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../config/ThemeProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { text: 'Хянах самбар', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Бараа бүтээгдэхүүн', icon: <InventoryIcon />, path: '/products' },
  {
    text: 'Борлуулалтын шинжилгээ',
    icon: <AnalyticsIcon />,
    path: '/products/analytics',
    roles: ['Admin', 'Manager'],
  },
  {
    text: 'Нөөцийн таамаглал',
    icon: <AnalyticsIcon />,
    path: '/analytics/forecast',
    roles: ['Admin', 'Manager'],
  },
  {
    text: 'Үе шаттай борлуулалт',
    icon: <AnalyticsIcon />,
    path: '/analytics/sales-period',
    roles: ['Admin', 'Manager'],
  },
  { text: 'Ангилал', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Харилцагчид', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Захиалга', icon: <ShoppingCartIcon />, path: '/orders' },
  { text: 'Буцаалт', icon: <ReturnIcon />, path: '/returns', roles: ['Admin', 'Manager'] },
  { text: 'Ажлын төлөвлөгөө', icon: <EventIcon />, path: '/work-plans/visits' },
  { text: 'Тайлан', icon: <ReportIcon />, path: '/reports/sales' },
  {
    text: 'Агент KPI',
    icon: <ReportIcon />,
    path: '/reports/agent-kpi',
    roles: ['Admin', 'Manager', 'SalesAgent', 'MarketSalesperson', 'StoreSalesperson'],
  },
  { text: 'Ажилчид', icon: <GroupIcon />, path: '/employees', roles: ['Admin'] },
  { text: 'Агент хяналт', icon: <LocationIcon />, path: '/agents', roles: ['Admin', 'Manager'] },
  {
    text: 'И-Баримт',
    icon: <ReceiptIcon />,
    path: '/ebarimt',
    roles: ['Admin', 'Manager'],
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { user, logout, hasRole } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item) => !item.roles || hasRole(item.roles));

  const drawer = (
    <Box>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          OASIS
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Oasis - Агуулахын удирдлагын систем
          </Typography>

          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <LanguageSwitcher />

          <IconButton onClick={handleMenuOpen} sx={{ ml: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{user?.name.charAt(0).toUpperCase()}</Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" display="block" color="primary">
                {user?.role}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Гарах
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
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
            display: { xs: 'none', md: 'block' },
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
