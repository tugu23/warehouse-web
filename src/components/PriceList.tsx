import { Box, Card, CardContent, Typography, Stack, Chip, Divider, Grid } from '@mui/material';
import { ProductPrice } from '../types';

interface PriceListProps {
  prices?: ProductPrice[];
  compact?: boolean;
}

export default function PriceList({ prices, compact = false }: PriceListProps) {
  if (!prices || prices.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        Үнийн мэдээлэл байхгүй
      </Typography>
    );
  }

  if (compact) {
    // Compact view - show only main prices
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {prices.slice(0, 3).map((price) => (
          <Chip
            key={price.id}
            label={`${price.customerType.typeName}: ₮${price.price.toLocaleString()}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
        {prices.length > 3 && (
          <Chip label={`+${prices.length - 3} үнэ`} size="small" variant="outlined" />
        )}
      </Stack>
    );
  }

  // Full view - show all prices in a grid
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          💰 Үнийн хүснэгт
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {prices.map((price) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={price.id}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="caption" color="textSecondary" display="block">
                  {price.customerType.typeName}
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  ₮{price.price.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
