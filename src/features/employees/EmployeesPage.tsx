import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
      const response = await employeesApi.getAll();
      setEmployees(response.data.data?.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateEmployeeRequest) => {
    try {
      await employeesApi.create(data);
      toast.success('Employee created successfully!');
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleUpdate = async (data: UpdateEmployeeRequest) => {
    if (!selectedEmployee) return;
    try {
      await employeesApi.update(selectedEmployee.id, data);
      toast.success('Employee updated successfully!');
      setModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeesApi.delete(selectedEmployee.id);
      toast.success('Employee deactivated successfully!');
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
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

  const columns = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 180,
    },
    {
      id: 'phoneNumber',
      label: 'Phone',
      minWidth: 130,
    },
    {
      id: 'role',
      label: 'Role',
      align: 'center' as const,
      format: (row: Employee) => {
        const colors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
          Admin: 'error',
          Manager: 'warning',
          SalesAgent: 'info',
        };
        return <Chip label={row.role.name} color={colors[row.role.name]} size="small" />;
      },
    },
    {
      id: 'isActive',
      label: 'Status',
      align: 'center' as const,
      format: (row: Employee) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 170,
      format: (row: Employee) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      format: (row: Employee) => (
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

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Employees"
        columns={columns}
        data={employees}
        searchable
        searchPlaceholder="Search employees..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Add Employee
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
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
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${selectedEmployee?.name}? This will set their status to inactive.`}
        danger
      />
    </Box>
  );
}
