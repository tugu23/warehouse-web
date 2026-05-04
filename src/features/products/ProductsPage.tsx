import { useEffect, useState, useMemo } from 'react';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api';
import { CreateProductRequest, Product, UpdateProductRequest } from '../../types';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import PriceManagement from './PriceManagement';
import ProductDetailsModal from './ProductDetailsModal';
import ProductForm from './ProductForm';
import PromotionManagement from './PromotionManagement';

export default function ProductsPage() {
  const { canManage, canCreate } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        limit: 'all',
        include: 'category',
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

  const handleOpenPromotions = () => {
    setDetailsModalOpen(false);
    setPromotionModalOpen(true);
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

  const handleClosePromotionModal = () => {
    setPromotionModalOpen(false);
    setDetailsModalOpen(true);
  };

  const columns = [
    {
      id: 'nameMongolian',
      label: 'Нэр',
      minWidth: 150,
      format: (row: Product) => (
        <Typography variant="body2" fontWeight="medium">
          {row.nameMongolian}
        </Typography>
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
      label: 'Үлдэгдэл',
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
      id: 'isActive',
      label: 'Төлөв',
      minWidth: 120,
      align: 'center' as const,
      format: (row: Product) => (
        <Chip
          label={row.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
          variant={row.isActive ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      id: 'defaultPrice',
      label: 'Үндсэн үнэ',
      align: 'right' as const,
      format: (row: Product) => `₮${Number(row.defaultPrice ?? 0).toLocaleString()}`,
    },
  ];

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    if (activeFilter === 'active') return products.filter((p) => p.isActive);
    return products.filter((p) => !p.isActive);
  }, [products, activeFilter]);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Box>
      <DataTable
        title="Бараа материал"
        columns={columns}
        data={filteredProducts}
        searchable
        searchPlaceholder="Нэр, бар код, ангиллаар хайх..."
        onRowClick={handleRowClick}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={activeFilter}
              onChange={(_, value) => {
                if (value !== null) setActiveFilter(value);
              }}
            >
              <ToggleButton value="all">Бүгд</ToggleButton>
              <ToggleButton value="active">Идэвхтэй</ToggleButton>
              <ToggleButton value="inactive">Идэвхгүй</ToggleButton>
            </ToggleButtonGroup>
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
          onManagePromotions={handleOpenPromotions}
          canManage={canManage()}
        />
      </Modal>

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

      <Modal
        open={priceModalOpen}
        onClose={handleClosePriceModal}
        title={`Үнэ засах: ${selectedProduct?.nameMongolian}`}
        maxWidth="md"
      >
        {selectedProduct ? (
          <PriceManagement
            productId={selectedProduct.id}
            onUpdate={() => {
              fetchProducts();
            }}
          />
        ) : null}
      </Modal>

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

      <Modal
        open={promotionModalOpen}
        onClose={handleClosePromotionModal}
        title={`Урамшуулал: ${selectedProduct?.nameMongolian}`}
        maxWidth="md"
      >
        {selectedProduct ? (
          <PromotionManagement
            productId={selectedProduct.id}
            onUpdate={() => {
              fetchProducts();
            }}
          />
        ) : null}
      </Modal>
    </Box>
  );
}
