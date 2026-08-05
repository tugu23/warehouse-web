import api from '../lib/axios';
import { toast } from 'react-hot-toast';

const getReceiptPdfPath = (orderId: number) => `/api/orders/${orderId}/receipt/pdf`;

export interface ReceiptResponse {
  success: boolean;
  receiptUrl?: string;
  receiptId?: string;
  error?: string;
}

class ReceiptService {
  /**
   * Get receipt PDF URL for viewing
   */
  getReceiptPdfUrl(orderId: number): string {
    return getReceiptPdfPath(orderId);
  }

  /**
   * Get receipt PDF download URL
   */
  getReceiptDownloadUrl(orderId: number): string {
    return `${getReceiptPdfPath(orderId)}?download=true`;
  }

  /**
   * View receipt in new tab
   */
  async viewReceipt(orderId: number): Promise<void> {
    const previewWindow = window.open('', '_blank');

    try {
      const blob = await this.fetchReceiptBlob(orderId);
      const url = URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ð½ÑÑÐ³Ð´ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°...');
    } catch (error) {
      previewWindow?.close();
      console.error('Error viewing receipt:', error);
      toast.error('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ð½ÑÑÑ…ÑÐ´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°');
      throw error;
    }
  }

  /**
   * Download receipt PDF
   */
  async downloadReceipt(orderId: number, filename?: string): Promise<void> {
    try {
      const blob = await this.fetchReceiptBlob(orderId);
      const url = URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ñ‚Ð°Ñ‚Ð°Ð¶ Ð°Ð²Ð°Ñ… Ò¯Ð¹Ð»Ð´ÑÐ» ÑÑ…ÑÐ»Ð»ÑÑ');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ñ‚Ð°Ñ‚Ð°Ñ…Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°');
      throw error;
    }
  }

  /**
   * Fetch receipt as blob for advanced operations
   */
  async fetchReceiptBlob(orderId: number): Promise<Blob> {
    try {
      const response = await api.get<Blob>(getReceiptPdfPath(orderId), {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching receipt blob:', error);
      toast.error('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ñ‚Ð°Ñ‚Ð°Ñ…Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°');
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
        toast.success('Ð¥ÑÐ²Ð»ÑÑ… Ñ†Ð¾Ð½Ñ… Ð½ÑÑÐ³Ð´ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°...');
      } else {
        toast.error('Pop-up Ñ†Ð¾Ð½Ñ… Ð±Ð»Ð¾ÐºÐ»Ð¾Ð³Ð´ÑÐ¾Ð½ Ð±Ð°Ð¹Ð½Ð°');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Ð¥ÑÐ²Ð»ÑÑ…ÑÐ´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°');
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
          title: `Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ â„–${orderId}`,
          text: 'Борлуулалтын баримт',
          files: [file],
        });

        toast.success('Ð‘Ð°Ñ€Ð¸Ð¼Ñ‚ Ñ…ÑƒÐ²Ð°Ð°Ð»Ñ†Ð»Ð°Ð°');
      } else {
        // Fallback: Copy link to clipboard
        const url = new URL(this.getReceiptPdfUrl(orderId), window.location.origin).toString();
        await navigator.clipboard.writeText(url);
        toast.success('Ð›Ð¸Ð½Ðº Ñ…ÑƒÑƒÐ»Ð°Ð³Ð´Ð»Ð°Ð°');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing receipt:', error);
        toast.error('Ð¥ÑƒÐ²Ð°Ð°Ð»Ñ†Ð°Ñ…Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°');
      }
      throw error;
    }
  }

  /**
   * Get E-Barimt info from order
   */
  getEBarimtInfo(order: { eReceiptNumber?: string }): {
    hasEBarimt: boolean;
    receiptNumber?: string;
  } {
    return {
      hasEBarimt: !!order.eReceiptNumber,
      receiptNumber: order.eReceiptNumber,
    };
  }
}

export const receiptService = new ReceiptService();
export default receiptService;

