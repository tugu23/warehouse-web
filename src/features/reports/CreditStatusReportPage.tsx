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
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { CreditStatusReport, Customer } from '../../types';
import { reportsApi, customersApi } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CreditStatusReportPage() {
  const [report, setReport] = useState<CreditStatusReport | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      setCustomers(response.data.data?.customers || []);
    } catch (error) {
      console.error('Failed to load customers', error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = selectedCustomer ? { customerId: selectedCustomer } : {};
      const response = await reportsApi.getCreditStatus(params);
      setReport(response.data.data || null);
    } catch (error) {
      toast.error('Failed to load credit status report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.success('Export functionality coming soon');
      // const response = await reportsApi.exportCreditStatus({
      //   customerId: selectedCustomer || undefined,
      // });
      // Download logic here
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Credit Status Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export to Excel
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Customer</InputLabel>
              <Select
                value={selectedCustomer}
                label="Filter by Customer"
                onChange={(e) => setSelectedCustomer(e.target.value as number)}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button variant="contained" onClick={fetchReport} fullWidth>
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Paper>
      )}

      {!loading && report && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Overdue Amount
                  </Typography>
                  <Typography variant="h4" component="div" color="error">
                    ₮{report.summary.totalOverdueAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Credit Customers
                  </Typography>
                  <Typography variant="h4" component="div">
                    {report.summary.totalCreditCustomers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Overdue Orders
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {report.summary.totalOverdueOrders}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Overdue Payments Table */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Overdue Payments
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Remaining Amount</TableCell>
                  <TableCell>Days Overdue</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.overduePayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No overdue payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  report.overduePayments.map((payment) => (
                    <TableRow key={payment.order.id}>
                      <TableCell>#{payment.order.id}</TableCell>
                      <TableCell>{payment.customer.name}</TableCell>
                      <TableCell>₮{Number(payment.order.totalAmount).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        ₮{payment.overdueAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={`${payment.daysOverdue} days`} color="error" size="small" />
                      </TableCell>
                      <TableCell>
                        {payment.order.creditDueDate
                          ? format(new Date(payment.order.creditDueDate), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip label={payment.order.paymentStatus} color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Credit Customers Table */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Credit Customers
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Customer</TableCell>
                  <TableCell>District</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Total Credit</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Remaining Amount</TableCell>
                  <TableCell>Orders Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.creditCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No credit customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  report.creditCustomers.map((creditCustomer) => (
                    <>
                      <TableRow key={creditCustomer.customer.id}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === creditCustomer.customer.id
                                  ? null
                                  : creditCustomer.customer.id
                              )
                            }
                          >
                            {expandedRow === creditCustomer.customer.id ? (
                              <KeyboardArrowUp />
                            ) : (
                              <KeyboardArrowDown />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>{creditCustomer.customer.name}</TableCell>
                        <TableCell>{creditCustomer.customer.district || '-'}</TableCell>
                        <TableCell>{creditCustomer.customer.phoneNumber}</TableCell>
                        <TableCell>₮{creditCustomer.totalCredit.toLocaleString()}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>
                          ₮{creditCustomer.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: creditCustomer.remainingAmount > 0 ? 'error.main' : 'inherit',
                            fontWeight: 'bold',
                          }}
                        >
                          ₮{creditCustomer.remainingAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{creditCustomer.orders.length}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse
                            in={expandedRow === creditCustomer.customer.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Orders
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Paid</TableCell>
                                    <TableCell>Remaining</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {creditCustomer.orders.map((order) => (
                                    <TableRow key={order.id}>
                                      <TableCell>#{order.id}</TableCell>
                                      <TableCell>
                                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                      </TableCell>
                                      <TableCell>
                                        ₮{Number(order.totalAmount).toLocaleString()}
                                      </TableCell>
                                      <TableCell>₮{order.paidAmount.toLocaleString()}</TableCell>
                                      <TableCell>
                                        ₮{order.remainingAmount.toLocaleString()}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={order.paymentStatus}
                                          size="small"
                                          color={
                                            order.paymentStatus === 'Paid'
                                              ? 'success'
                                              : order.paymentStatus === 'Overdue'
                                                ? 'error'
                                                : 'warning'
                                          }
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
