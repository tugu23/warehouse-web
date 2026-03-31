import { useMemo, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Box,
  Typography,
} from '@mui/material';

interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  title?: string;
  actions?: React.ReactNode;
}

type Order = 'asc' | 'desc';

export default function DataTable<T extends object>({
  columns,
  data,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search...',
  title,
  actions,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<Order>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  /** Ижил id-тай мөр API/state алдаагаар давхарсан тохиолдолд эхнийхийг үлдээнэ */
  const dedupedData = useMemo(() => {
    if (!data?.length) return data;
    const first = data[0] as Record<string, unknown>;
    if (first.id === undefined || first.id === null) return data;
    const seen = new Set<string | number>();
    const out: T[] = [];
    for (const row of data) {
      const id = (row as Record<string, unknown>).id;
      if (id === undefined || id === null) {
        out.push(row);
        continue;
      }
      if (!seen.has(id as string | number)) {
        seen.add(id as string | number);
        out.push(row);
      }
    }
    return out;
  }, [data]);

  const rowKey = (row: T, index: number) => {
    const id = (row as Record<string, unknown>).id;
    if (id !== undefined && id !== null) return `id-${String(id)}`;
    return `idx-${index}`;
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order: Order, orderBy: string) => {
    return order === 'desc'
      ? (a: T, b: T) => descendingComparator(a, b, orderBy)
      : (a: T, b: T) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a: T, b: T, orderBy: string) => {
    const aVal = (a as Record<string, unknown>)[orderBy] as string | number | null | undefined;
    const bVal = (b as Record<string, unknown>)[orderBy] as string | number | null | undefined;

    if (bVal == null) return -1;
    if (aVal == null) return 1;
    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
  };

  const filteredData = searchable
    ? dedupedData.filter((row) => {
        const searchLower = searchQuery.toLowerCase();

        // Helper function to recursively search through nested objects
        const searchInValue = (value: unknown): boolean => {
          if (value === null || value === undefined) return false;

          // If it's an object, search through its values
          if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.values(value).some(searchInValue);
          }

          // If it's an array, search through items
          if (Array.isArray(value)) {
            return value.some(searchInValue);
          }

          // Convert to string and search
          return String(value).toLowerCase().includes(searchLower);
        };

        return Object.values(row).some(searchInValue);
      })
    : dedupedData;

  const sortedData = orderBy ? [...filteredData].sort(getComparator(order, orderBy)) : filteredData;

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {(title || searchable || actions) && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            {title && (
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            )}
            {searchable && (
              <TextField
                size="small"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 300 }}
              />
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  hover
                  key={rowKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    const value = (row as Record<string, unknown>)[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(row) : String(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
