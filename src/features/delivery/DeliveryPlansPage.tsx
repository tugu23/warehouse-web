import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  DeliveryPlan,
  CreateDeliveryPlanRequest,
  UpdateDeliveryPlanRequest,
  Employee,
  Customer,
  Order,
} from '../../types';
import { deliveryPlansApi, employeesApi, customersApi, ordersApi } from '../../api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { format } from 'date-fns';

export default function DeliveryPlansPage() {
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DeliveryPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<DeliveryPlan | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDeliveryPlanRequest>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, employeesRes, customersRes, ordersRes] = await Promise.all([
        deliveryPlansApi.getAll(),
        employeesApi.getAll(),
        customersApi.getAll(),
        ordersApi.getAll(),
      ]);
      setDeliveryPlans(plansRes.data.data?.deliveryPlans || []);
      setEmployees(employeesRes.data.data?.employees || []);
      setCustomers(customersRes.data.data?.customers || []);
      setOrders(ordersRes.data.data?.orders || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPlan(null);
    reset({
      planDate: format(new Date(), 'yyyy-MM-dd'),
      agentId: 0,
      customerId: 0,
      scheduledTime: '',
      description: '',
      targetArea: '',
      estimatedOrders: 0,
      deliveryNotes: '',
    });
    setFormOpen(true);
  };

  const handleEdit = (plan: DeliveryPlan) => {
    setSelectedPlan(plan);
    reset({
      planDate: plan.planDate,
      agentId: plan.agentId,
      customerId: plan.customerId,
      orderId: plan.orderId,
      scheduledTime: plan.scheduledTime || '',
      description: plan.description || '',
      targetArea: plan.targetArea || '',
      estimatedOrders: plan.estimatedOrders || 0,
      deliveryNotes: plan.deliveryNotes || '',
    });
    setFormOpen(true);
  };

  const handleDelete = (plan: DeliveryPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      await deliveryPlansApi.delete(planToDelete.id);
      toast.success('Delivery plan deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete delivery plan');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const onSubmit = async (data: CreateDeliveryPlanRequest) => {
    try {
      if (selectedPlan) {
        await deliveryPlansApi.update(selectedPlan.id, data as UpdateDeliveryPlanRequest);
        toast.success('Delivery plan updated successfully');
      } else {
        await deliveryPlansApi.create(data);
        toast.success('Delivery plan created successfully');
      }
      setFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save delivery plan');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned':
        return 'info';
      case 'InProgress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            Delivery Plans
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Plan
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Target Area</TableCell>
              <TableCell>Est. Orders</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deliveryPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No delivery plans found
                </TableCell>
              </TableRow>
            ) : (
              deliveryPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.id}</TableCell>
                  <TableCell>{format(new Date(plan.planDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{plan.scheduledTime || '-'}</TableCell>
                  <TableCell>{plan.agent?.name || '-'}</TableCell>
                  <TableCell>{plan.customer?.name || '-'}</TableCell>
                  <TableCell>{plan.targetArea || '-'}</TableCell>
                  <TableCell>{plan.estimatedOrders || 0}</TableCell>
                  <TableCell>
                    <Chip label={plan.status} color={getStatusColor(plan.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(plan)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(plan)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delivery Plan Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{selectedPlan ? 'Edit Delivery Plan' : 'Add Delivery Plan'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="planDate"
                  control={control}
                  rules={{ required: 'Date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Plan Date"
                      type="date"
                      fullWidth
                      required
                      error={!!errors.planDate}
                      helperText={errors.planDate?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="scheduledTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scheduled Time"
                      type="time"
                      fullWidth
                      error={!!errors.scheduledTime}
                      helperText={errors.scheduledTime?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="agentId"
                  control={control}
                  rules={{ required: 'Agent is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.agentId} required>
                      <InputLabel>Agent</InputLabel>
                      <Select {...field} label="Agent">
                        <MenuItem value={0}>Select Agent</MenuItem>
                        {employees
                          .filter((e) => e.role.name === 'SalesAgent')
                          .map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>
                              {emp.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customerId"
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.customerId} required>
                      <InputLabel>Customer</InputLabel>
                      <Select {...field} label="Customer">
                        <MenuItem value={0}>Select Customer</MenuItem>
                        {customers.map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="orderId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Order (Optional)</InputLabel>
                      <Select {...field} label="Order (Optional)" value={field.value || ''}>
                        <MenuItem value="">None</MenuItem>
                        {orders.map((order) => (
                          <MenuItem key={order.id} value={order.id}>
                            Order #{order.id} - {order.customer?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="targetArea"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Target Area"
                      fullWidth
                      error={!!errors.targetArea}
                      helperText={errors.targetArea?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="estimatedOrders"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Estimated Orders"
                      type="number"
                      fullWidth
                      error={!!errors.estimatedOrders}
                      helperText={errors.estimatedOrders?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="deliveryNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Delivery Notes"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.deliveryNotes}
                      helperText={errors.deliveryNotes?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Delivery Plan"
        message={`Are you sure you want to delete this delivery plan?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPlanToDelete(null);
        }}
      />
    </Box>
  );
}
