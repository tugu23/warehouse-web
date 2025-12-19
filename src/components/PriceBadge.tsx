import { Box, Typography, Tooltip } from '@mui/material';
import { ProductPrice } from '../types';

interface PriceBadgeProps {
  prices?: ProductPrice[];
  customerTypeId?: number;
  showAll?: boolean;
}

export default function PriceBadge({ 
  prices, 
  customerTypeId,
  showAll = false 
}: PriceBadgeProps) {
  if (!prices || prices.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        -
      </Typography>
    );
  }

  // If specific customer type is requested
  if (customerTypeId && !showAll) {
    const specificPrice = prices.find(p => p.customerTypeId === customerTypeId);
    if (specificPrice) {
      return (
        <Typography variant="body1" fontWeight="medium">
          ₮{specificPrice.price.toLocaleString()}
        </Typography>
      );
    }
  }

  // Show first price with tooltip showing all
  const mainPrice = prices[0];
  const tooltipContent = (
    <Box>
      {prices.map(price => (
        <Box key={price.id} mb={0.5}>
          <Typography variant="caption" display="block">
            {price.customerType.typeName}: ₮{price.price.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Box display="inline-flex" alignItems="baseline" gap={0.5}>
        <Typography variant="body1" fontWeight="medium">
          ₮{mainPrice.price.toLocaleString()}
        </Typography>
        {prices.length > 1 && (
          <Typography variant="caption" color="textSecondary">
            (+{prices.length - 1})
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

