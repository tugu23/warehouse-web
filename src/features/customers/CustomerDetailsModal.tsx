import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Customer } from '../../types';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onEdit: () => void;
  onViewOnMap: () => void;
  canManage: boolean;
}

export default function CustomerDetailsModal({
  customer,
  onEdit,
  onViewOnMap,
  canManage,
}: CustomerDetailsModalProps) {
  if (!customer) return null;

  return (
    <Box>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Байгууллагын мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Байгууллагын нэр
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {customer.name}
                </Typography>
                {customer.name2 && (
                  <Typography variant="body2" color="text.secondary">
                    {customer.name2}
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Регистрийн дугаар
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {customer.registrationNumber ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={customer.registrationNumber}
                        color="primary"
                        size="medium"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                      {customer.isVatPayer && (
                        <Chip label="НӨАТ төлөгч" color="success" size="small" />
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Харилцагчийн төрөл
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {customer.organizationType ? (
                    <Stack direction="row" spacing={1}>
                      <Chip label={customer.organizationType} color="primary" size="medium" />
                      {customer.customerType && (
                        <Chip
                          label={customer.customerType.typeName || customer.customerType.name}
                          color={customer.customerType.name === 'Wholesale' ? 'info' : 'secondary'}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  ) : customer.customerType ? (
                    <Chip
                      label={customer.customerType.typeName || customer.customerType.name}
                      color={customer.customerType.name === 'Wholesale' ? 'primary' : 'secondary'}
                      size="medium"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Холбоо барих мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Утасны дугаар
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {customer.phoneNumber}
                </Typography>
              </Grid>
              {customer.email && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    Имэйл
                  </Typography>
                  <Typography variant="body1">{customer.email}</Typography>
                </Grid>
              )}
              {customer.contactPerson && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Холбоо барих хүн
                  </Typography>
                  <Typography variant="body1">{customer.contactPerson}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Байршлын мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Хаяг
                </Typography>
                <Typography variant="body1">{customer.address}</Typography>
              </Grid>
              {customer.district && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Дүүрэг
                  </Typography>
                  <Typography variant="body1">{customer.district}</Typography>
                </Grid>
              )}
              {customer.locationLatitude && customer.locationLongitude && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    GPS координат
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {customer.locationLatitude.toFixed(6)}, {customer.locationLongitude.toFixed(6)}
                  </Typography>
                </Grid>
              )}
            </Grid>
            {customer.locationLatitude && customer.locationLongitude && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<LocationIcon />}
                  onClick={onViewOnMap}
                  size="small"
                >
                  Газрын зураг дээр харах
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Sales Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Борлуулалтын мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Хариуцсан борлуулагч
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {customer.assignedAgent?.name || 'Томилоогүй'}
                </Typography>
              </Grid>
              {customer.creditLimit && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Зээлийн лимит
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ₮{Number(customer.creditLimit).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        {canManage && (
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Үйлдлүүд
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={onEdit}>
                Засах
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
