import { useState, useEffect } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { customersApi } from '../../api';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import CustomerForm from './CustomerForm';
import CustomerDetailsModal from './CustomerDetailsModal';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function CustomersPage() {
  const { canManage, canCreate } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customersApi.getAll({ limit: 'all' });
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
      setEditModalOpen(false);
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
      setEditModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleOpenEdit = () => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleViewOnMap = () => {
    if (!selectedCustomer) return;
    const url = `https://www.google.com/maps?q=${selectedCustomer.locationLatitude},${selectedCustomer.locationLongitude}`;
    window.open(url, '_blank');
  };

  const columns = [
    {
      id: 'name',
      label: 'Байгууллагын нэр',
      minWidth: 180,
      format: (row: Customer) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {row.name}
          </Typography>
          {row.name2 && (
            <Typography variant="caption" color="text.secondary" display="block">
              {row.name2}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'registrationNumber',
      label: '⭐ Регистр',
      minWidth: 130,
      format: (row: Customer) =>
        row.registrationNumber ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={row.registrationNumber}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            {row.isVatPayer && <Chip label="НӨАТ" color="success" size="small" variant="filled" />}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: 'phoneNumber',
      label: 'Утас',
      minWidth: 120,
    },
    {
      id: 'address',
      label: 'Хаяг',
      minWidth: 200,
      format: (row: Customer) => (
        <Box>
          <Typography variant="body2">{row.address}</Typography>
          {row.district && (
            <Typography variant="caption" color="text.secondary">
              {row.district}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'organizationType',
      label: 'Төрөл',
      align: 'center' as const,
      minWidth: 130,
      format: (row: Customer) => {
        if (!row.organizationType) {
          // Fallback to customerType if organizationType is not set
          return row.customerType ? (
            <Chip
              label={row.customerType.typeName || row.customerType.name}
              color={row.customerType.name === 'Wholesale' ? 'primary' : 'secondary'}
              size="small"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        // Display organizationType with appropriate color
        const typeColors: Record<
          string,
          'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
        > = {
          Зах: 'primary',
          Дэлгүүр: 'secondary',
          Ресторан: 'success',
          Зах2: 'info',
          Борлуулалт: 'warning',
        };

        return (
          <Chip
            label={row.organizationType}
            color={typeColors[row.organizationType] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      id: 'assignedAgent',
      label: 'Борлуулагч',
      minWidth: 130,
      format: (row: Customer) => row.assignedAgent?.name || 'Томилоогүй',
    },
  ];

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    if (!detailsModalOpen) {
      setSelectedCustomer(null);
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Харилцагчид"
        columns={columns}
        data={customers}
        searchable
        searchPlaceholder="Нэр, регистр, утас, хаягаар хайх..."
        onRowClick={handleRowClick}
        actions={
          canCreate() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedCustomer(null);
                setEditModalOpen(true);
              }}
            >
              Харилцагч нэмэх
            </Button>
          )
        }
      />

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Харилцагчийн дэлгэрэнгүй: ${selectedCustomer?.name}`}
        maxWidth="md"
      >
        <CustomerDetailsModal
          customer={selectedCustomer}
          onEdit={handleOpenEdit}
          onViewOnMap={handleViewOnMap}
          canManage={canManage()}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={selectedCustomer ? 'Харилцагч засах' : 'Шинэ харилцагч нэмэх'}
        maxWidth="md"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={selectedCustomer ? handleUpdate : handleCreate}
          onCancel={handleCloseEditModal}
        />
      </Modal>
    </Box>
  );
}
