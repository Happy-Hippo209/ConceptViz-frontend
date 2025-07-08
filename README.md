# ConceptViz Frontend

The frontend application for ConceptViz - a visual analytics system for exploring concepts in Large Language Models through Sparse Autoencoders.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Data Visualization**: D3.js for custom visualization component

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets and favicon
├── src/
│   ├── app/               # Next.js 13+ app directory
│   │   ├── components/    # Reusable UI components
│   │   ├── favicon.ico    # App favicon
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout component
│   │   └── page.tsx       # Home page component
│   ├── data/              # Data models and configurations
│   │   ├── gemma-2-2b.json       # Preprocessed Metric for Gemma 2 2b
│   │   └── metricOptions.ts      # 
│   ├── redux/             # Redux state management
│   │   ├── features/      # Redux feature slices
│   │   ├── hooks.ts       # Typed Redux hooks
│   │   ├── provider.tsx   # Redux provider wrapper
│   │   └── store.ts       # Store configuration
│   ├── types/             # TypeScript type definitions
│   │   ├── ...
│   └── utils/             # Utility functions and helpers
│       └── utils.tsx      # Common utility functions
├── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm

### Installation

1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
# or
pnpm build
pnpm start
```

## 📱 Display Requirements

> **⚠️ Important Note**: This application is currently optimized for **2K displays (2560×1440)** and may not render correctly on other screen resolutions.

**Recommended Setup:**
- **Resolution**: 2560×1440 (2K) or similar high-DPI displays
- **Browser**: Chrome, Firefox, or Safari with hardware acceleration enabled
- **Zoom Level**: 100% browser zoom for optimal layout

**Known Limitations:**
- Layout may appear cramped on 1080p displays
- Text and UI elements might be too small on 4K displays
- Mobile and tablet views are not currently supported
- Responsive design for various screen sizes is planned for future releases

---

For more information about the overall project, see the [main repository](../README.md).