import { Chip, Box, Typography, Tooltip } from '@mui/material';
import { ProductBatch } from '../types';
import { 
  getExpiryStatus, 
  getStatusColor, 
  getStatusIcon, 
  getStatusLabel,
  getDaysUntilExpiry,
  formatExpiryDate 
} from '../utils/expiry.utils';

interface ExpiryBadgeProps {
  batch?: ProductBatch;
  size?: 'small' | 'medium';
  showDate?: boolean;
}

export default function ExpiryBadge({ 
  batch, 
  size = 'small',
  showDate = true 
}: ExpiryBadgeProps) {
  if (!batch) return null;
  
  const status = getExpiryStatus(batch);
  const color = getStatusColor(status);
  const icon = getStatusIcon(status);
  const days = batch.expiryDate ? getDaysUntilExpiry(batch.expiryDate) : null;
  const label = getStatusLabel(status, days || undefined);
  
  const tooltipContent = (
    <Box>
      <Typography variant="caption" display="block">
        Статус: {label}
      </Typography>
      {batch.expiryDate && (
        <Typography variant="caption" display="block">
          Дуусах огноо: {formatExpiryDate(batch.expiryDate)}
        </Typography>
      )}
      {days !== null && (
        <Typography variant="caption" display="block">
          {days >= 0 ? `${days} хоног үлдсэн` : `${Math.abs(days)} хоног дууссан`}
        </Typography>
      )}
      <Typography variant="caption" display="block">
        Тоо: {batch.quantity} ширхэг
      </Typography>
      <Typography variant="caption" display="block">
        Багц: {batch.batchNumber}
      </Typography>
    </Box>
  );
  
  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        icon={<span>{icon}</span>}
        label={showDate && batch.expiryDate ? formatExpiryDate(batch.expiryDate) : label}
        color={color}
        size={size}
        sx={{ fontWeight: 'medium' }}
      />
    </Tooltip>
  );
}

