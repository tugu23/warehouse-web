import { AxiosError } from 'axios';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { employeesApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { Employee } from '../../types';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile data
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await employeesApi.getMe();
        if (response.data?.data?.employee) {
          setEmployee(response.data.data.employee);
          setNewEmail(response.data.data.employee.email);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        const err = error as AxiosError<{ message?: string }>;
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Профайлыг ачаалж чадсангүй',
          severity: 'error',
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Одоогийн нууц үгийг оруулна уу');
      return;
    }

    if (!newPassword) {
      setPasswordError('Шинэ нууц үгийг оруулна уу');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Шинэ нууц үг таарахгүй байна');
      return;
    }

    setChangingPassword(true);

    try {
      await employeesApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Нууц үг амжилттай өөрчлөгдлөө');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setSnackbar({
        open: true,
        message: 'Нууц үг амжилттай өөрчлөгдлөө',
        severity: 'success',
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || 'Нууц үг өөрчлөхөд алдаа гарлаа';
      setPasswordError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail) {
      setEmailError('Шинэ имэйл хаягийг оруулна уу');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Зөв имэйл хаяг оруулна уу');
      return;
    }

    if (!emailPassword) {
      setEmailError('Баталгаажуулахад нууц үг оруулна уу');
      return;
    }

    setChangingEmail(true);

    try {
      await employeesApi.changeEmail({
        newEmail,
        password: emailPassword,
      });

      setEmailSuccess('Имэйл хаяг амжилттай өөрчлөгдлөө');
      setEmailPassword('');

      // Update local user data
      if (user) {
        updateUser({ ...user, email: newEmail });
      }

      // Update employee data
      if (employee) {
        setEmployee({ ...employee, email: newEmail });
      }

      setSnackbar({
        open: true,
        message: 'Имэйл хаяг амжилттай өөрчлөгдлөө',
        severity: 'success',
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || 'Имэйл хаяг өөрчлөхөд алдаа гарлаа';
      setEmailError(errorMessage);
    } finally {
      setChangingEmail(false);
    }
  };

  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Миний профайл
      </Typography>

      {/* Profile Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Хувийн мэдээлэл</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Нэр
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {employee?.name || user?.name || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Имэйл
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {employee?.email || user?.email || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Эрх
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {employee?.role?.name || user?.role || '-'}
              </Typography>
            </Box>
            {employee?.phoneNumber && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Утас
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {employee.phoneNumber}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Нууц үг өөрчлөх</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Одоогийн нууц үг"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Шинэ нууц үг"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Хамгийн багадаа 6 тэмдэгт"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Шинэ нууц үг (давтан)"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handlePasswordChange}
              disabled={changingPassword}
              startIcon={
                changingPassword ? <CircularProgress size={20} color="inherit" /> : <LockIcon />
              }
            >
              {changingPassword ? 'Өөрчлөгдөж байна...' : 'Нууц үг өөрчлөх'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Email Change Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Имэйл хаяг өөрчлөх</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {emailError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {emailError}
            </Alert>
          )}

          {emailSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {emailSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Шинэ имэйл хаяг"
              type="email"
              fullWidth
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="example@email.com"
            />
            <TextField
              label="Нууц үг (баталгаажуулахад)"
              type={showEmailPassword ? 'text' : 'password'}
              fullWidth
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowEmailPassword(!showEmailPassword)} edge="end">
                      {showEmailPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleEmailChange}
              disabled={changingEmail}
              startIcon={
                changingEmail ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />
              }
            >
              {changingEmail ? 'Өөрчлөгдөж байна...' : 'Имэйл хаяг өөрчлөх'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
