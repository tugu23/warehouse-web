import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { QrCodeScanner as ScannerIcon } from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
}

export default function BarcodeInput({
  value,
  onChange,
  label = 'Barcode',
  placeholder = 'Enter or scan barcode',
  error,
  helperText,
  disabled,
  fullWidth = true,
  required,
}: BarcodeInputProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScan = (barcode: string) => {
    onChange(barcode);
    setScannerOpen(false);
  };

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setScannerOpen(true)}
                edge="end"
                disabled={disabled}
                color="primary"
              >
                <ScannerIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
