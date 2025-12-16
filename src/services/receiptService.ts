import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface ReceiptResponse {
  success: boolean;
  receiptUrl?: string;
  receiptId?: string;
  lottery?: string;
  qrCode?: string;
  error?: string;
}

class ReceiptService {
  /**
   * Get receipt PDF URL for viewing
   */
  getReceiptPdfUrl(orderId: number): string {
    return `${API_BASE_URL}/orders/${orderId}/receipt/pdf`;
  }

  /**
   * Get receipt PDF download URL
   */
  getReceiptDownloadUrl(orderId: number): string {
    return `${API_BASE_URL}/orders/${orderId}/receipt/pdf?download=true`;
  }

  /**
   * View receipt in new tab
   */
  async viewReceipt(orderId: number): Promise<void> {
    try {
      const url = this.getReceiptPdfUrl(orderId);
      window.open(url, '_blank');
      toast.success('Баримт нээгдэж байна...');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast.error('Баримт нээхэд алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Download receipt PDF
   */
  async downloadReceipt(orderId: number, filename?: string): Promise<void> {
    try {
      const url = this.getReceiptDownloadUrl(orderId);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Баримт татаж авах үйлдэл эхэллээ');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Баримт татахад алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Fetch receipt as blob for advanced operations
   */
  async fetchReceiptBlob(orderId: number): Promise<Blob> {
    try {
      const url = this.getReceiptPdfUrl(orderId);
      const response = await axios.get(url, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching receipt blob:', error);
      toast.error('Баримт татахад алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Print receipt directly
   */
  async printReceipt(orderId: number): Promise<void> {
    try {
      const blob = await this.fetchReceiptBlob(orderId);
      const url = URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up blob URL after printing
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        toast.success('Хэвлэх цонх нээгдэж байна...');
      } else {
        toast.error('Pop-up цонх блоклогдсон байна');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Хэвлэхэд алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Share receipt (mobile)
   */
  async shareReceipt(orderId: number): Promise<void> {
    try {
      if (navigator.share) {
        const blob = await this.fetchReceiptBlob(orderId);
        const file = new File([blob], `receipt-${orderId}.pdf`, {
          type: 'application/pdf',
        });

        await navigator.share({
          title: `Баримт №${orderId}`,
          text: 'Зарлагын падаан',
          files: [file],
        });

        toast.success('Баримт хуваалцлаа');
      } else {
        // Fallback: Copy link to clipboard
        const url = this.getReceiptPdfUrl(orderId);
        await navigator.clipboard.writeText(url);
        toast.success('Линк хуулагдлаа');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing receipt:', error);
        toast.error('Хуваалцахад алдаа гарлаа');
      }
      throw error;
    }
  }

  /**
   * Get E-Barimt info from order
   */
  getEBarimtInfo(order: {
    eReceiptNumber?: string;
    eReceiptLottery?: string;
    eReceiptQrCode?: string;
  }): {
    hasEBarimt: boolean;
    receiptNumber?: string;
    lottery?: string;
    qrCode?: string;
  } {
    return {
      hasEBarimt: !!order.eReceiptNumber,
      receiptNumber: order.eReceiptNumber,
      lottery: order.eReceiptLottery,
      qrCode: order.eReceiptQrCode,
    };
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
