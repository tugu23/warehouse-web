import { useState, useEffect } from 'react';
import { Box, Button, Chip } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import OrderForm2 from './OrderForm2';
import OrderDetailsModal from './OrderDetailsModal';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import { formatDateTimeMN } from '../../utils/dateFormatter';

export default function OrdersPage() {
  const { canManage, user, isSalesAgent } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll({ limit: 'all' });
      let allOrders = response.data?.data?.orders || [];
      if (isSalesAgent() && user) {
        allOrders = allOrders.filter((order) => order?.createdBy?.id === user?.id);
      }
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const handleRowClick = (order: Order) => {
    handleViewDetails(order);
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
      format: (row: Order) => formatDateTimeMN(row.createdAt),
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
        onRowClick={handleRowClick}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              disabled={loading}
            >
              Шинэчлэх
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Order
            </Button>
          </Box>
        }
      />

      {createModalOpen && <OrderForm2 onClose={() => setCreateModalOpen(false)} />}

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
          currentUserId={user?.id}
          onRefresh={() => {
            fetchOrders();
            if (selectedOrder) {
              ordersApi
                .getById(selectedOrder.id)
                .then((r) => {
                  setSelectedOrder(r.data.data?.order || null);
                })
                .catch(() => {});
            }
          }}
        />
      </Modal>
    </Box>
  );
}
