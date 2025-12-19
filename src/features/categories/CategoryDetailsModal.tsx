import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Category as CategoryIcon } from '@mui/icons-material';
import { Category } from '../../types';

interface CategoryDetailsModalProps {
  category: Category | null;
  onEdit: () => void;
  canManage: boolean;
}

export default function CategoryDetailsModal({
  category,
  onEdit,
  canManage,
}: CategoryDetailsModalProps) {
  if (!category) return null;

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
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Category ID
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {category.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Mongolian Name
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {category.nameMongolian}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  English Name
                </Typography>
                <Typography variant="body1">
                  {category.nameEnglish || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {category.description || '-'}
                </Typography>
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
              <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={onEdit}>
                Edit Category
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

