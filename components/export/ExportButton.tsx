'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportManager, ExportOptions } from '@/lib/export/ExportManager';

interface ExportButtonProps {
  data: any;
  filename?: string;
  template?: ExportOptions['template'];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({ 
  data, 
  filename, 
  template,
  variant = 'outline',
  size = 'default'
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    setExporting(true);
    try {
      const options: ExportOptions = {
        format,
        filename,
        template
      };

      if (format === 'pdf') {
        await ExportManager.exportToPDF(data, options);
      } else if (format === 'csv') {
        const dataArray = Array.isArray(data) ? data : [data];
        ExportManager.exportToCSV(dataArray, filename);
      } else {
        ExportManager.exportToJSON(data, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {size !== 'icon' && <span className="ml-2">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
