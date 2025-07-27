// QR Code Generator Class (from the original file)
export class QRCodeGenerator {
  private typeNumber: number;
  private errorCorrectionLevel: string;
  private modules: boolean[][] | null;
  private moduleCount: number;
  private dataCache: number[] | null;
  private dataList: string[];

  constructor() {
    this.typeNumber = 4;
    this.errorCorrectionLevel = 'M';
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  makeCode(text: string) {
    if (!text || text.length === 0) {
      throw new Error('QR code text cannot be empty');
    }
    
    console.log('QR makeCode started:', { text, length: text.length });
    
    this.dataList = [text];
    this.dataCache = null;
    
    // Determine appropriate type number based on data length
    this.typeNumber = this.getTypeNumber(text);
    console.log('QR typeNumber determined:', this.typeNumber);
    
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private getTypeNumber(text: string): number {
    const length = text.length;
    
    // Return appropriate type number based on data length
    // Type 1 (21x21) can hold ~17 chars, Type 2 (25x25) ~32 chars, etc.
    if (length <= 17) return 1;
    if (length <= 32) return 2;
    if (length <= 53) return 3;
    if (length <= 78) return 4;
    if (length <= 106) return 5;
    if (length <= 134) return 6;
    if (length <= 154) return 7;
    return Math.min(10, Math.ceil(length / 20)); // Cap at type 10
  }

  private makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);

    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (let col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = false;
      }
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    if (this.dataCache == null) {
      this.dataCache = this.createData(this.typeNumber, this.errorCorrectionLevel, this.dataList);
    }

    this.mapData(this.dataCache, maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;

      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;

        if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules![row + r][col + c] = true;
        } else {
          this.modules![row + r][col + c] = false;
        }
      }
    }
  }

  private setupPositionAdjustPattern() {
    const positions = this.getPositionAdjustPattern(this.typeNumber);
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const row = positions[i];
        const col = positions[j];

        // Bounds checking
        if (row < 0 || row >= this.moduleCount || col < 0 || col >= this.moduleCount) {
          continue;
        }

        if (!this.modules || !this.modules[row] || this.modules[row][col] != null) {
          continue;
        }

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const newRow = row + r;
            const newCol = col + c;
            
            // Additional bounds checking
            if (newRow < 0 || newRow >= this.moduleCount || 
                newCol < 0 || newCol >= this.moduleCount ||
                !this.modules[newRow]) {
              continue;
            }
            
            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
              this.modules[newRow][newCol] = true;
            } else {
              this.modules[newRow][newCol] = false;
            }
          }
        }
      }
    }
  }

  private getPositionAdjustPattern(typeNumber: number): number[] {
    const patterns: { [key: number]: number[] } = {
      1: [],
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
      9: [6, 26, 46],
      10: [6, 28, 50]
    };
    
    return patterns[typeNumber] || [6];
  }

  private setupTimingPattern() {
    // Bounds checking for timing pattern
    if (!this.modules || this.moduleCount < 16) {
      console.warn('Module array too small for timing pattern');
      return;
    }

    // Vertical timing pattern
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (r >= 0 && r < this.moduleCount && 
          this.modules[r] && 6 < this.modules[r].length &&
          this.modules[r][6] == null) {
        this.modules[r][6] = (r % 2 == 0);
      }
    }

    // Horizontal timing pattern  
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (6 >= 0 && 6 < this.moduleCount && 
          this.modules[6] && c < this.modules[6].length &&
          this.modules[6][c] == null) {
        this.modules[6][c] = (c % 2 == 0);
      }
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number) {
    const bits = (1 << 3) | maskPattern;
    const data = bits << 10;

    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((data >> i) & 1) == 1);

      if (i < 6) {
        this.modules![i][8] = mod;
      } else if (i < 8) {
        this.modules![i + 1][8] = mod;
      } else {
        this.modules![this.moduleCount - 15 + i][8] = mod;
      }
    }

    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((data >> i) & 1) == 1);

      if (i < 8) {
        this.modules![8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules![8][15 - i - 1 + 1] = mod;
      } else {
        this.modules![8][15 - i - 1] = mod;
      }
    }

    this.modules![this.moduleCount - 8][8] = (!test);
  }

  private setupTypeNumber(test: boolean) {
    const bits = this.typeNumber << 12;

    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      this.modules![Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
    }

    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      this.modules![i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  private mapData(data: number[], maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;

      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules![row][col - c] == null) {
            let dark = false;

            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
            }

            const mask = this.getMask(maskPattern, row, col - c);

            if (mask) {
              dark = !dark;
            }

            this.modules![row][col - c] = dark;
            bitIndex--;

            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private getMask(maskPattern: number, i: number, j: number): boolean {
    switch (maskPattern) {
      case 0: return (i + j) % 2 == 0;
      case 1: return i % 2 == 0;
      case 2: return j % 3 == 0;
      case 3: return (i + j) % 3 == 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case 5: return (i * j) % 2 + (i * j) % 3 == 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
      case 7: return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
      default: throw new Error("bad maskPattern:" + maskPattern);
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0;
    let pattern = 0;

    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = this.getLostPoint();

      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }

    return pattern;
  }

  private getLostPoint(): number {
    const moduleCount = this.moduleCount;
    let lostPoint = 0;

    // LEVEL1
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = this.modules![row][col];

        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }

          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }

            if (r == 0 && c == 0) {
              continue;
            }

            if (dark == this.modules![row + r][col + c]) {
              sameCount++;
            }
          }
        }

        if (sameCount > 5) {
          lostPoint += (3 + sameCount - 5);
        }
      }
    }

    return lostPoint;
  }

  private createData(typeNumber: number, errorCorrectionLevel: string, dataList: string[]): number[] {
    const buffer: number[] = [];

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      for (let j = 0; j < data.length; j++) {
        buffer.push(data.charCodeAt(j));
      }
    }

    return buffer;
  }

  getModuleCount(): number {
    return this.moduleCount;
  }

  isDark(row: number, col: number): boolean {
    // Comprehensive bounds checking
    if (!this.modules || 
        row < 0 || row >= this.moduleCount ||
        col < 0 || col >= this.moduleCount ||
        !this.modules[row] ||
        col >= this.modules[row].length) {
      return false;
    }
    
    return this.modules[row][col] === true;
  }
}

// QR Data generation helpers
export const generateQRData = (type: string, formData: any): string => {
  switch (type) {
    case 'text':
      return formData.text || '';
    
    case 'url':
      if (!formData.url) return '';
      return formData.url.startsWith('http://') || formData.url.startsWith('https://')
        ? formData.url
        : `https://${formData.url}`;
    
    case 'vcard':
      if (!formData.name && !formData.phone && !formData.email) return '';
      return `BEGIN:VCARD
VERSION:3.0
FN:${formData.name || ''}
TEL:${formData.phone || ''}
EMAIL:${formData.email || ''}
END:VCARD`;
    
    case 'wifi':
      if (!formData.ssid) return '';
      return `WIFI:T:${formData.encryption || 'WPA'};S:${formData.ssid};P:${formData.password || ''};;`;
    
    case 'phone':
      return formData.phoneNumber ? `tel:${formData.phoneNumber}` : '';
    
    case 'email':
      if (!formData.emailAddress) return '';
      let mailto = `mailto:${formData.emailAddress}`;
      const params = [];
      if (formData.subject) params.push(`subject=${encodeURIComponent(formData.subject)}`);
      if (formData.body) params.push(`body=${encodeURIComponent(formData.body)}`);
      if (params.length > 0) mailto += `?${params.join('&')}`;
      return mailto;
    
    case 'sms':
      if (!formData.smsNumber) return '';
      return `sms:${formData.smsNumber}${formData.smsMessage ? `?body=${encodeURIComponent(formData.smsMessage)}` : ''}`;
    
    default:
      return '';
  }
};
