import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Chip, Alert } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { differenceInDays, format } from 'date-fns';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api';
import { ProductBatch, CreateProductBatchRequest, UpdateProductBatchRequest } from '../../types';
import ProductBatchForm from './ProductBatchForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import { exportProductBatchesToExcel } from '../../utils/excelExport';

export default function ProductBatchesPage() {
  const { canManage } = useAuth();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // For now, fetch all batches. In real app, we'd filter by product
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      // Note: This would need backend support to fetch all batches
      // For now, we'll simulate with empty array
      // const response = await productsApi.getAllBatches();
      // setBatches(response.data.data?.batches || []);
      setBatches([]);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductBatchRequest | UpdateProductBatchRequest) => {
    try {
      await productsApi.createBatch(data as CreateProductBatchRequest);
      toast.success('Багц амжилттай үүсгэгдлээ');
      setModalOpen(false);
      fetchBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
    }
  };

  const handleUpdate = async (data: CreateProductBatchRequest | UpdateProductBatchRequest) => {
    if (!selectedBatch) return;
    try {
      await productsApi.updateBatch(selectedBatch.id, data as UpdateProductBatchRequest);
      toast.success('Багц амжилттай засагдлаа');
      setModalOpen(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    try {
      await productsApi.deleteBatch(selectedBatch.id);
      toast.success('Багц амжилттай устгагдлаа');
      setDeleteDialogOpen(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleOpenEdit = (batch: ProductBatch) => {
    setSelectedBatch(batch);
    setModalOpen(true);
  };

  const handleOpenDelete = (batch: ProductBatch) => {
    setSelectedBatch(batch);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedBatch(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProductBatchesToExcel(batches);
      toast.success('Excel файл амжилттай татагдлаа');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа');
    } finally {
      setExporting(false);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());

    if (daysUntilExpiry < 0) {
      return { label: 'Дууссан', color: 'error' as const };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Дуусах гэж байна', color: 'warning' as const };
    } else {
      return { label: 'Зөв', color: 'success' as const };
    }
  };

  const columns = [
    {
      id: 'batchNumber',
      label: 'Багцын дугаар',
      minWidth: 120,
    },
    {
      id: 'product',
      label: 'Бараа',
      minWidth: 180,
      format: (row: ProductBatch) => row.product?.nameMongolian || 'N/A',
    },
    {
      id: 'quantity',
      label: 'Тоо ширхэг',
      align: 'center' as const,
      minWidth: 100,
    },
    {
      id: 'receivedDate',
      label: 'Ирсэн огноо',
      minWidth: 120,
      format: (row: ProductBatch) => format(new Date(row.receivedDate), 'yyyy-MM-dd'),
    },
    {
      id: 'expiryDate',
      label: 'Дуусах хугацаа',
      minWidth: 130,
      format: (row: ProductBatch) => {
        const status = getExpiryStatus(row.expiryDate);
        return (
          <Box>
            <Typography variant="body2">
              {format(new Date(row.expiryDate), 'yyyy-MM-dd')}
            </Typography>
            <Chip label={status.label} color={status.color} size="small" />
          </Box>
        );
      },
    },
    ...(canManage()
      ? [
          {
            id: 'actions',
            label: 'Үйлдэл',
            align: 'center' as const,
            format: (row: ProductBatch) => (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDelete(row);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ),
          },
        ]
      : []),
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Энэ хуудас нь барааны багцуудыг дуусах хугацаагаар нь удирдах боломжийг олгоно. FIFO (First
        In First Out) зарчмаар захиалгад багц хуваарилагдана.
      </Alert>

      <DataTable
        title="Барааны Багцууд"
        columns={columns}
        data={batches}
        searchable
        searchPlaceholder="Багц хайх..."
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting || batches.length === 0}
            >
              {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
            </Button>
            {canManage() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalOpen(true)}
              >
                Багц нэмэх
              </Button>
            )}
          </Box>
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedBatch ? 'Багц засах' : 'Шинэ багц нэмэх'}
        maxWidth="md"
      >
        <ProductBatchForm
          batch={selectedBatch}
          onSubmit={selectedBatch ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Багц устгах"
        message={`Та "${selectedBatch?.batchNumber}" багцыг устгахдаа итгэлтэй байна уу?`}
      />
    </Box>
  );
}
