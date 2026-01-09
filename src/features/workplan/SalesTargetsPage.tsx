import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { salesTargetsApi } from '../../api';
import { SalesTarget, CreateSalesTargetRequest, UpdateSalesTargetRequest } from '../../types';
import SalesTargetForm from './SalesTargetForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function SalesTargetsPage() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<SalesTarget | null>(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const response = await salesTargetsApi.getAll();
      setTargets(response.data.data?.salesTargets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateSalesTargetRequest) => {
    try {
      await salesTargetsApi.create(data);
      toast.success('Зорилт амжилттай үүсгэгдлээ');
      setModalOpen(false);
      fetchTargets();
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Зорилт үүсгэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (data: UpdateSalesTargetRequest) => {
    if (!selectedTarget) return;
    try {
      await salesTargetsApi.update(selectedTarget.id, data);
      toast.success('Зорилт амжилттай засагдлаа');
      setModalOpen(false);
      setSelectedTarget(null);
      fetchTargets();
    } catch (error) {
      console.error('Error updating target:', error);
      toast.error('Зорилт засахад алдаа гарлаа');
    }
  };

  const handleDelete = async () => {
    if (!selectedTarget) return;
    try {
      await salesTargetsApi.delete(selectedTarget.id);
      toast.success('Зорилт амжилттай устгагдлаа');
      setDeleteDialogOpen(false);
      setSelectedTarget(null);
      fetchTargets();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Зорилт устгахад алдаа гарлаа');
    }
  };

  const handleOpenEdit = (target: SalesTarget) => {
    setSelectedTarget(target);
    setModalOpen(true);
  };

  const handleOpenDelete = (target: SalesTarget) => {
    setSelectedTarget(target);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTarget(null);
  };

  const calculateProgress = (achieved: number, target: number) => {
    return target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  };

  const columns = [
    {
      id: 'agent',
      label: 'Агент',
      minWidth: 150,
      format: (row: SalesTarget) => row.agent?.name || 'N/A',
    },
    {
      id: 'targetPeriod',
      label: 'Хугацаа',
      minWidth: 120,
    },
    {
      id: 'targetAmount',
      label: 'Зорилтот дүн',
      align: 'right' as const,
      minWidth: 130,
      format: (row: SalesTarget) => `₮${Number(row.targetAmount).toLocaleString()}`,
    },
    {
      id: 'achievedAmount',
      label: 'Хүрсэн дүн',
      align: 'right' as const,
      minWidth: 130,
      format: (row: SalesTarget) => `₮${Number(row.achievedAmount).toLocaleString()}`,
    },
    {
      id: 'progress',
      label: 'Явц',
      minWidth: 150,
      format: (row: SalesTarget) => {
        const progress = calculateProgress(row.achievedAmount, row.targetAmount);
        return (
          <Box>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress.toFixed(1)}%</Typography>
          </Box>
        );
      },
    },
    {
      id: 'targetOrders',
      label: 'Захиалгын зорилт',
      align: 'center' as const,
      minWidth: 120,
    },
    {
      id: 'achievedOrders',
      label: 'Хүрсэн захиалга',
      align: 'center' as const,
      minWidth: 120,
    },
    {
      id: 'actions',
      label: 'Үйлдэл',
      align: 'center' as const,
      format: (row: SalesTarget) => (
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
  ];

  const activeTargets = targets.filter((t) => t.status === 'Active');
  const totalTarget = activeTargets.reduce((sum, t) => sum + t.targetAmount, 0);
  const totalAchieved = activeTargets.reduce((sum, t) => sum + t.achievedAmount, 0);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Борлуулалтын Зорилтууд
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">{activeTargets.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Идэвхтэй зорилт
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">₮{totalTarget.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">
                Нийт зорилт
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">₮{totalAchieved.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">
                Нийт хүрсэн
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Нийт явц
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
        title="Бүх зорилт"
        columns={columns}
        data={targets}
        searchable
        searchPlaceholder="Зорилт хайх..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Зорилт нэмэх
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedTarget ? 'Зорилт засах' : 'Шинэ зорилт'}
        maxWidth="md"
      >
        <SalesTargetForm
          target={selectedTarget}
          onSubmit={selectedTarget ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Зорилт устгах"
        message="Та энэ зорилтыг устгахдаа итгэлтэй байна уу?"
      />
    </Box>
  );
}
