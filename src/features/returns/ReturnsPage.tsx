import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { returnsApi } from '../../api';
import { Return, CreateReturnRequest } from '../../types';
import ReturnForm from './ReturnForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchReturns();
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

  const handleCreate = async (data: CreateReturnRequest) => {
    try {
      await returnsApi.create(data);
      toast.success('Return created successfully!');
      setModalOpen(false);
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
    }
  };

  const columns = [
    {
      id: 'id',
      label: 'Буцаалтын ID',
      minWidth: 80,
      format: (row: Return) => `#${row.id}`,
    },
    {
      id: 'order',
      label: 'Захиалгын ID',
      format: (row: Return) => `#${row.orderId}`,
    },
    {
      id: 'product',
      label: 'Бараа',
      minWidth: 150,
      format: (row: Return) => row.product?.nameEnglish || 'N/A',
    },
    {
      id: 'quantity',
      label: 'Тоо ширхэг',
      align: 'center' as const,
    },
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
    {
      id: 'reason',
      label: 'Шалтгаан',
      minWidth: 150,
    },
    {
      id: 'createdBy',
      label: 'Үүсгэсэн',
      minWidth: 130,
      format: (row: Return) => row.createdBy?.name || 'N/A',
    },
    {
      id: 'createdAt',
      label: 'Огноо',
      minWidth: 170,
      format: (row: Return) => new Date(row.createdAt).toLocaleString('mn-MN'),
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Барааны буцаалт"
        columns={columns}
        data={returns}
        searchable
        searchPlaceholder="Буцаалт хайх..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Буцаалт үүсгэх
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Барааны буцаалт үүсгэх"
        maxWidth="sm"
      >
        <ReturnForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </Box>
  );
}
