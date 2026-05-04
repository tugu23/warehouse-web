import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { promotionsApi } from '../../api';
import type {
  CreatePromotionRequest,
  Promotion,
  PromotionType,
  UpdatePromotionRequest,
} from '../../types';

interface PromotionManagementProps {
  productId: number;
  onUpdate?: () => void;
}

interface FormState {
  name: string;
  type: PromotionType;
  discountPercent: string;
  buyQty: string;
  freeQty: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const PROMOTION_TYPE_LABEL: Record<PromotionType, string> = {
  PERCENT_DISCOUNT: 'Хувийн хөнгөлөлт',
  BUY_X_GET_Y: 'X+Y (Авбал үнэгүй)',
};

function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDateTimeLocalValue(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function defaultFormState(): FormState {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return {
    name: '',
    type: 'PERCENT_DISCOUNT',
    discountPercent: '10',
    buyQty: '1',
    freeQty: '1',
    startDate: toDateTimeLocalValue(now.toISOString()),
    endDate: toDateTimeLocalValue(end.toISOString()),
    isActive: true,
  };
}

function describePromotion(p: Promotion): string {
  if (p.type === 'PERCENT_DISCOUNT') {
    return `${Number(p.discountPercent ?? 0)}% хөнгөлөлт`;
  }
  return `${p.buyQty ?? 0}+${p.freeQty ?? 0}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractApiErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const maybeResponse = (error as { response?: unknown }).response;
  if (typeof maybeResponse !== 'object' || maybeResponse === null) return '';
  const maybeData = (maybeResponse as { data?: unknown }).data;
  if (typeof maybeData !== 'object' || maybeData === null) return '';

  const message = (maybeData as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;

  const firstError = (maybeData as { errors?: Array<{ msg?: unknown }> }).errors?.[0]?.msg;
  if (typeof firstError === 'string' && firstError.trim()) return firstError;

  return '';
}

export default function PromotionManagement({ productId, onUpdate }: PromotionManagementProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await promotionsApi.listByProduct(productId);
      setPromotions(response.data.data?.promotions || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Урамшууллын мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const resetForm = () => {
    setForm(defaultFormState());
    setEditingId(null);
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (promotion: Promotion) => {
    setForm({
      name: promotion.name,
      type: promotion.type,
      discountPercent: promotion.discountPercent != null ? String(promotion.discountPercent) : '',
      buyQty: promotion.buyQty != null ? String(promotion.buyQty) : '',
      freeQty: promotion.freeQty != null ? String(promotion.freeQty) : '',
      startDate: toDateTimeLocalValue(promotion.startDate),
      endDate: toDateTimeLocalValue(promotion.endDate),
      isActive: promotion.isActive,
    });
    setEditingId(promotion.id);
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Нэр оруулна уу';
    if (!form.startDate) errs.startDate = 'Эхлэх огноо';
    if (!form.endDate) errs.endDate = 'Дуусах огноо';
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate).getTime();
      const e = new Date(form.endDate).getTime();
      if (Number.isFinite(s) && Number.isFinite(e) && e <= s) {
        errs.endDate = 'Дуусах огноо нь эхлэх огнооноос хойш байх ёстой';
      }
    }
    if (form.type === 'PERCENT_DISCOUNT') {
      const dp = Number(form.discountPercent);
      if (!Number.isFinite(dp) || dp <= 0 || dp > 100) {
        errs.discountPercent = '0-100 хооронд тоо оруулна уу';
      }
    } else {
      const bx = Number(form.buyQty);
      const fy = Number(form.freeQty);
      if (!Number.isFinite(bx) || bx < 1) errs.buyQty = '1 ба түүнээс их';
      if (!Number.isFinite(fy) || fy < 1) errs.freeQty = '1 ба түүнээс их';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreatePromotionRequest | UpdatePromotionRequest = {
      name: form.name.trim(),
      type: form.type,
      discountPercent: form.type === 'PERCENT_DISCOUNT' ? Number(form.discountPercent) : null,
      buyQty: form.type === 'BUY_X_GET_Y' ? Number(form.buyQty) : null,
      freeQty: form.type === 'BUY_X_GET_Y' ? Number(form.freeQty) : null,
      startDate: fromDateTimeLocalValue(form.startDate),
      endDate: fromDateTimeLocalValue(form.endDate),
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await promotionsApi.update(editingId, payload as UpdatePromotionRequest);
        toast.success('Урамшуулал шинэчлэгдлээ');
      } else {
        await promotionsApi.create(productId, payload as CreatePromotionRequest);
        toast.success('Урамшуулал нэмэгдлээ');
      }
      closeForm();
      await fetchPromotions();
      onUpdate?.();
    } catch (error: unknown) {
      console.error('Error saving promotion:', error);
      const msg = extractApiErrorMessage(error) || 'Урамшуулал хадгалахад алдаа гарлаа';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Энэ урамшууллыг устгах уу?')) return;
    try {
      await promotionsApi.delete(id);
      toast.success('Урамшуулал устгагдлаа');
      await fetchPromotions();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Урамшуулал устгахад алдаа гарлаа');
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await promotionsApi.update(promotion.id, { isActive: !promotion.isActive });
      toast.success('Төлөв шинэчлэгдлээ');
      await fetchPromotions();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('Төлөв шинэчлэхэд алдаа гарлаа');
    }
  };

  const now = Date.now();
  const isExpired = (p: Promotion) => new Date(p.endDate).getTime() < now;
  const isUpcoming = (p: Promotion) => new Date(p.startDate).getTime() > now;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Урамшууллын жагсаалт</Typography>
        {!showForm && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Шинэ урамшуулал
          </Button>
        )}
      </Stack>

      {showForm && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="medium">
              {editingId ? 'Урамшуулал засах' : 'Шинэ урамшуулал'}
            </Typography>
            <IconButton size="small" onClick={closeForm}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Нэр"
                fullWidth
                size="small"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Урамшууллын төрөл</InputLabel>
                <Select
                  label="Урамшууллын төрөл"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })}
                >
                  <MenuItem value="PERCENT_DISCOUNT">Хувийн хөнгөлөлт (%)</MenuItem>
                  <MenuItem value="BUY_X_GET_Y">X+Y (1+1, 2+1 г.м)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {form.type === 'PERCENT_DISCOUNT' ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Хөнгөлөлтийн хувь (%)"
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  error={!!errors.discountPercent}
                  helperText={errors.discountPercent}
                />
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="Авбал (X)"
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={form.buyQty}
                    onChange={(e) => setForm({ ...form, buyQty: e.target.value })}
                    error={!!errors.buyQty}
                    helperText={errors.buyQty}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="Үнэгүй (Y)"
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={form.freeQty}
                    onChange={(e) => setForm({ ...form, freeQty: e.target.value })}
                    error={!!errors.freeQty}
                    helperText={errors.freeQty}
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Эхлэх огноо"
                fullWidth
                size="small"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Дуусах огноо"
                fullWidth
                size="small"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!!errors.endDate}
                helperText={errors.endDate}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
            <Button onClick={closeForm} disabled={submitting}>
              Цуцлах
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </Stack>
        </Paper>
      )}

      <Divider sx={{ mb: 2 }} />

      {promotions.length === 0 ? (
        <Alert severity="info">Энэ бараанд одоогоор урамшуулал байхгүй байна.</Alert>
      ) : (
        <Stack spacing={1.5}>
          {promotions.map((p) => {
            const expired = isExpired(p);
            const upcoming = isUpcoming(p);
            const activeNow = p.isActive && !expired && !upcoming;
            return (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{
                  p: 2,
                  opacity: expired ? 0.6 : 1,
                  borderColor: activeNow ? 'success.main' : undefined,
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight="medium">
                        {p.name}
                      </Typography>
                      <Chip size="small" label={PROMOTION_TYPE_LABEL[p.type]} />
                      <Chip
                        size="small"
                        color="primary"
                        label={describePromotion(p)}
                        variant="filled"
                      />
                      {expired ? (
                        <Chip size="small" color="default" label="Дууссан" />
                      ) : upcoming ? (
                        <Chip size="small" color="warning" label="Хүлээгдэж буй" />
                      ) : p.isActive ? (
                        <Chip size="small" color="success" label="Идэвхтэй" />
                      ) : (
                        <Chip size="small" color="default" label="Идэвхгүй" />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" component="div" mt={0.5}>
                      {formatDate(p.startDate)} – {formatDate(p.endDate)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    {!expired && (
                      <Button
                        size="small"
                        variant="outlined"
                        color={p.isActive ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.isActive ? 'Идэвхгүй' : 'Идэвхжүүлэх'}
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => openEdit(p)} disabled={showForm}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
