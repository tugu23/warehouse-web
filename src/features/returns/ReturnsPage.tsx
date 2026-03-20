import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab, Chip, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Return, CreateReturnRequest, Order } from '../../types';
import { returnsApi, ordersApi } from '../../api';
import ReturnForm from './ReturnForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

const POS_API_URL = 'http://localhost:7080';

export default function ReturnsPage() {
  const [tab, setTab] = useState(0);

  // Ердийн буцаалт
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // eBarimt захиалга
  const [ebarimtOrders, setEbarimtOrders] = useState<Order[]>([]);
  const [ebarimtLoading, setEbarimtLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);

  useEffect(() => {
    fetchReturns();
    fetchEbarimtOrders();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await returnsApi.getAll();
      setReturns(response.data.data?.returns || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEbarimtOrders = async () => {
    setEbarimtLoading(true);
    try {
      const response = await ordersApi.getAll({ limit: 'all' });
      const all = response.data.data?.orders || [];
      // eBarimt бүртгэгдсэн захиалгуудыг шүүнэ
      setEbarimtOrders(all.filter((o) => o.ebarimtRegistered && o.ebarimtBillId));
    } catch (error) {
      console.error('Error fetching eBarimt orders:', error);
    } finally {
      setEbarimtLoading(false);
    }
  };

  const handleCreate = async (data: CreateReturnRequest) => {
    try {
      await returnsApi.create(data);
      toast.success('Буцаалт амжилттай үүслээ!');
      setModalOpen(false);
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Буцаалт үүсгэхэд алдаа гарлаа');
    }
  };

  const isB2BOrder = (order: Order) =>
    order.ebarimtType === 'B2B' || (!order.ebarimtType && !!order.customer?.registrationNumber);

  const handleEbarimtReturn = async (order: Order) => {
    if (isB2BOrder(order)) {
      toast.error('B2B баримт буцаалт хийх боломжгүй');
      return;
    }
    if (
      !window.confirm(
        `Захиалга #${order.id}-ийн eBarimt баримтыг буцаах уу?\nBill ID: ${order.ebarimtBillId}`
      )
    )
      return;
    setReturningId(order.id);
    try {
      // 1. Backend-ээс ebarimtBillId болон ebarimtDate авах
      const infoRes = await ordersApi.ebarimtReturn(order.id);
      const { ebarimtBillId, ebarimtDate } = infoRes.data?.data || {};

      if (!ebarimtBillId) {
        toast.error('eBarimt мэдээлэл олдсонгүй');
        return;
      }

      // 2. Frontend-ээс шууд POS API-руу DELETE хүсэлт
      const posRes = await fetch(`${POS_API_URL}/rest/receipt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ebarimtBillId, date: ebarimtDate }),
      });

      interface PosReceiptDeleteBody {
        message?: string;
        id?: string;
      }
      let posData: PosReceiptDeleteBody | null = null;
      const rawText = await posRes.text();
      console.log(`eBarimt return HTTP ${posRes.status} | body: ${rawText}`);
      try {
        posData = rawText ? (JSON.parse(rawText) as PosReceiptDeleteBody) : null;
      } catch {
        console.warn('POS API response is not JSON:', rawText);
      }

      const httpOk = posRes.ok;
      const errMessage = posData?.message || '';

      // UNIQUE constraint = POS-д аль хэдийн буцаагдсан → DB-д тэмдэглэнэ
      const alreadyReturned = errMessage.toLowerCase().includes('unique constraint');
      const isSuccess = httpOk || alreadyReturned;

      if (isSuccess) {
        // 3. DB-д буцаалт тэмдэглэх
        await ordersApi.ebarimtReturnDone(order.id, posData?.id || ebarimtBillId);
        const msg = alreadyReturned
          ? 'eBarimt-д аль хэдийн буцаагдсан байсан. Систем шинэчлэгдлээ.'
          : 'eBarimt буцаалт амжилттай!';
        toast.success(msg);
        fetchEbarimtOrders();
      } else {
        toast.error(
          `eBarimt буцаалт амжилтгүй: ${errMessage || rawText || `HTTP ${posRes.status}`}`
        );
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'eBarimt буцаалт хийхэд алдаа гарлаа');
    } finally {
      setReturningId(null);
    }
  };

  // Буцаагдаагүй eBarimt захиалгуудын тоо (tab badge)
  const pendingReturnCount = ebarimtOrders.filter((o) => !o.ebarimtReturnId).length;

  const returnColumns = [
    { id: 'id', label: 'Буцаалтын ID', minWidth: 80, format: (row: Return) => `#${row.id}` },
    { id: 'order', label: 'Захиалгын ID', format: (row: Return) => `#${row.orderId}` },
    {
      id: 'product',
      label: 'Бараа',
      minWidth: 150,
      format: (row: Return) => row.product?.nameMongolian || 'N/A',
    },
    { id: 'quantity', label: 'Тоо ширхэг', align: 'center' as const },
    {
      id: 'unitPrice',
      label: 'Нэгж үнэ',
      align: 'right' as const,
      format: (row: Return) => (row.unitPrice ? `₮${row.unitPrice.toLocaleString()}` : '-'),
    },
    {
      id: 'customer',
      label: 'Харилцагч',
      minWidth: 130,
      format: (row: Return) => row.customer?.name || '-',
    },
    { id: 'reason', label: 'Шалтгаан', minWidth: 150 },
    {
      id: 'createdAt',
      label: 'Огноо',
      minWidth: 170,
      format: (row: Return) => new Date(row.createdAt).toLocaleString('mn-MN'),
    },
  ];

  const ebarimtColumns = [
    { id: 'id', label: 'Захиалга #', minWidth: 80, format: (row: Order) => `#${row.id}` },
    {
      id: 'customer',
      label: 'Харилцагч',
      minWidth: 130,
      format: (row: Order) => row.customer?.name || '-',
    },
    {
      id: 'totalAmount',
      label: 'Нийт дүн',
      align: 'right' as const,
      format: (row: Order) => `₮${Number(row.totalAmount).toLocaleString()}`,
    },
    {
      id: 'ebarimtBillId',
      label: 'eBarimt ID',
      minWidth: 180,
      format: (row: Order) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
          {row.ebarimtBillId?.slice(-12) || '-'}
        </Typography>
      ),
    },
    {
      id: 'ebarimtDate',
      label: 'eBarimt огноо',
      minWidth: 140,
      format: (row: Order) =>
        row.ebarimtId ||
        (row.ebarimtDate ? new Date(row.ebarimtDate).toLocaleString('mn-MN') : '-'),
    },
    {
      id: 'status',
      label: 'Төлөв',
      minWidth: 110,
      format: (row: Order) => (
        <Chip
          label={row.ebarimtReturnId ? 'Буцаагдсан' : 'Идэвхтэй'}
          color={row.ebarimtReturnId ? 'default' : 'success'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Үйлдэл',
      minWidth: 160,
      format: (row: Order) => {
        // ebarimtType байхгүй хуучин захиалгад customer.registrationNumber-оор fallback
        const isB2B =
          row.ebarimtType === 'B2B' || (!row.ebarimtType && !!row.customer?.registrationNumber);
        const isReturned = !!row.ebarimtReturnId;
        const isProcessing = returningId === row.id;
        return (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}
          >
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={isReturned || isProcessing || isB2B}
              onClick={(e) => {
                e.stopPropagation();
                handleEbarimtReturn(row);
              }}
            >
              {isProcessing ? 'Буцааж байна...' : isReturned ? 'Буцаагдсан' : 'Буцаалт хийх'}
            </Button>
            {isB2B && !isReturned && (
              <Typography variant="caption" color="text.secondary">
                B2B баримт буцаалт хийх боломжгүй
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Барааны буцаалт" />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              eBarimt буцаалт
              {pendingReturnCount > 0 && (
                <Chip label={pendingReturnCount} size="small" color="warning" />
              )}
            </Box>
          }
        />
      </Tabs>

      {tab === 0 && (
        <>
          {loading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              title="Барааны буцаалт"
              columns={returnColumns}
              data={returns}
              searchable
              searchPlaceholder="Буцаалт хайх..."
              actions={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setModalOpen(true)}
                >
                  Буцаалт үүсгэх
                </Button>
              }
            />
          )}

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Барааны буцаалт үүсгэх"
            maxWidth="sm"
          >
            <ReturnForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
          </Modal>
        </>
      )}

      {tab === 1 && (
        <>
          {ebarimtLoading ? (
            <TableSkeleton />
          ) : ebarimtOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                eBarimt бүртгэгдсэн захиалга байхгүй байна
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Захиалга "Гүйцэтгэсэн" болгосны дараа "eBarimt хэвлэх" дарахад энд харагдана
              </Typography>
            </Box>
          ) : (
            <DataTable
              title="eBarimt захиалгууд"
              columns={ebarimtColumns}
              data={ebarimtOrders}
              searchable
              searchPlaceholder="Захиалга хайх..."
            />
          )}
        </>
      )}
    </Box>
  );
}
