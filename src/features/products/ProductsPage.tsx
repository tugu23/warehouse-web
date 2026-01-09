import { useState, useEffect } from 'react';
import { Box, Button, Chip, Badge, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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
        include: 'supplier,category,batches,prices',
      });
      const products = response.data.data?.products || [];
      console.log('📦 Fetched products:', products.length);
      const firstProduct = products[0];
      if (firstProduct) {
        console.log('📦 First product:', {
          id: firstProduct.id,
          name: firstProduct.nameMongolian,
          priceWholesale: firstProduct.priceWholesale,
          priceRetail: firstProduct.priceRetail,
          priceWholesaleType: typeof firstProduct.priceWholesale,
          priceRetailType: typeof firstProduct.priceRetail,
        });
      }
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      await productsApi.create(data as CreateProductRequest);
      toast.success('Product created successfully!');
      setEditModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdate = async (data: CreateProductRequest | UpdateProductRequest) => {
    if (!selectedProduct) return;
    try {
      await productsApi.update(selectedProduct.id, data as UpdateProductRequest);
      toast.success('Product updated successfully!');
      setEditModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
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

  const columns = [
    {
      id: 'nameEnglish',
      label: 'Name (EN)',
      minWidth: 150,
      format: (row: Product) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.nameEnglish}
          </Typography>
          {row.batches && row.batches.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <ExpiryBadge batch={row.batches[0]} />
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'nameMongolian',
      label: 'Name (MN)',
      minWidth: 150,
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 120,
      format: (row: Product) => row.category?.nameMongolian || row.category?.nameEnglish || '-',
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
        if (row.batches.length === 1) {
          return <ExpiryBadge batch={row.batches[0]} showDate={false} />;
        }
        return (
          <Badge badgeContent={row.batches.length} color="primary">
            <ExpiryBadge batch={row.batches[0]} showDate={false} />
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
        title="Products"
        columns={columns}
        data={products}
        searchable
        searchPlaceholder="Search products..."
        onRowClick={handleRowClick}
        actions={
          canCreate() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedProduct(null);
                setEditModalOpen(true);
              }}
            >
              Add Product
            </Button>
          )
        }
      />

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Product Details: ${selectedProduct?.nameEnglish}`}
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
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
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

      {/* Price Modal */}
      <Modal
        open={priceModalOpen}
        onClose={handleClosePriceModal}
        title={`Үнэ удирдах: ${selectedProduct?.nameEnglish}`}
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
