# 137Docs - AI-Powered Document Management System

**Version**: 0.91 - Vendor Analytics Feature  
**Status**: Production Ready  
**Last Updated**: May 27, 2025  

## Overview

137Docs is a comprehensive, AI-powered document management system designed for small teams and freelancers who need enterprise-grade document processing capabilities without the enterprise price tag. The system combines traditional document management with cutting-edge artificial intelligence to provide automated metadata extraction, intelligent tagging, and advanced document analysis. With the latest v0.91 release, we've added comprehensive **Vendor Analytics** capabilities that provide deep insights into vendor relationships and spending patterns.

## What 137Docs Does

### Core Functionality
- **Document Ingestion**: Drag-and-drop or automated folder watching for seamless document import
- **OCR Processing**: Automatic text extraction from PDFs and images using Tesseract/EasyOCR
- **AI-Powered Analysis**: Multi-provider LLM integration for intelligent document processing
- **Semantic Search**: Vector-based search capabilities using Qdrant and ColPali embeddings
- **Invoice Management**: Specialized handling for invoices with due date tracking and payment status
- **Calendar Integration**: ICS export for calendar applications with due date reminders
- **Analytics Dashboard**: Comprehensive insights into document types, financial data, and trends

### AI Capabilities (v0.90)
- **Multi-Provider Support**: Ollama (local), OpenAI, Anthropic, LiteLLM, and custom APIs
- **Automated Metadata Extraction**: AI extracts titles, dates, amounts, document types, and more
- **Intelligent Tagging**: Automatic tag suggestions and application based on document content
- **Document Analysis**: AI-powered summaries, key points, entity extraction, and sentiment analysis
- **Privacy-First Processing**: Local LLM option with Ollama keeps sensitive data on-premises
- **Configurable AI Behavior**: Fine-tune confidence thresholds, retry logic, and processing options

## How It Works

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   FastAPI        │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend        │◄──►│   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Controls   │    │   LLM Services   │    │   Vector Store  │
│   & Feedback    │    │   (Multi-Prov.)  │    │   (Qdrant)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Document Processing Pipeline
1. **Ingestion**: Documents dropped into inbox or uploaded via UI
2. **OCR**: Text extraction from PDFs and images
3. **AI Processing**: LLM analyzes content for metadata, tags, and insights
4. **Indexing**: Full-text and vector indexing for search
5. **Storage**: Organized storage with metadata in database
6. **Access**: Search, browse, and analyze through web interface

### AI Processing Workflow
1. **Configuration**: User configures LLM provider and models in Settings
2. **Document Upload**: New document triggers processing pipeline
3. **Metadata Extraction**: AI extracts structured data (title, date, amount, etc.)
4. **Tag Suggestion**: AI suggests relevant tags based on content
5. **Analysis**: AI provides summary, key points, entities, and sentiment
6. **User Review**: User can accept, modify, or reject AI suggestions
7. **Storage**: Final metadata and tags stored with document

## Key Benefits

### For Small Teams
- **Cost-Effective**: No per-user licensing or subscription fees
- **Self-Hosted**: Complete control over data and infrastructure
- **Scalable**: Grows with your document volume and team size
- **Integrated**: Single system for documents, invoices, and calendar

### For Privacy-Conscious Users
- **Local AI Processing**: Ollama option keeps data on-premises
- **No Data Sharing**: Documents never leave your infrastructure
- **Configurable Privacy**: Choose between local and cloud AI providers
- **Audit Trail**: Complete logging of AI operations and data access

### For Efficiency
- **Automated Processing**: Reduce manual data entry and tagging
- **Intelligent Search**: Find documents faster with AI-powered search
- **Proactive Reminders**: Never miss invoice due dates
- **Rich Analytics**: Understand document patterns and financial trends

## Technical Specifications

### System Requirements
- **Docker**: Docker Desktop or Docker Engine + Docker Compose
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB minimum for system, additional space for documents
- **Network**: Internet access for cloud AI providers (optional for local AI)

### Supported Formats
- **Documents**: PDF, DOCX, TXT, RTF
- **Images**: PNG, JPG, JPEG, TIFF, BMP
- **Archives**: ZIP (auto-extraction)

### AI Provider Options
- **Ollama (Local)**: Privacy-first, no internet required, free
- **OpenAI**: GPT models, requires API key and internet
- **Anthropic**: Claude models, requires API key and internet
- **LiteLLM**: Proxy for 100+ models, flexible configuration
- **Custom APIs**: Any OpenAI-compatible endpoint

### Performance Characteristics
- **Document Processing**: 1-5 seconds per document (depending on size and AI provider)
- **Search Response**: Sub-second for most queries
- **Concurrent Users**: Supports 10-50 concurrent users (hardware dependent)
- **Storage Efficiency**: Optimized document storage with deduplication

## Security & Compliance

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based permissions and authentication
- **Audit Logging**: Complete tracking of user actions and AI operations
- **Backup Support**: Automated database backups and document archiving

### Privacy Features
- **Local Processing**: Option to process documents entirely on-premises
- **No Telemetry**: No usage data sent to external services
- **Configurable Retention**: Control how long AI responses are cached
- **Data Ownership**: All documents and metadata remain under user control

## Use Cases

### Small Business Document Management
- Invoice processing and payment tracking
- Contract and agreement organization
- Compliance document archiving
- Financial record keeping

### Freelancer Operations
- Client document organization
- Project file management
- Invoice and payment tracking
- Tax document preparation

### Personal Document Organization
- Important document archiving
- Receipt and warranty management
- Medical record organization
- Legal document storage

## Getting Started

### Quick Start (5 minutes)
1. Clone the repository
2. Run `docker-compose up --build`
3. Access http://localhost:3303
4. Configure AI provider in Settings
5. Drop documents into inbox

### Production Deployment
1. Configure environment variables
2. Set up SSL/TLS certificates
3. Configure backup strategy
4. Set up monitoring and logging
5. Configure AI provider credentials

## Support & Resources

### Documentation
- **Installation Guide**: `docs/implementation-guide.md`
- **Architecture Overview**: `docs/137docs_architecture.md`
- **LLM Integration**: `docs/llm-integration-summary.md`
- **Testing Guide**: `docs/llm-integration-tests.md`

### Community
- **GitHub Repository**: Source code, issues, and discussions
- **Documentation**: Comprehensive guides and API reference
- **Examples**: Sample configurations and use cases

### Commercial Support
For enterprise deployments, custom integrations, or priority support, contact the 137Docs team for commercial licensing options.

---

**137Docs** - *Transforming document management with AI-powered intelligence*

*Built with ❤️ for teams who value privacy, efficiency, and intelligent automation* 

## Key Features

### 🎯 Vendor Analytics (NEW in v0.91)
- **One-Click Access**: Click any vendor name in invoices for instant analytics
- **Dynamic Charts**: Interactive donut and line charts for spending visualization
- **Missing Invoice Detection**: AI-powered pattern recognition identifies gaps
- **Frequency Analysis**: Automatic categorization of vendor billing patterns
- **Complete History**: All vendor invoices in searchable, sortable tables
- **Smart Insights**: Quarterly/Monthly pattern detection with proactive alerts

### 🤖 AI Integration (v0.90)
- **Multi-Provider Support**: Ollama (local), OpenAI, Anthropic, LiteLLM
- **Privacy-First**: Local processing option for sensitive documents
- **Automated Processing**: Extract metadata, suggest tags, analyze content
- **Real-Time Analysis**: AI action buttons with live status indicators
- **Comprehensive Testing**: 25+ integration tests with 95%+ coverage

### 📊 Core Functionality
- **Automated Ingestion**: Watches inbox folder for new documents
- **OCR Processing**: Configurable text extraction (Tesseract, Azure, AWS)
- **Smart Classification**: AI-powered document categorization
- **Full-Text Search**: PostgreSQL FTS with semantic reranking
- **Calendar Integration**: Due date tracking with ICS export
- **Analytics Dashboard**: Interactive charts and business intelligence

## Technical Architecture

### Backend
- **FastAPI**: Modern Python web framework with automatic API docs
- **PostgreSQL**: Robust database with pgvector for embeddings
- **SQLAlchemy**: ORM with Alembic migrations
- **AI Integration**: Multi-provider LLM support with fallback options
- **Docker**: Containerized deployment with docker-compose

### Frontend
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type-safe development with excellent IDE support
- **Tailwind CSS**: Utility-first styling with responsive design
- **Recharts**: Beautiful, interactive data visualizations
- **React Router**: Client-side routing with protected routes

### Data Processing
- **Watchdog**: File system monitoring for real-time ingestion
- **Pytesseract**: OCR processing with configurable backends
- **Vector Embeddings**: Semantic search with pgvector
- **Pattern Recognition**: AI-powered invoice frequency analysis

## Business Value

### Financial Intelligence
- **Spending Analysis**: Year-over-year vendor comparisons
- **VAT Tracking**: Complete tax amount analysis for compliance
- **Budget Planning**: Historical data for accurate forecasting
- **Compliance Monitoring**: Missing invoice alerts for audit readiness

### Operational Efficiency
- **Automated Processing**: Reduce manual document handling by 90%
- **Smart Search**: Find documents instantly with AI-powered search
- **Proactive Alerts**: Never miss payment deadlines again
- **Vendor Insights**: Make data-driven vendor relationship decisions

### Security & Privacy
- **Local Processing**: Keep sensitive data on-premises with Ollama
- **JWT Authentication**: Secure API access with role-based permissions
- **Audit Trail**: Complete tracking of all document operations
- **Data Encryption**: Secure storage of API keys and sensitive information

## Recent Achievements

### Version 0.91 (May 27, 2025)
- ✅ **Vendor Analytics Feature**: Complete implementation with charts and insights
- ✅ **Authentication Fix**: Resolved token key mismatch for seamless operation
- ✅ **Interactive Visualizations**: Beautiful Recharts integration
- ✅ **Pattern Recognition**: AI-powered frequency analysis and gap detection
- ✅ **Comprehensive Documentation**: Complete feature documentation and guides

### Version 0.90 (May 25, 2025)
- ✅ **LLM Integration**: Multi-provider AI support with local options
- ✅ **Settings UI**: Complete AI/LLM configuration interface
- ✅ **Document Analysis**: AI-powered content extraction and tagging
- ✅ **Testing Suite**: 25+ integration tests with comprehensive coverage

## Live Examples

### Hetzner Online GmbH Analytics
- **Total Spent**: €737.64 across 15 invoices
- **Pattern**: Quarterly billing frequency detected
- **Insights**: 7 recent invoices in last 12 months
- **Status**: ✅ Fully functional with complete history

### Visana Services AG Analytics
- **Total Spent**: CHF 2,262.35 across 8 invoices
- **Analysis**: Complete vendor relationship insights
- **Status**: ✅ All features working correctly

## Deployment

### Quick Start
```bash
git clone https://github.com/your-org/137docs
cd 137docs
docker-compose up -d
```

### Requirements
- **Docker & Docker Compose**: For containerized deployment
- **4GB RAM**: Minimum for AI processing
- **10GB Storage**: For document storage and database
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Documentation

- **Feature Guide**: `docs/vendor-analytics-feature.md`
- **Release Notes**: `docs/release-notes-v0.91.md`
- **Architecture**: `docs/137docs_architecture.md`
- **Implementation**: `docs/implementation_guide.md`
- **API Documentation**: Auto-generated Swagger docs at `/docs`

## Future Roadmap

### Planned Features
- **Export Functionality**: PDF/Excel export of vendor analytics
- **Comparison Mode**: Side-by-side vendor analysis
- **Predictive Analytics**: AI-powered spending forecasts
- **Mobile App**: Native mobile experience
- **Advanced Filtering**: Complex query capabilities

### Technical Enhancements
- **Real-Time Updates**: Live data refresh capabilities
- **Performance Optimization**: Enhanced query performance
- **API Extensions**: Additional analytics endpoints
- **Integration APIs**: Third-party system connections

---

**137Docs** - Transforming document management with AI-powered intelligence and comprehensive vendor analytics 📊 🚀 