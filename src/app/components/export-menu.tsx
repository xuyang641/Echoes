import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { DiaryEntry } from '../types/diary';

interface ExportMenuProps {
  entries: DiaryEntry[];
}

export function ExportMenu({ entries }: ExportMenuProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const dataStr = JSON.stringify(entries, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      await new Promise<void>((resolve, reject) => {
        try {
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `photo-diary-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      
      setShowMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('export.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('Photo Diary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.text(`Exported on ${format(new Date(), 'MMMM d, yyyy')}`, 20, yPosition);
      yPosition += 15;

      // Sort entries by date
      const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        const entryDate = format(new Date(entry.date), 'MMMM d, yyyy - h:mm a');

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        // Entry header
        pdf.setFontSize(14);
        pdf.text(entryDate, 20, yPosition);
        yPosition += 7;

        // Mood
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${t('filters.mood')}: ${entry.mood}`, 20, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 7;

        // Caption
        pdf.setFontSize(11);
        const captionLines = pdf.splitTextToSize(entry.caption, pageWidth - 40);
        pdf.text(captionLines, 20, yPosition);
        yPosition += captionLines.length * 5 + 10;

        // Add spacing between entries
        yPosition += 5;
      }

      pdf.save(`photo-diary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      await new Promise<void>(resolve => setTimeout(resolve, 100)); // Small delay to allow save to trigger
      setShowMenu(false);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(t('export.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm">{t('export.button')}</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
            <div className="p-1">
              <button
                onClick={exportToPDF}
                disabled={isExporting || entries.length === 0}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {t('export.pdf')}
              </button>

              <button
                onClick={exportToJSON}
                disabled={isExporting || entries.length === 0}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4" />
                )}
                {t('export.json')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}