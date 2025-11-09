import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { CameraAlt as CameraIcon, Close as CloseIcon } from '@mui/icons-material';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (open && scannerRef.current) {
      startScanner();
    }

    return () => {
      if (isScanning) {
        stopScanner();
      }
    };
  }, [open]);

  const startScanner = () => {
    if (!scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
          ],
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
      },
      (err) => {
        if (err) {
          console.error('Scanner initialization error:', err);
          setError('Camera initialization failed. Please check your camera permissions.');
          return;
        }
        Quagga.start();
        setIsScanning(true);
      }
    );

    Quagga.onDetected((result) => {
      if (result.codeResult && result.codeResult.code) {
        const barcode = result.codeResult.code;
        onScan(barcode);
        handleClose();
      }
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraIcon />
          Scan Barcode
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          ref={scannerRef}
          sx={{
            width: '100%',
            minHeight: 300,
            bgcolor: 'black',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
            '& video': {
              width: '100%',
              height: 'auto',
            },
            '& canvas': {
              position: 'absolute',
              top: 0,
              left: 0,
            },
          }}
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          Point your camera at a barcode to scan it automatically.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
