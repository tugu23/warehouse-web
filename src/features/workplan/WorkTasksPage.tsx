import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { workTasksApi } from '../../api';
import { WorkTask, CreateWorkTaskRequest, UpdateWorkTaskRequest } from '../../types';
import WorkTaskForm from './WorkTaskForm';

export default function WorkTasksPage() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await workTasksApi.getAll();
      setTasks(response.data.data?.workTasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateWorkTaskRequest) => {
    try {
      await workTasksApi.create(data);
      toast.success('Даалгавар амжилттай үүсгэгдлээ');
      setModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Даалгавар үүсгэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (data: UpdateWorkTaskRequest) => {
    if (!selectedTask) return;
    try {
      await workTasksApi.update(selectedTask.id, data);
      toast.success('Даалгавар амжилттай засагдлаа');
      setModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Даалгавар засахад алдаа гарлаа');
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      await workTasksApi.delete(selectedTask.id);
      toast.success('Даалгавар амжилттай устгагдлаа');
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Даалгавар устгахад алдаа гарлаа');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
      Low: 'default',
      Medium: 'info',
      High: 'warning',
      Urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const tasksByStatus = {
    Todo: tasks.filter((t) => t.status === 'Todo'),
    InProgress: tasks.filter((t) => t.status === 'InProgress'),
    Completed: tasks.filter((t) => t.status === 'Completed'),
  };

  const TaskCard = ({ task }: { task: WorkTask }) => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedTask(task);
              setModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedTask(task);
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {task.description}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
        <Chip label={task.assignedTo?.name || 'N/A'} size="small" variant="outlined" />
        <Chip label={format(new Date(task.dueDate), 'yyyy-MM-dd')} size="small" />
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ажлын Даалгаврууд</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
          Даалгавар нэмэх
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Хийх ({tasksByStatus.Todo.length})
            </Typography>
            {tasksByStatus.Todo.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: 'info.light', minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Хийж байгаа ({tasksByStatus.InProgress.length})
            </Typography>
            {tasksByStatus.InProgress.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: 'success.light', minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Дууссан ({tasksByStatus.Completed.length})
            </Typography>
            {tasksByStatus.Completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
        }}
        title={selectedTask ? 'Даалгавар засах' : 'Шинэ даалгавар'}
        maxWidth="md"
      >
        <WorkTaskForm
          task={selectedTask}
          onSubmit={selectedTask ? handleUpdate : handleCreate}
          onCancel={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Даалгавар устгах"
        message="Та энэ даалгаврыг устгахдаа итгэлтэй байна у|?"
      />
    </Box>
  );
}
