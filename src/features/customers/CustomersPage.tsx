import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { customersApi } from '../../api';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import CustomerForm from './CustomerForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function CustomersPage() {
  const { canManage } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customersApi.getAll();
      setCustomers(response.data.data?.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateCustomerRequest) => {
    try {
      await customersApi.create(data);
      toast.success('Customer created successfully!');
      setModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleUpdate = async (data: UpdateCustomerRequest) => {
    if (!selectedCustomer) return;
    try {
      await customersApi.update(selectedCustomer.id, data);
      toast.success('Customer updated successfully!');
      setModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleViewOnMap = (customer: Customer) => {
    const url = `https://www.google.com/maps?q=${customer.locationLatitude},${customer.locationLongitude}`;
    window.open(url, '_blank');
  };

  const columns = [
    {
      id: 'name',
      label: 'Customer Name',
      minWidth: 180,
    },
    {
      id: 'phoneNumber',
      label: 'Phone',
      minWidth: 130,
    },
    {
      id: 'address',
      label: 'Address',
      minWidth: 200,
    },
    {
      id: 'customerType',
      label: 'Type',
      align: 'center' as const,
      format: (row: Customer) => (
        <Chip
          label={row.customerType.name}
          color={row.customerType.name === 'Wholesale' ? 'primary' : 'secondary'}
          size="small"
        />
      ),
    },
    {
      id: 'assignedAgent',
      label: 'Assigned Agent',
      minWidth: 150,
      format: (row: Customer) => row.assignedAgent?.name || 'Not assigned',
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      format: (row: Customer) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOnMap(row);
            }}
            title="View on Map"
          >
            <LocationIcon fontSize="small" />
          </IconButton>
          {canManage() && (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Customers"
        columns={columns}
        data={customers}
        searchable
        searchPlaceholder="Search customers..."
        actions={
          canManage() && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
              Add Customer
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="md"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={selectedCustomer ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>
    </Box>
  );
}
