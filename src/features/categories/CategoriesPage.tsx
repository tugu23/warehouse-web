import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types';
import { categoriesApi } from '../../api';
import toast from 'react-hot-toast';
import CategoryDetailsModal from './CategoryDetailsModal';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';

export default function CategoriesPage() {
  const { canManage, canCreate } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryRequest>();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAll({ limit: 'all' });
      setCategories(response.data.data?.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    reset({ nameMongolian: '', nameEnglish: '', description: '' });
    setFormOpen(true);
  };

  const handleEdit = () => {
    setDetailsModalOpen(false);
    setFormOpen(true);
  };

  const handleRowClick = (category: Category) => {
    setSelectedCategory(category);
    reset({
      nameMongolian: category.nameMongolian,
      nameEnglish: category.nameEnglish || '',
      description: category.description || '',
    });
    setDetailsModalOpen(true);
  };

  const onSubmit = async (data: CreateCategoryRequest) => {
    try {
      if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, data as UpdateCategoryRequest);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create(data);
        toast.success('Category created successfully');
      }
      setFormOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to save category');
      console.error(error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        {canCreate() && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Category
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Mongolian Name</TableCell>
              <TableCell>English Name</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow
                  key={category.id}
                  onClick={() => handleRowClick(category)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.nameMongolian}</TableCell>
                  <TableCell>{category.nameEnglish || '-'}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCategory(null);
        }}
        title={`Category Details: ${selectedCategory?.nameMongolian}`}
        maxWidth="sm"
      >
        <CategoryDetailsModal
          category={selectedCategory}
          onEdit={handleEdit}
          canManage={canManage()}
        />
      </Modal>

      {/* Category Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Mongolian Name"
                {...register('nameMongolian', { required: 'This field is required' })}
                error={!!errors.nameMongolian}
                helperText={errors.nameMongolian?.message}
                fullWidth
                required
              />
              <TextField
                label="English Name"
                {...register('nameEnglish')}
                error={!!errors.nameEnglish}
                helperText={errors.nameEnglish?.message}
                fullWidth
              />
              <TextField
                label="Description"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
