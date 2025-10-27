import { Box, Typography, Button, Container } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Block sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom fontWeight="bold">
          403
        </Typography>
        <Typography variant="h5" gutterBottom>
          Access Forbidden
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this resource.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
