import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Chip, Card, CardContent, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { visitPlansApi } from '../../api';
import { VisitPlan, CreateVisitPlanRequest, UpdateVisitPlanRequest } from '../../types';
import VisitPlanForm from './VisitPlanForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function VisitPlansPage() {
  const [visitPlans, setVisitPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VisitPlan | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchVisitPlans();
  }, []);

  const fetchVisitPlans = async () => {
    setLoading(true);
    try {
      const response = await visitPlansApi.getAll();
      setVisitPlans(response.data.data?.visitPlans || []);
    } catch (error) {
      console.error('Error fetching visit plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateVisitPlanRequest) => {
    try {
      await visitPlansApi.create(data);
      toast.success('Айлчлалын төлөвлөгөө амжилттай үүсгэгдлээ');
      setModalOpen(false);
      fetchVisitPlans();
    } catch (error) {
      console.error('Error creating visit plan:', error);
      toast.error('Төлөвлөгөө үүсгэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (data: UpdateVisitPlanRequest) => {
    if (!selectedPlan) return;
    try {
      await visitPlansApi.update(selectedPlan.id, data);
      toast.success('Айлчлалын төлөвлөгөө амжилттай засагдлаа');
      setModalOpen(false);
      setSelectedPlan(null);
      fetchVisitPlans();
    } catch (error) {
      console.error('Error updating visit plan:', error);
      toast.error('Төлөвлөгөө засахад алдаа гарлаа');
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    try {
      await visitPlansApi.delete(selectedPlan.id);
      toast.success('Айлчлалын төлөвлөгөө амжилттай устгагдлаа');
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      fetchVisitPlans();
    } catch (error) {
      console.error('Error deleting visit plan:', error);
      toast.error('Төлөвлөгөө устгахад алдаа гарлаа');
    }
  };

  const handleMarkCompleted = async (plan: VisitPlan) => {
    try {
      await visitPlansApi.update(plan.id, {
        status: 'Completed',
        actualVisitTime: new Date().toISOString(),
      });
      toast.success('Айлчлал гүйцэтгэсэн гэж тэмдэглэгдлээ');
      fetchVisitPlans();
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const handleOpenEdit = (plan: VisitPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleOpenDelete = (plan: VisitPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
      Planned: 'default',
      Completed: 'success',
      Cancelled: 'error',
      Rescheduled: 'warning',
    };
    return colors[status] || 'default';
  };

  const filteredPlans = visitPlans.filter((plan) => {
    if (filter === 'all') return true;
    return plan.status === filter;
  });

  const todayPlans = visitPlans.filter(
    (p) => format(new Date(p.plannedDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const columns = [
    {
      id: 'agent',
      label: 'Агент',
      minWidth: 150,
      format: (row: VisitPlan) => row.agent?.name || 'N/A',
    },
    {
      id: 'customer',
      label: 'Харилцагч',
      minWidth: 180,
      format: (row: VisitPlan) => row.customer?.name || 'N/A',
    },
    {
      id: 'plannedDate',
      label: 'Огноо',
      minWidth: 120,
      format: (row: VisitPlan) => format(new Date(row.plannedDate), 'yyyy-MM-dd'),
    },
    {
      id: 'plannedTime',
      label: 'Цаг',
      minWidth: 100,
    },
    {
      id: 'status',
      label: 'Төлөв',
      align: 'center' as const,
      format: (row: VisitPlan) => (
        <Chip label={row.status} color={getStatusColor(row.status)} size="small" />
      ),
    },
    {
      id: 'actions',
      label: 'Үйлдэл',
      align: 'center' as const,
      format: (row: VisitPlan) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {row.status === 'Planned' && (
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkCompleted(row);
              }}
              title="Гүйцэтгэсэн"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          )}
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

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Айлчлалын Төлөвлөгөө
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{todayPlans.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Өнөөдрийн айлчлал
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {visitPlans.filter((p) => p.status === 'Planned').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Төлөвлөсөн
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {visitPlans.filter((p) => p.status === 'Completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Гүйцэтгэсэн
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {visitPlans.filter((p) => p.status === 'Cancelled').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Цуцлагдсан
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
        title="Бүх айлчлал"
        columns={columns}
        data={filteredPlans}
        searchable
        searchPlaceholder="Айлчлал хайх..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Шинэ айлчлал
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedPlan ? 'Айлчлал засах' : 'Шинэ айлчлал төлөвлөх'}
        maxWidth="md"
      >
        <VisitPlanForm
          visitPlan={selectedPlan}
          onSubmit={selectedPlan ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Айлчлал устгах"
        message="Та энэ айлчлалыг устгахдаа итгэлтэй байна уу?"
      />
    </Box>
  );
}

