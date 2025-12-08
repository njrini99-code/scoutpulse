// ═══════════════════════════════════════════════════════════════════════════
// Player Profile PDF Export Utility
// ═══════════════════════════════════════════════════════════════════════════

import type { Player } from '@/lib/types';

interface PlayerMetric {
  metric_label: string;
  metric_value: string;
  metric_type?: string;
  verified_date?: string | null;
}

interface PlayerVideo {
  title: string;
  video_url: string;
  video_type?: string;
}

interface PlayerAchievement {
  achievement_text: string;
  achievement_date?: string | null;
}

interface ExportPlayerData {
  player: Player;
  metrics?: PlayerMetric[];
  videos?: PlayerVideo[];
  achievements?: PlayerAchievement[];
}

/**
 * Generate a printable HTML document for the player profile
 * that can be saved as PDF using browser print functionality
 */
export function generatePlayerPDFContent(data: ExportPlayerData): string {
  const { player, metrics = [], videos = [], achievements = [] } = data;

  const fullName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Player';
  const position = player.primary_position || 'N/A';
  const gradYear = player.grad_year || 'N/A';
  const height = player.height_feet && player.height_inches 
    ? `${player.height_feet}'${player.height_inches}"` 
    : 'N/A';
  const weight = player.weight_lbs ? `${player.weight_lbs} lbs` : 'N/A';
  const location = [player.high_school_city, player.high_school_state].filter(Boolean).join(', ') || 'N/A';
  const hsName = player.high_school_name || 'N/A';
  const bats = player.bats || 'N/A';
  const throws = player.throws || 'N/A';

  // Group metrics by type
  const performanceMetrics = metrics.filter(m => 
    ['60_time', 'exit_velo', 'fastball_velo', 'pop_time', 'arm_velo'].includes(m.metric_type || '')
  );
  const otherMetrics = metrics.filter(m => 
    !['60_time', 'exit_velo', 'fastball_velo', 'pop_time', 'arm_velo'].includes(m.metric_type || '')
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fullName} - Player Profile | ScoutPulse</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #10b981;
    }

    .logo {
      font-size: 14px;
      font-weight: 700;
      color: #10b981;
    }

    .generated {
      font-size: 10px;
      color: #64748b;
    }

    /* Player Info */
    .player-header {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 700;
    }

    .player-details h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .position-tag {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }

    .grad-year {
      color: #64748b;
      font-size: 14px;
    }

    .location {
      color: #64748b;
      margin-top: 8px;
    }

    /* Sections */
    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .info-item {
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
    }

    .info-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .metric-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #059669;
    }

    .metric-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Videos */
    .video-list {
      list-style: none;
    }

    .video-item {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .video-item:last-child {
      border-bottom: none;
    }

    .video-title {
      font-weight: 500;
    }

    .video-link {
      color: #10b981;
      font-size: 10px;
      word-break: break-all;
    }

    /* Achievements */
    .achievement-list {
      list-style: none;
    }

    .achievement-item {
      padding: 8px 12px;
      background: #fef3c7;
      border-radius: 6px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .achievement-icon {
      color: #d97706;
    }

    /* About */
    .about-text {
      color: #475569;
      line-height: 1.6;
    }

    /* Contact */
    .contact-info {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }

    .contact-row {
      display: flex;
      gap: 24px;
    }

    .contact-item {
      flex: 1;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
    }

    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo">◈ ScoutPulse</div>
    <div class="generated">Generated ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</div>
  </div>

  <!-- Player Header -->
  <div class="player-header">
    <div class="avatar">${fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
    <div class="player-details">
      <h1>${fullName}</h1>
      <div>
        <span class="position-tag">${position}</span>
        <span class="grad-year">Class of ${gradYear}</span>
      </div>
      <div class="location">📍 ${location}</div>
    </div>
  </div>

  <!-- Basic Info -->
  <div class="section">
    <div class="section-title">Player Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Height</div>
        <div class="info-value">${height}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Weight</div>
        <div class="info-value">${weight}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Bats</div>
        <div class="info-value">${bats}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Throws</div>
        <div class="info-value">${throws}</div>
      </div>
    </div>
    <div class="info-grid" style="margin-top: 12px;">
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">High School</div>
        <div class="info-value">${hsName}</div>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Graduation Year</div>
        <div class="info-value">${gradYear}</div>
      </div>
    </div>
  </div>

  ${performanceMetrics.length > 0 ? `
  <!-- Performance Metrics -->
  <div class="section">
    <div class="section-title">Performance Metrics</div>
    <div class="metrics-grid">
      ${performanceMetrics.map(m => `
        <div class="metric-card">
          <div class="metric-value">${m.metric_value}</div>
          <div class="metric-label">${m.metric_label}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${videos.length > 0 ? `
  <!-- Videos -->
  <div class="section">
    <div class="section-title">Highlight Videos</div>
    <ul class="video-list">
      ${videos.map(v => `
        <li class="video-item">
          <span class="video-title">🎬 ${v.title}</span>
          <span class="video-link">${v.video_url}</span>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${achievements.length > 0 ? `
  <!-- Achievements -->
  <div class="section">
    <div class="section-title">Achievements & Awards</div>
    <ul class="achievement-list">
      ${achievements.map(a => `
        <li class="achievement-item">
          <span class="achievement-icon">🏆</span>
          <span>${a.achievement_text}${a.achievement_date ? ` (${a.achievement_date})` : ''}</span>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${player.about_me ? `
  <!-- About -->
  <div class="section">
    <div class="section-title">About</div>
    <p class="about-text">${player.about_me}</p>
  </div>
  ` : ''}

  <!-- Contact -->
  <div class="section">
    <div class="section-title">Contact Information</div>
    <div class="contact-info">
      <div class="contact-row">
        <div class="contact-item">
          <div class="info-label">Email</div>
          <div>${(player as any).email_contact || 'Not provided'}</div>
        </div>
        <div class="contact-item">
          <div class="info-label">Phone</div>
          <div>${(player as any).phone_contact || 'Not provided'}</div>
        </div>
      </div>
      ${player.twitter_url || (player as any).instagram_url ? `
      <div class="contact-row" style="margin-top: 12px;">
        ${player.twitter_url ? `
        <div class="contact-item">
          <div class="info-label">Twitter</div>
          <div>${player.twitter_url}</div>
        </div>
        ` : ''}
        ${(player as any).instagram_url ? `
        <div class="contact-item">
          <div class="info-label">Instagram</div>
          <div>${(player as any).instagram_url}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Profile exported from ScoutPulse • scoutpulse.app</p>
    <p>This document was auto-generated. For the most up-to-date information, visit the player's ScoutPulse profile.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Export player profile to PDF by opening a print dialog
 */
export function exportPlayerToPDF(data: ExportPlayerData): void {
  const htmlContent = generatePlayerPDFContent(data);
  
  // Open in a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

/**
 * Download as HTML file (alternative to PDF)
 */
export function downloadPlayerHTML(data: ExportPlayerData): void {
  const htmlContent = generatePlayerPDFContent(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.player.full_name || 'player'}-profile.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


