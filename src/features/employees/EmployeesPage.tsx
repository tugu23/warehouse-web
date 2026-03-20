import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Chip, Tooltip } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { employeesApi } from '../../api';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../types';
import EmployeeForm from './EmployeeForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeesApi.getAll({ limit: 0 });
      setEmployees(response.data.data?.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Ажилтан татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateEmployeeRequest | UpdateEmployeeRequest) => {
    try {
      await employeesApi.create(data as CreateEmployeeRequest);
      toast.success('Ажилтан амжилттай нэмэгдлээ!');
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Ажилтан нэмэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (data: CreateEmployeeRequest | UpdateEmployeeRequest) => {
    if (!selectedEmployee) return;
    try {
      await employeesApi.update(selectedEmployee.id, data as UpdateEmployeeRequest);
      toast.success('Ажилтан амжилттай шинэчлэгдлээ!');
      setModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Ажилтан шинэчлэхэд алдаа гарлаа');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeesApi.delete(selectedEmployee.id);
      toast.success('Ажилтан идэвхгүй болгогдлоо!');
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Ажилтан устгахад алдаа гарлаа');
    }
  };

  const handleOpenEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleOpenDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const roleLabels: Record<string, string> = {
    Admin: 'Админ',
    Manager: 'Менежер',
    SalesAgent: 'Борлуулагч',
  };

  const columns = [
    {
      id: 'name',
      label: 'Нэр',
      minWidth: 150,
    },
    {
      id: 'email',
      label: 'И-мэйл',
      minWidth: 180,
    },
    {
      id: 'phoneNumber',
      label: 'Утас',
      minWidth: 130,
    },
    {
      id: 'role',
      label: 'Эрх',
      align: 'center' as const,
      format: (row: Employee) => {
        const colors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
          Admin: 'error',
          Manager: 'warning',
          SalesAgent: 'info',
        };
        return (
          <Chip
            label={roleLabels[row.role.name] || row.role.name}
            color={colors[row.role.name] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      id: 'isActive',
      label: 'Төлөв',
      align: 'center' as const,
      format: (row: Employee) => (
        <Chip
          label={row.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Бүртгүүлсэн',
      minWidth: 130,
      format: (row: Employee) =>
        new Date(row.createdAt).toLocaleDateString('mn-MN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
    },
    {
      id: 'actions',
      label: 'Үйлдэл',
      align: 'center' as const,
      format: (row: Employee) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title="Засах">
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
          </Tooltip>
          <Tooltip title={row.isActive ? 'Идэвхгүй болгох' : 'Идэвхтэй болгох'}>
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
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Ажилтнууд"
        columns={columns}
        data={employees}
        searchable
        searchPlaceholder="Нэр, и-мэйл, утасаар хайх..."
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Шинэчлэх">
              <IconButton onClick={fetchEmployees} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
              Ажилтан нэмэх
            </Button>
          </Box>
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedEmployee ? 'Ажилтан засах' : 'Шинэ ажилтан нэмэх'}
        maxWidth="md"
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSubmit={selectedEmployee ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleDelete}
        title="Ажилтан идэвхгүй болгох"
        message={`${selectedEmployee?.name}-ийг идэвхгүй болгох уу? Тухайн ажилтан системд нэвтрэх боломжгүй болно.`}
        danger
      />
    </Box>
  );
}
