import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Category } from '../../types';
import { categoriesApi } from '../../api';
import toast from 'react-hot-toast';

interface CategoryDetailsModalProps {
  category: Category | null;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}

export default function CategoryDetailsModal({
  category,
  onEdit,
  onDelete,
  canManage,
}: CategoryDetailsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!category) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await categoriesApi.delete(category.id);
      toast.success('Ангилал амжилттай устгагдлаа!');
      setDeleteDialogOpen(false);
      onDelete();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Устгах явцад алдаа гарлаа');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Category Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Category ID
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {category.id}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Mongolian Name
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {category.nameMongolian}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  БҮНА код (И-Баримт)
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={category.classificationCode ? 'bold' : 'normal'}
                >
                  {category.classificationCode || '—'}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Тайлбар
                </Typography>
                <Typography variant="body1">{category.description || '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        {canManage && (
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                >
                  Edit Category
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Category
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Ангилал устгах</DialogTitle>
        <DialogContent>
          <Typography>
            Та <strong>{category.nameMongolian}</strong> ангиллыг устгахдаа итгэлтэй байна уу?
          </Typography>
          {category._count && category._count.products > 0 && (
            <Typography color="error" sx={{ mt: 1 }}>
              Ангилалд {category._count.products} бараа байгаа тул устгах боломжгүй.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Цуцлах
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting || (category._count && category._count.products > 0)}
          >
            {deleting ? 'Устгаж байна...' : 'Устгах'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
