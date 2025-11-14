# Automation Chatbot Frontend

A React/TypeScript frontend for the workflow automation chatbot application.

## Features

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety throughout the application
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful and accessible UI components
- **React Query**: Powerful data fetching and state management
- **React Flow**: Interactive workflow canvas
- **Wouter**: Lightweight routing

## Project Structure

```
automation-chatbot-frontend/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── main.tsx               # Application entry point
│   ├── index.css              # Global styles and Tailwind imports
│   ├── components/            # Reusable UI components
│   │   ├── chat/             # Chat interface components
│   │   ├── common/           # Common components (header, footer)
│   │   ├── layout/           # Layout components
│   │   ├── migration/        # Migration-related components
│   │   ├── templates/        # Template components
│   │   ├── ui/              # shadcn/ui components
│   │   └── workflow/        # Workflow canvas components
│   ├── data/                # Static data and mock data
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries and configurations
│   ├── pages/               # Page components
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── components.json         # shadcn/ui configuration
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
└── README.md            # This file
```

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. **Clone the repository and navigate to the frontend directory:**
   ```bash
   cd automation-chatbot-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and configure the API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

### Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **The application will be available at:**
   - Frontend: http://localhost:3000

3. **Build for production:**
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   # or
   yarn preview
   # or
   pnpm preview
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_DEV_MODE` | Enable development features | `true` |

## Key Components

### Chat Interface
- **ChatContainer**: Main chat interface with message history
- **InputField**: Message input with send functionality
- **MessageBubble**: Individual chat message display
- **QuickActions**: Predefined action buttons

### Workflow Canvas
- **WorkflowCanvas**: Interactive workflow builder using React Flow
- **WorkflowNode**: Individual workflow step components
- **PlatformSelector**: Switch between Zapier, Make, and n8n

### Templates
- **TemplateGrid**: Display available workflow templates
- **TemplateCard**: Individual template preview

### UI Components
Complete set of shadcn/ui components including:
- Forms, inputs, buttons
- Dialogs, modals, tooltips
- Navigation, tabs, accordions
- Data display components

## API Integration

The frontend communicates with the FastAPI backend through:

- **React Query**: For data fetching and caching
- **Custom API client**: Located in `src/lib/queryClient.ts`
- **Type-safe requests**: Using TypeScript interfaces in `src/types/api.ts`

### API Endpoints Used

- `GET /api/workflows` - Fetch all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/{id}` - Get specific workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `GET /api/templates` - Fetch workflow templates
- `GET /api/chat/{workflow_id}/messages` - Get chat messages
- `POST /api/chat/{workflow_id}/messages` - Send chat message

## Development

### Adding New Components

1. Create component files in appropriate directories under `src/components/`
2. Export from the component's index file if needed
3. Add TypeScript interfaces in `src/types/`
4. Use existing UI components from `src/components/ui/`

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the existing color scheme and spacing
- Use CSS variables defined in `src/index.css`
- Maintain responsive design principles

### State Management

- Use React Query for server state
- Use React hooks (useState, useEffect) for local state
- Pass props down for component communication
- Use context for deeply nested state if needed

## Building and Deployment

### Production Build

```bash
npm run build
```

This creates a `dist/` directory with optimized production files.

### Deployment Options

1. **Static Hosting** (Netlify, Vercel, GitHub Pages):
   - Deploy the `dist/` folder
   - Set environment variables in hosting platform

2. **Docker**:
   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **CDN/S3**:
   - Upload `dist/` contents to S3 bucket
   - Configure CloudFront distribution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
