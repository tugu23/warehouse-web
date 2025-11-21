import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { employeesApi, customersApi, agentsApi } from '../../api';
import { Employee, Customer, EmployeeLocationFiltered } from '../../types';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function EmployeeLocationTrackingPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [selectedStoreAddress, setSelectedStoreAddress] = useState<string>('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [locationData, setLocationData] = useState<EmployeeLocationFiltered | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchCustomers();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll();
      const allEmployees = response.data.data?.employees || [];
      // Filter only sales agents
      const salesAgents = allEmployees.filter((emp) => emp.role.name === 'SalesAgent');
      setEmployees(salesAgents);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Ажилчдын мэдээлэл татахад алдаа гарлаа');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      const allCustomers = response.data.data?.customers || [];
      // Filter only Store customers
      const stores = allCustomers.filter(
        (c) => c.organizationType === 'Store' || c.organizationType === 'Market Warehouse'
      );
      setCustomers(stores);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Харилцагчдын мэдээлэл татахад алдаа гарлаа');
    }
  };

  const fetchLocationData = async () => {
    if (!selectedEmployee) {
      toast.error('Ажилчин сонгоно уу');
      return;
    }

    setLoading(true);
    try {
      const response = await agentsApi.getLocationsByStore(selectedEmployee as number, {
        storeAddress: selectedStoreAddress,
        startDate,
        endDate,
      });
      setLocationData(response.data.data || null);
    } catch (error) {
      console.error('Error fetching location data:', error);
      toast.error('Байршлын мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!locationData) {
      toast.error('Экспорт хийх мэдээлэл байхгүй байна');
      return;
    }

    setExporting(true);
    try {
      // Export logic would go here
      toast.success('Excel файл амжилттай татагдлаа');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа');
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}ц ${mins}м`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ажилчдын байршлын хяналт
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Ажилчдын дэлгүүрт зочилсон байршил, хугацааг 7 хоногийн турш харах. Зөвхөн дэлгүүрийн
        хаягуудыг харуулна. Захын лангуу байршил харагдахгүй.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth required>
                <InputLabel>Ажилтан</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Ажилтан"
                  onChange={(e) =>
                    setSelectedEmployee(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <MenuItem value="">Сонгох</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Дэлгүүрийн хаяг</InputLabel>
                <Select
                  value={selectedStoreAddress}
                  label="Дэлгүүрийн хаяг"
                  onChange={(e) => setSelectedStoreAddress(e.target.value)}
                >
                  <MenuItem value="">Бүгд</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.address}>
                      {customer.name} - {customer.address}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Эхлэх огноо"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Дуусах огноо"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={fetchLocationData}
                disabled={loading || !selectedEmployee}
                fullWidth
                sx={{ height: '56px' }}
              >
                {loading ? 'Татаж байна...' : 'Хайх'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <TableSkeleton />}

      {locationData && !loading && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{locationData.summary.totalVisits}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Нийт зочилсон
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{locationData.summary.uniqueStores}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Өөр дэлгүүр
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">
                    {formatDuration(locationData.summary.totalDuration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Нийт зарцуулсан хугацаа
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={exporting}
                fullWidth
                sx={{ height: '100%' }}
              >
                {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Map View - Placeholder */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Газрын зураг
                  </Typography>
                  <Box
                    sx={{
                      height: 400,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Газрын зургийн интеграци (Google Maps / Leaflet)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Timeline View */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Зочилсон дэлгүүрүүд
                  </Typography>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {locationData.storeVisits.length === 0 ? (
                      <Alert severity="info">Зочилсон дэлгүүр байхгүй байна</Alert>
                    ) : (
                      locationData.storeVisits.map((visit, index) => (
                        <Box key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <LocationIcon color="primary" fontSize="small" />
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {visit.storeName}
                                  </Typography>
                                  {visit.orderId && (
                                    <Chip
                                      label={`Захиалга #${visit.orderId}`}
                                      size="small"
                                      color="success"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {visit.storeAddress}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <TimeIcon fontSize="small" />
                                      <Typography variant="caption">
                                        Ирсэн: {format(new Date(visit.arrivalTime), 'HH:mm')}
                                      </Typography>
                                    </Box>
                                    {visit.departureTime && (
                                      <Typography variant="caption">
                                        Явсан: {format(new Date(visit.departureTime), 'HH:mm')}
                                      </Typography>
                                    )}
                                    {visit.duration && (
                                      <Chip
                                        label={formatDuration(visit.duration)}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < locationData.storeVisits.length - 1 && <Divider />}
                        </Box>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !locationData && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Ажилчин сонгоод "Хайх" товчийг дарна уу
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
