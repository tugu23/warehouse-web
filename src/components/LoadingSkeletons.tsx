import { Skeleton, Box, Card, CardContent } from '@mui/material';

export function TableSkeleton() {
  return (
    <Box>
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={60} />
        </Box>
      ))}
    </Box>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <Box>
      {[...Array(4)].map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="rectangular" height={56} sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  );
}
