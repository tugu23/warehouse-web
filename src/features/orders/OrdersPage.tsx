import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Chip } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api';
import { Order, CreateOrderRequest, UpdateOrderStatusRequest } from '../../types';
import OrderForm from './OrderForm';
import OrderDetailsModal from './OrderDetailsModal';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function OrdersPage() {
  const { canManage } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data.data?.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateOrderRequest) => {
    try {
      await ordersApi.create(data);
      toast.success('Order created successfully!');
      setCreateModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, {
        status: status as 'Pending' | 'Fulfilled' | 'Cancelled',
      });
      toast.success('Order status updated successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleViewDetails = async (order: Order) => {
    try {
      const response = await ordersApi.getById(order.id);
      setSelectedOrder(response.data.data?.order || null);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const columns = [
    {
      id: 'id',
      label: 'Order ID',
      minWidth: 80,
      format: (row: Order) => `#${row.id}`,
    },
    {
      id: 'customer',
      label: 'Customer',
      minWidth: 150,
      format: (row: Order) => row.customer?.name || 'N/A',
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      align: 'right' as const,
      minWidth: 120,
      format: (row: Order) => `₮${Number(row.totalAmount).toLocaleString()}`,
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center' as const,
      format: (row: Order) => {
        const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
          Pending: 'warning',
          Fulfilled: 'success',
          Cancelled: 'error',
        };
        return <Chip label={row.status} color={colors[row.status]} size="small" />;
      },
    },
    {
      id: 'createdBy',
      label: 'Created By',
      minWidth: 130,
      format: (row: Order) => row.createdBy?.name || 'N/A',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 170,
      format: (row: Order) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      format: (row: Order) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
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
        title="Orders"
        columns={columns}
        data={orders}
        searchable
        searchPlaceholder="Search orders..."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Order
          </Button>
        }
      />

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Order"
        maxWidth="md"
      >
        <OrderForm onSubmit={handleCreate} onCancel={() => setCreateModalOpen(false)} />
      </Modal>

      <Modal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Order #${selectedOrder?.id} Details`}
        maxWidth="md"
      >
        <OrderDetailsModal
          order={selectedOrder}
          onUpdateStatus={handleUpdateStatus}
          canManage={canManage()}
        />
      </Modal>
    </Box>
  );
}
