# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chinese intelligent single-cell transcriptome analysis platform that integrates AI agents with local models. It's a **simplified full-stack Next.js application** that handles both frontend and backend functionality. The application supports natural language interaction for analyzing single-cell RNA sequencing data.

## Simplified Architecture

The system now uses a **simplified Next.js full-stack architecture** with direct Python subprocess calls:

### Frontend & Backend (Next.js Full-Stack)
- **Port**: 3000
- **Framework**: Next.js 15 with React 19
- **Architecture**: Single Next.js application handling both frontend and API routes
- **Key Components**:
  - `components/chat/UnifiedChat.js` - Main chat interface
  - `components/analysis/SingleCellAnalyzer.js` - Analysis control panel
  - `components/analysis/DeckGLScatterPlot.js` - Data visualization using DeckGL

### API Routes (Next.js API)
- `pages/api/chat-ollama.js` - Main chat API with dual modes:
  - **Chat Mode**: Direct Ollama communication for general conversation
  - **Analysis Mode**: Python subprocess execution for data analysis
- `pages/api/process-single-cell.js` - Direct Python subprocess for single-cell analysis
- `pages/api/convert-to-h5ad.js` - File format conversion
- `pages/api/health.js` - Health check endpoint

### External Services
- **Local AI Service** (Ollama on Port 11434)
  - **Model**: gemma3:4b
  - **Purpose**: Natural language understanding and generation
- **Python Analysis Scripts** (subprocess execution)
  - **Path**: `analysis_scripts/` and `chat_scripts/`
  - **Execution**: Direct subprocess calls from Next.js API routes

## Development Commands

### Starting the Application
**SIMPLIFIED SETUP**: Only two services needed:

```bash
# Terminal 1: Start Ollama service (for AI chat)
ollama serve

# Terminal 2: Start Next.js development server (handles everything else)
npm run dev
```

### Optional Python Services
The chat_scripts FastAPI service is optional and can be started separately if needed:

```bash
# Optional: Start Python FastAPI service
npm run chat-server-win  # Windows
# OR
npm run chat-server      # Unix/Mac
```

### Other Commands
```bash
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run health         # Check API health
npm run clean          # Clean temporary files
npm run setup          # Initialize environment
npm run fix-imports    # Fix import issues
npm run validate-config # Validate configuration
```

## Python Environment Setup

The Python service requires a conda environment:

```bash
# Create conda environment
conda create -n bio python=3.10
conda activate bio

# Install dependencies
cd chat_scripts
pip install -r requirements.txt

# Install Ollama model
ollama pull gemma3:4b
```

## Key Directories

```
gene_s/
├── chat_scripts/           # Independent Python FastAPI service
│   ├── main.py            # FastAPI server entry point
│   ├── agent_executor.py  # LangChain AI agent
│   ├── single_cell_processor.py # Core analysis engine
│   └── requirements.txt   # Python dependencies
├── components/            # React UI components
│   ├── chat/             # Chat interface components
│   ├── analysis/         # Analysis visualization components
│   └── layout/           # Layout components
├── pages/                # Next.js pages and API routes
│   ├── api/              # Next.js API endpoints
│   └── index.js          # Main application page
├── services/             # Node.js service layer
├── lib/                  # Utility libraries
├── styles/               # CSS and styling
└── tmp/                  # Temporary files (auto-cleaned)
```

## Data Flow

### Simplified Flow Architecture
1. **Chat Mode**: User input → Next.js API → Direct Ollama API call → Response
2. **Analysis Mode**: File upload + query → Next.js API → Python subprocess execution → Analysis results

### Key API Routes
- **`/api/chat-ollama`**: Main unified chat endpoint
  - Handles both chat and analysis modes
  - Uses `useWorkflow` parameter to determine mode
  - Direct subprocess calls to Python scripts for analysis
- **`/api/process-single-cell`**: Direct single-cell analysis
  - Subprocess execution of `analysis_scripts/single_cell_processor.py`
  - Handles H5AD, CSV, TSV file formats
- **`/api/convert-to-h5ad`**: File format conversion
- **`/api/health`**: Application health check

## File Formats Supported

- **H5AD**: AnnData format (preferred for single-cell data)
- **CSV/TSV**: Expression matrices (auto-converted to H5AD)

## Environment Variables

Create `.env.local` for configuration:

```bash
CHAT_SERVER_URL=http://localhost:8001
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma3:4b
ZHIPU_API_KEY=your_key_here  # Optional cloud API
```

## Testing the Application

1. **Health Check**: Visit `http://localhost:3000`
2. **Chat Test**: Turn OFF "使用工作流" → "你好，介绍一下单细胞测序" (Hello, introduce single-cell sequencing)
3. **Analysis Test**: Turn ON "使用工作流" → Upload H5AD file → "对这个数据进行 UMAP 降维分析" (Perform UMAP analysis on this data)

## Common Issues

- **ECONNREFUSED**: Ollama not running - start with `ollama serve`
- **File Upload Fails**: Check file size (<2GB) and format (H5AD/CSV/TSV)
- **Analysis Fails**: Check Python environment and dependencies installation
- **Chinese Text Issues**: System uses UTF-8 encoding and temporary files for proper handling

## Development Notes

- **Simplified Architecture**: Uses Next.js full-stack approach with direct Python subprocess calls
- **No Separate Backend**: All backend functionality handled through Next.js API routes
- **Dual Mode Operation**: Single chat API handles both conversation and analysis modes
- **Direct Integration**: Python scripts executed directly as subprocesses from Node.js
- **Chinese Text Handling**: Uses temporary file communication to avoid encoding issues
- **Local Processing**: All analysis performed locally for data privacy
- **Configuration Management**: Centralized config system in `config/index.js`
- **Error Handling**: Unified error handling across the application
- **Session Management**: In-memory session storage for chat history
- **File Management**: Automatic cleanup of temporary files after processing