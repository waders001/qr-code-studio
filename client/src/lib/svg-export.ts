import { QRCodeGenerator } from './qr-generator';

interface SVGOptions {
  size: number;
  fgColor: string;
  bgColor: string;
  overlayText?: string;
  logoUrl?: string;
}

export function generateSVG(qrData: string, options: SVGOptions): string {
  const { size, fgColor, bgColor, overlayText, logoUrl } = options;
  
  const qr = new QRCodeGenerator();
  qr.makeCode(qrData);
  
  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;
  const totalHeight = overlayText ? size + 40 : size;
  
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${totalHeight}" fill="${bgColor}"/>`;

  // Generate QR modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = col * cellSize;
        const y = row * cellSize;
        svgContent += `
  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
      }
    }
  }

  // Add logo overlay if present
  if (logoUrl) {
    const logoSize = size * 0.15;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    
    // Background circle for logo
    svgContent += `
  <circle cx="${size / 2}" cy="${size / 2}" r="${logoSize / 2 + 4}" fill="${bgColor}"/>`;
    
    if (logoUrl.length === 2) {
      // Emoji
      svgContent += `
  <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${logoSize}" font-family="system-ui">${logoUrl}</text>`;
    } else if (logoUrl.startsWith('data:')) {
      // Base64 image
      svgContent += `
  <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logoUrl}"/>`;
    }
  }

  // Add text overlay if present
  if (overlayText) {
    svgContent += `
  <text x="${size / 2}" y="${size + 20}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="bold" font-family="system-ui" fill="${fgColor}">${overlayText}</text>`;
  }

  svgContent += `
</svg>`;

  return svgContent;
}
