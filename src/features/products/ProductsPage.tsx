import { useState, useEffect } from 'react';
import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../types';
import ProductForm from './ProductForm';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function ProductsPage() {
  const { canManage } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll();
      setProducts(response.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductRequest) => {
    try {
      await productsApi.create(data);
      toast.success('Product created successfully!');
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdate = async (data: UpdateProductRequest) => {
    if (!selectedProduct) return;
    try {
      await productsApi.update(selectedProduct.id, data);
      toast.success('Product updated successfully!');
      setModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleOpenInventory = (product: Product) => {
    setSelectedProduct(product);
    setInventoryModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseInventoryModal = () => {
    setInventoryModalOpen(false);
    setSelectedProduct(null);
  };

  const columns = [
    {
      id: 'productCode',
      label: 'Code',
      minWidth: 100,
    },
    {
      id: 'nameEnglish',
      label: 'Name (EN)',
      minWidth: 150,
    },
    {
      id: 'nameMongolian',
      label: 'Name (MN)',
      minWidth: 150,
    },
    {
      id: 'stockQuantity',
      label: 'Stock',
      align: 'center' as const,
      format: (row: Product) => (
        <Chip
          label={row.stockQuantity}
          color={row.stockQuantity < 10 ? 'error' : row.stockQuantity < 20 ? 'warning' : 'success'}
          size="small"
        />
      ),
    },
    {
      id: 'priceWholesale',
      label: 'Wholesale',
      align: 'right' as const,
      format: (row: Product) => `₮${Number(row.priceWholesale).toLocaleString()}`,
    },
    {
      id: 'priceRetail',
      label: 'Retail',
      align: 'right' as const,
      format: (row: Product) => `₮${Number(row.priceRetail).toLocaleString()}`,
    },
    ...(canManage()
      ? [
          {
            id: 'actions',
            label: 'Actions',
            align: 'center' as const,
            format: (row: Product) => (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInventory(row);
                  }}
                  title="Adjust Inventory"
                >
                  <InventoryIcon fontSize="small" />
                </IconButton>
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
      <DataTable
        title="Products"
        columns={columns}
        data={products}
        searchable
        searchPlaceholder="Search products..."
        actions={
          canManage() && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
              Add Product
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        maxWidth="md"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={selectedProduct ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        open={inventoryModalOpen}
        onClose={handleCloseInventoryModal}
        title={`Adjust Inventory: ${selectedProduct?.nameEnglish}`}
        maxWidth="sm"
      >
        <InventoryAdjustmentForm
          product={selectedProduct}
          onSuccess={() => {
            handleCloseInventoryModal();
            fetchProducts();
          }}
          onCancel={handleCloseInventoryModal}
        />
      </Modal>
    </Box>
  );
}
