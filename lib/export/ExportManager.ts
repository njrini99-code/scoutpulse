// @ts-ignore - jspdf types not available
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  filename?: string;
  includeImages?: boolean;
  template?: 'player-report' | 'recruiting-summary' | 'comparison';
}

export class ExportManager {
  static async exportToPDF(data: any, options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    const filename = options.filename || `export-${Date.now()}.pdf`;

    switch (options.template) {
      case 'player-report':
        this.generatePlayerReport(doc, data);
        break;
      case 'recruiting-summary':
        this.generateRecruitingSummary(doc, data);
        break;
      case 'comparison':
        this.generateComparisonReport(doc, data);
        break;
      default:
        this.generateGenericReport(doc, data);
    }

    doc.save(filename);
  }

  static exportToCSV(data: any[], filename?: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportToJSON(data: any, filename?: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static generatePlayerReport(doc: jsPDF, player: any): void {
    doc.setFontSize(20);
    doc.text('Player Report', 14, 20);

    doc.setFontSize(12);
    let y = 30;
    doc.text(`Name: ${player.name || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Position: ${player.position || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Graduation Year: ${player.graduationYear || 'N/A'}`, 14, y);
    y += 10;

    if (player.stats) {
      doc.setFontSize(14);
      doc.text('Statistics', 14, y);
      y += 7;
      doc.setFontSize(10);

      Object.entries(player.stats).forEach(([key, value]) => {
        const statName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(`${statName}: ${value}`, 14, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    }
  }

  private static generateRecruitingSummary(doc: jsPDF, data: any): void {
    doc.setFontSize(20);
    doc.text('Recruiting Summary', 14, 20);

    doc.setFontSize(12);
    let y = 30;
    doc.text(`Total Prospects: ${data.total || 0}`, 14, y);
    y += 7;
    doc.text(`Active Conversations: ${data.active || 0}`, 14, y);
    y += 7;
    doc.text(`Offers Extended: ${data.offers || 0}`, 14, y);
  }

  private static generateComparisonReport(doc: jsPDF, players: any[]): void {
    doc.setFontSize(20);
    doc.text('Player Comparison', 14, 20);

    let y = 30;
    doc.setFontSize(10);

    players.forEach((player, idx) => {
      doc.text(`${idx + 1}. ${player.name} - ${player.position}`, 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
  }

  private static generateGenericReport(doc: jsPDF, data: any): void {
    doc.setFontSize(16);
    doc.text('Export Report', 14, 20);

    doc.setFontSize(10);
    const content = JSON.stringify(data, null, 2);
    const lines = doc.splitTextToSize(content, 180);
    let y = 30;

    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });
  }

  static async exportBulk(items: any[], options: ExportOptions): Promise<void> {
    if (options.format === 'pdf') {
      // For bulk PDF, create a ZIP or combine into one PDF
      await this.exportToPDF(items, options);
    } else if (options.format === 'csv') {
      this.exportToCSV(items, options.filename);
    } else {
      this.exportToJSON(items, options.filename);
    }
  }
}
