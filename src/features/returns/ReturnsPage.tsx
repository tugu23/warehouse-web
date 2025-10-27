import { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
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
      label: 'Return ID',
      minWidth: 80,
      format: (row: Return) => `#${row.id}`,
    },
    {
      id: 'order',
      label: 'Order ID',
      format: (row: Return) => `#${row.orderId}`,
    },
    {
      id: 'product',
      label: 'Product',
      minWidth: 150,
      format: (row: Return) => row.product?.nameEnglish || 'N/A',
    },
    {
      id: 'quantity',
      label: 'Quantity',
      align: 'center' as const,
    },
    {
      id: 'reason',
      label: 'Reason',
      minWidth: 200,
    },
    {
      id: 'createdBy',
      label: 'Created By',
      minWidth: 130,
      format: (row: Return) => row.createdBy?.name || 'N/A',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 170,
      format: (row: Return) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Product Returns"
        columns={columns}
        data={returns}
        searchable
        searchPlaceholder="Search returns..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Create Return
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Product Return"
        maxWidth="sm"
      >
        <ReturnForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </Box>
  );
}
