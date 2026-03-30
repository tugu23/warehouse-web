import { useState, useEffect } from 'react';
import { Box, Button, Chip, Badge, Typography, Tooltip, IconButton } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../types';
import ProductForm from './ProductForm';
import ProductDetailsModal from './ProductDetailsModal';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import PriceManagement from './PriceManagement';
import ExpiryBadge from '../../components/ExpiryBadge';
import PriceBadge from '../../components/PriceBadge';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function ProductsPage() {
  const { canManage, canCreate } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        limit: 'all',
        include: 'category,batches,prices',
      });
      setProducts(response.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Бараа татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      await productsApi.create(data as CreateProductRequest);
      toast.success('Бараа амжилттай нэмэгдлээ!');
      setEditModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Бараа нэмэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (data: CreateProductRequest | UpdateProductRequest) => {
    if (!selectedProduct) return;
    try {
      await productsApi.update(selectedProduct.id, data as UpdateProductRequest);
      toast.success('Бараа амжилттай шинэчлэгдлээ!');
      setEditModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Бараа шинэчлэхэд алдаа гарлаа');
    }
  };

  const handleOpenEdit = () => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleOpenInventory = () => {
    setDetailsModalOpen(false);
    setInventoryModalOpen(true);
  };

  const handleOpenPrices = () => {
    setDetailsModalOpen(false);
    setPriceModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    if (!detailsModalOpen) {
      setSelectedProduct(null);
    }
  };

  const handleCloseInventoryModal = () => {
    setInventoryModalOpen(false);
    setDetailsModalOpen(true);
  };

  const handleClosePriceModal = () => {
    setPriceModalOpen(false);
    setDetailsModalOpen(true);
  };

  const getDisplayBatch = (batches: Product['batches']) => {
    if (!batches || batches.length === 0) return undefined;
    const now = new Date();
    const nonExpired = batches.filter((b) => !b.expiryDate || new Date(b.expiryDate) >= now);
    return nonExpired.length > 0 ? nonExpired[0] : batches[0];
  };

  const columns = [
    {
      id: 'nameMongolian',
      label: 'Нэр',
      minWidth: 150,
      format: (row: Product) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.nameMongolian}
          </Typography>
          {row.batches && row.batches.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <ExpiryBadge batch={getDisplayBatch(row.batches)} />
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Ангилал',
      minWidth: 120,
      format: (row: Product) => row.category?.nameMongolian || '-',
    },
    {
      id: 'stockQuantity',
      label: 'Stock',
      align: 'center' as const,
      format: (row: Product) => (
        <Box>
          <Chip
            label={row.stockQuantity}
            color={
              row.stockQuantity < 10 ? 'error' : row.stockQuantity < 20 ? 'warning' : 'success'
            }
            size="small"
          />
          {row.batches && row.batches.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {row.batches.length} багц
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'expiryStatus',
      label: 'Хугацаа',
      align: 'center' as const,
      format: (row: Product) => {
        if (!row.batches || row.batches.length === 0) {
          return (
            <Typography variant="caption" color="text.secondary">
              Багц байхгүй
            </Typography>
          );
        }
        const displayBatch = getDisplayBatch(row.batches);
        if (row.batches.length === 1) {
          return <ExpiryBadge batch={displayBatch} showDate={false} />;
        }
        return (
          <Badge badgeContent={row.batches.length} color="primary">
            <ExpiryBadge batch={displayBatch} showDate={false} />
          </Badge>
        );
      },
    },
    {
      id: 'prices',
      label: 'Үнэ',
      align: 'center' as const,
      format: (row: Product) => <PriceBadge prices={row.prices} />,
    },
    {
      id: 'priceWholesale',
      label: 'Бөөний үнэ',
      align: 'right' as const,
      format: (row: Product) => `₮${Number(row.priceWholesale).toLocaleString()}`,
    },
    {
      id: 'priceRetail',
      label: 'Жижиглэн үнэ',
      align: 'right' as const,
      format: (row: Product) => `₮${Number(row.priceRetail).toLocaleString()}`,
    },
  ];

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Бараа материал"
        columns={columns}
        data={products}
        searchable
        searchPlaceholder="Нэр, бар код, ангиллаар хайх..."
        onRowClick={handleRowClick}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Шинэчлэх">
              <IconButton onClick={fetchProducts} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {canCreate() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedProduct(null);
                  setEditModalOpen(true);
                }}
              >
                Бараа нэмэх
              </Button>
            )}
          </Box>
        }
      />

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Бараа дэлгэрэнгүй: ${selectedProduct?.nameMongolian}`}
        maxWidth="md"
      >
        <ProductDetailsModal
          product={selectedProduct}
          onEdit={handleOpenEdit}
          onManageInventory={handleOpenInventory}
          onManagePrices={handleOpenPrices}
          canManage={canManage()}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={selectedProduct ? 'Бараа засах' : 'Шинэ бараа нэмэх'}
        maxWidth="md"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={selectedProduct ? handleUpdate : handleCreate}
          onCancel={handleCloseEditModal}
        />
      </Modal>

      {/* Inventory Modal */}
      <Modal
        open={inventoryModalOpen}
        onClose={handleCloseInventoryModal}
        title={`Үлдэгдэл засах: ${selectedProduct?.nameMongolian}`}
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

      {/* Price Modal */}
      <Modal
        open={priceModalOpen}
        onClose={handleClosePriceModal}
        title={`Үнэ удирдах: ${selectedProduct?.nameMongolian}`}
        maxWidth="md"
      >
        {selectedProduct && (
          <PriceManagement
            productId={selectedProduct.id}
            onUpdate={() => {
              fetchProducts();
            }}
          />
        )}
      </Modal>
    </Box>
  );
}
