import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Alert } from '@mui/material';
import { productPricesApi } from '../api';
import { ProductPrice } from '../types';

interface ProductPricesProps {
  productId: number;
}

export default function ProductPrices({ productId }: ProductPricesProps) {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productPricesApi.getByProductId(productId);
        setPrices(response.data.data?.productPrices || response.data.data?.prices || []);
      } catch (err) {
        console.warn('⚠️ Could not fetch product prices:', err);
        setError('Үнийн мэдээлэл татахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchPrices();
    }
  }, [productId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Үнийн мэдээлэл уншиж байна...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (prices.length === 0) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Харилцагчийн төрөл бүрт зориулсан үнэ тохируулаагүй байна.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Үнийн мэдээлэл:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {prices.map((price) => (
          <Chip
            key={price.id}
            label={`${price.customerType.typeName}: ₮${price.price.toLocaleString()}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
}
