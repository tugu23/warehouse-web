import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Print as PrintIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import OrderForm2 from './OrderForm2';
import OrderDetailsModal from './OrderDetailsModal';
import EbarimtPrintModal from './EbarimtPrintModal';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import { formatDateTimeMN } from '../../utils/dateFormatter';
import {
  aggregateDailyOrderProducts,
  orderLocalYmd,
  todayLocalYmd,
} from './dailyOrderProductsAggregate';
import { printDailyOrderProductsPdf } from './printDailyOrderProductsPdf';
import { employeesApi } from '../../api';

type EbarimtListFilter = 'all' | 'returned' | 'active';

export default function OrdersPage() {
  const { canManage, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [autoPrintOrder, setAutoPrintOrder] = useState<Order | null>(null);
  const [ebarimtListFilter, setEbarimtListFilter] = useState<EbarimtListFilter>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  /** Сонгосон өдөр - defaulting to today */
  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  /** A4 ачааны жагсаалтын өдөр */
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

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await employeesApi.getAll({ limit: 'all' });
        const list = response.data?.data?.employees || [];
        setEmployees(
          list
            .map((employee) => ({ id: employee.id, name: employee.name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'mn', { sensitivity: 'base' }))
        );
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    loadEmployees();
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, {
        status: status as 'Pending' | 'Fulfilled' | 'Cancelled',
      });
      toast.success('Order status updated successfully!');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
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

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Та энэ захиалгыг бүрмösөн устгах уу? Энэ үйлдлийг буцаах боломжгүй!')) {
      return;
    }

    try {
      await ordersApi.delete(orderId);
      toast.success('Захиалга амжилттай устгагдлаа');
      await fetchOrders();
    } catch (error: unknown) {
      console.error('Error deleting order:', error);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Захиалга устгахад алдаа гарлаа';
      toast.error(message);
    }
  };

  const handleEditOrder = async (order: Order) => {
    try {
      const response = await ordersApi.getById(order.id);
      const fullOrder = response.data.data?.order || null;
      setEditOrder(fullOrder);
    } catch (error) {
      console.error('Error fetching order for edit:', error);
      toast.error('Захиалгын мэдээлэл татахад алдаа гарлаа');
    }
  };

  const handleCreateSuccess = async (createdOrder?: Order) => {
    setCreateModalOpen(false);

    if (!createdOrder?.id) {
      await fetchOrders();
      return;
    }

    try {
      await ordersApi.updateStatus(createdOrder.id, {
        status: 'Fulfilled',
      });

      const response = await ordersApi.getById(createdOrder.id);
      const freshOrder = response.data.data?.order || null;

      if (freshOrder) {
        setAutoPrintOrder(freshOrder);
      } else {
        toast.error('Захиалгын дэлгэрэнгүй мэдээлэл олдсонгүй');
      }
    } catch (error) {
      console.error('Error preparing auto eBarimt print:', error);
      toast.error('Захиалга үүссэн ч eBarimt хэвлэхэд бэлдэхэд алдаа гарлаа');
    } finally {
      await fetchOrders();
    }
  };

  const handlePrintDailyLoadList = () => {
    const ymd = printListDate.trim();
    if (!ymd) {
      toast.error('Өдөр сонгоно уу');
      return;
    }
    const targetOrders =
      selectedEmployeeId === 'all'
        ? orders
        : orders.filter((order) => String(order.createdBy?.id || order.createdById) === selectedEmployeeId);
    const rows = aggregateDailyOrderProducts(targetOrders, ymd);
    if (rows.length === 0) {
      toast.error('Сонгосон өдөрт захиалгад орсон бараа олдсонгүй');
      return;
    }
    const employeeName =
      selectedEmployeeId === 'all'
        ? undefined
        : employees.find((employee) => String(employee.id) === selectedEmployeeId)?.name;
    printDailyOrderProductsPdf(rows, ymd, employeeName);
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

      // Filter by selected day only
      if (selectedDate && ymd !== selectedDate) return false;

      return true;
    });
  }, [orders, ebarimtListFilter, selectedDate]);

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
      label: 'Үүсгэсэн',
      minWidth: 170,
      format: (row: Order) => formatDateTimeMN(row.createdAt),
    },
    {
      id: 'fulfilledAt',
      label: 'Гүйцэтгэсэн',
      minWidth: 170,
      format: (row: Order) => {
        const d = new Date(row.createdAt);
        d.setDate(d.getDate() + 1);
        return formatDateTimeMN(d.toISOString());
      },
    },
    {
      id: 'actions',
      label: 'Үйлдэл',
      align: 'center' as const,
      minWidth: 180,
      format: (row: Order) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditOrder(row);
            }}
          >
            Засах
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOrder(row.id);
            }}
            disabled={!canManage}
          >
            Устгах
          </Button>
        </Box>
      ),
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  const canUpdateAnyOrderStatus = true;

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
              select
              size="small"
              label="Ажилтан"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">Бүх ажилтан</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              size="small"
              label="Өдөр"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Сонгосон өдөр' }}
              sx={{ minWidth: 158 }}
            />
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
          onSuccess={handleCreateSuccess}
        />
      )}

      {autoPrintOrder && (
        <EbarimtPrintModal
          order={autoPrintOrder}
          onClose={() => setAutoPrintOrder(null)}
          onSuccess={() => {
            setAutoPrintOrder(null);
            fetchOrders();
          }}
        />
      )}

      {editOrder && (
        <OrderForm2
          initialOrder={editOrder}
          onClose={() => setEditOrder(null)}
          onSuccess={async () => {
            setEditOrder(null);
            await fetchOrders();
            toast.success('Захиалга шинэчлэгдлээ');
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
