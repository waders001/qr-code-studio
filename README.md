# QR Genius - Professional QR Code Generator

![QR Genius Logo](https://img.shields.io/badge/QR-Genius-4f46e5?style=for-the-badge&logo=qrcode)

A modern, professional QR code generator with advanced customization features, real-time preview, and comprehensive analytics. Built with React, TypeScript, and Node.js.

## ✨ Features

### 🎨 Professional Design
- **Glassmorphism UI** - Premium dark theme with beautiful blur effects
- **Real-time Preview** - See your QR code update instantly as you type
- **Custom Branding** - Add logos, emojis, and overlay text
- **Color Customization** - Full control over foreground and background colors

### 📱 Multiple Content Types
- **Text** - Plain text QR codes
- **URLs** - Website links with validation
- **vCard** - Digital business cards
- **WiFi** - Network credentials with encryption support
- **Phone** - Direct dial numbers
- **Email** - Pre-filled email composition
- **SMS** - Text messages with phone numbers

### 🚀 Export & Sharing
- **SVG Export** - Scalable vector graphics
- **PNG Export** - High-quality raster images
- **Shareable Links** - Instant link generation with analytics
- **Local Storage** - Offline history and favorites

### 📊 Analytics Dashboard
- **Usage Statistics** - Track QR code creation and scans
- **Content Type Distribution** - Visual breakdown of QR types
- **Recent Activity** - Timeline of recent QR codes
- **Download Tracking** - Monitor export activities

### 🔧 Developer Features
- **PWA Support** - Installable web app for desktop and mobile
- **Service Worker** - Offline functionality and caching
- **TypeScript** - Full type safety throughout
- **Modern Tech Stack** - React 18, Vite, Express, PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (optional, uses in-memory storage by default)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/qr-genius/qr-generator.git
   cd qr-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Premium component library

### Backend
- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Server-side type safety
- **PostgreSQL** - Robust database with Drizzle ORM
- **Rate Limiting** - Built-in security protection
- **Input Sanitization** - XSS prevention

### PWA Features
- **Service Worker** - Offline functionality
- **Web App Manifest** - Native app-like experience
- **Install Prompts** - Desktop and mobile installation
- **Background Sync** - Offline QR creation queue

## 📱 Mobile Support

QR Genius is fully responsive and works seamlessly on all devices:

- **📱 iOS Safari** - Full PWA support with install prompts
- **🤖 Android Chrome** - Native app experience
- **💻 Desktop** - Optimized for keyboard navigation
- **⌚ Progressive Enhancement** - Works on any screen size

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse (10 requests/minute)
- **Input Sanitization** - Removes malicious scripts
- **HTTPS Only** - Secure data transmission
- **Content Security Policy** - XSS protection
- **Secure Headers** - OWASP recommended security headers

## 🎯 Browser Support

- **Chrome** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Edge** 90+ ✅

## 📊 Analytics & Privacy

QR Genius respects your privacy:
- **No Personal Data** - We don't collect personal information
- **Local Storage** - Your QR history stays on your device
- **Optional Analytics** - Anonymous usage statistics only
- **GDPR Compliant** - European privacy standards

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=qr-genius/qr-generator&type=Date)](https://star-history.com/#qr-genius/qr-generator&Date)

## 📞 Support

- **📧 Email**: support@qr-genius.com
- **💬 Discord**: [Join our community](https://discord.gg/qr-genius)
- **🐛 Issues**: [GitHub Issues](https://github.com/qr-genius/qr-generator/issues)
- **📚 Documentation**: [docs.qr-genius.com](https://docs.qr-genius.com)

---

<div align="center">

**[🌐 Live Demo](https://qr-genius.vercel.app)** • **[📱 Install PWA](https://qr-genius.vercel.app)** • **[⭐ Star on GitHub](https://github.com/qr-genius/qr-generator)**

Made with ❤️ by the QR Genius team

</div>