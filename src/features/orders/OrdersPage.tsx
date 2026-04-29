import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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
import {
  aggregateDailyOrderProducts,
  orderLocalYmd,
  todayLocalYmd,
} from './dailyOrderProductsAggregate';
import { printDailyOrderProductsPdf } from './printDailyOrderProductsPdf';

type EbarimtListFilter = 'all' | 'returned' | 'active';

export default function OrdersPage() {
  const { canManage, user, hasRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ebarimtListFilter, setEbarimtListFilter] = useState<EbarimtListFilter>('all');
  /** `YYYY-MM-DD` — эхлэх/дуусах өдрөөр интервал шүүх */
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  /** A4 ачааны жагсаалтын өдөр — хүснэгтийн e-barimt шүүлтүүрт нөлөөлөхгүй */
  const [printListDate, setPrintListDate] = useState<string>(() => todayLocalYmd());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll({ limit: 'all' });
      setOrders(response.data?.data?.orders || []);
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

  const handlePrintDailyLoadList = () => {
    const ymd = printListDate.trim();
    if (!ymd) {
      toast.error('Өдөр сонгоно уу');
      return;
    }
    const rows = aggregateDailyOrderProducts(orders, ymd);
    if (rows.length === 0) {
      toast.error('Сонгосон өдөрт захиалгад орсон бараа олдсонгүй');
      return;
    }
    printDailyOrderProductsPdf(rows, ymd);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (ebarimtListFilter === 'returned') {
        if (!o.ebarimtReturnId) return false;
      } else if (ebarimtListFilter === 'active') {
        if (!o.ebarimtRegistered || o.ebarimtReturnId) return false;
      }

      const ymd = orderLocalYmd(o.createdAt);
      if (!ymd) return false;

      const hasDayRange = Boolean(dateFrom || dateTo);
      if (hasDayRange) {
        let from = dateFrom;
        let to = dateTo;
        if (from && to && from > to) {
          [from, to] = [to, from];
        }
        if (from && ymd < from) return false;
        if (to && ymd > to) return false;
      }

      return true;
    });
  }, [orders, ebarimtListFilter, dateFrom, dateTo]);

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
      id: 'ebarimtReturnId',
      label: 'И-баримт',
      align: 'center' as const,
      minWidth: 130,
      format: (row: Order) => {
        if (row.ebarimtReturnId) {
          return <Chip label="Буцаагдсан" color="default" size="small" />;
        }
        if (row.ebarimtRegistered) {
          return <Chip label="Идэвхтэй" color="success" size="small" />;
        }
        return (
          <Typography variant="body2" color="text.secondary">
            Бүртгэлгүй
          </Typography>
        );
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

  const canUpdateAnyOrderStatus = hasRole([
    'Admin',
    'Manager',
    'SalesAgent',
    'MarketSalesperson',
    'StoreSalesperson',
  ]);

  return (
    <Box>
      <DataTable
        title="Orders"
        columns={columns}
        data={filteredOrders}
        searchable
        searchPlaceholder="Search orders..."
        onRowClick={handleRowClick}
        actions={
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={ebarimtListFilter}
              onChange={(_, value: EbarimtListFilter | null) => {
                if (value !== null) setEbarimtListFilter(value);
              }}
              aria-label="И-баримтаар шүүх"
            >
              <ToggleButton value="all">Бүх</ToggleButton>
              <ToggleButton value="returned">Буцаагдсан</ToggleButton>
              <ToggleButton value="active">Идэвхтэй баримт</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              type="date"
              size="small"
              label="Эхлэх огноо"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Интервалын эхлэх огноо' }}
              sx={{ minWidth: 158 }}
            />
            <TextField
              type="date"
              size="small"
              label="Дуусах огноо"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Интервалын дуусах огноо' }}
              sx={{ minWidth: 158 }}
            />
            {dateFrom || dateTo ? (
              <Tooltip title="Огнооны шүүлтүүрийг цэвэрлэх">
                <IconButton
                  size="small"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  aria-label="Огнооны шүүлтүүрийг цэвэрлэх"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            <TextField
              type="date"
              size="small"
              label="Ачааны жагсаалтын өдөр (A4)"
              value={printListDate}
              onChange={(e) => setPrintListDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Ачааны жагсаалтын өдөр' }}
              sx={{ minWidth: 218 }}
            />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={handlePrintDailyLoadList}
              disabled={loading}
            >
              Өдрийн бараа (A4)
            </Button>
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

      {createModalOpen && (
        <OrderForm2
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchOrders();
          }}
        />
      )}

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
          canUpdateStatus={canUpdateAnyOrderStatus}
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
