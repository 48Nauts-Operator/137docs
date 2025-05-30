# DocAI-IMAGE - Document Management System

**Version 0.92.0** - Document Processing Rule Engine  
*Advanced AI-Powered Document Management with Intelligent Automation*

## 🚀 Latest Features (v0.92.0)

### Document Processing Rule Engine
- **Visual Rule Builder**: Intuitive drag-and-drop interface for creating automation rules
- **Smart Automation**: Automated document classification, tenant assignment, and workflow processing
- **Real-time Processing Monitor**: Live dashboard showing document processing status
- **Priority-based Execution**: Rules execute in order of importance with comprehensive action support
- **Rule Analytics**: Track rule effectiveness and optimization opportunities

## Overview

DocAI-IMAGE is a comprehensive document management system that combines advanced AI capabilities with intelligent automation. The system provides seamless document processing, multi-tenant support, and powerful rule-based automation for enterprise-grade document workflows.

## 🎯 Core Features

### Document Management
- **Smart Upload & Processing**: Drag-and-drop upload with automatic OCR and AI analysis
- **Advanced Search**: Full-text search, semantic search, and vision-based document discovery
- **Document Classification**: AI-powered automatic categorization and tagging
- **Version Control**: Complete document history and change tracking

### AI & Automation
- **Multi-Provider AI Support**: Ollama (local), OpenAI, Anthropic, and LiteLLM integration
- **Privacy-First Processing**: Local AI processing with Ollama for sensitive documents
- **Rule-Based Automation**: Visual rule builder for complex document workflows
- **Intelligent Tenant Assignment**: Automatic document-to-tenant matching

### Analytics & Insights
- **Vendor Analytics**: Advanced vendor insights with missing invoice detection
- **Financial Analytics**: Comprehensive spending analysis and reporting
- **Processing Analytics**: Real-time monitoring of document processing workflows
- **Rule Performance**: Track automation effectiveness and optimization opportunities

### Multi-Tenant System
- **Complete Tenant Management**: Support for companies and individuals
- **Dynamic Context Switching**: Seamless switching between tenant contexts
- **Automated Assignment**: AI-powered tenant extraction and assignment
- **Tenant Analytics**: Per-tenant insights and reporting

## 🛠 Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Advanced ORM with async support
- **PostgreSQL/SQLite**: Flexible database support
- **Alembic**: Database migration management
- **Celery**: Distributed task processing

### Frontend
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and development server
- **React Query**: Efficient data fetching and caching

### AI & Processing
- **Ollama**: Local LLM processing
- **OpenAI/Anthropic**: Cloud AI providers
- **Tesseract**: OCR text extraction
- **ColPali**: Advanced document embeddings
- **PDF Processing**: Comprehensive PDF handling

## 📋 System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **RAM**: 8GB (16GB recommended)
- **Storage**: 10GB free space
- **Python**: 3.9+
- **Node.js**: 18+

### Recommended for AI Features
- **RAM**: 16GB+ for local AI processing
- **GPU**: NVIDIA GPU for accelerated processing (optional)
- **Storage**: SSD for better performance

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/docai-image.git
cd docai-image
```

### 2. Backend Setup
```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Initialize database
alembic upgrade head

# Create admin user
python create_admin.py
```

### 4. Frontend Setup
```bash
cd src/frontend
npm install
npm run build
```

### 5. Start Services
```bash
# Backend (from src/backend)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (from src/frontend)
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000/settings

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/docai

# AI Configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OLLAMA_BASE_URL=http://localhost:11434

# Storage
STORAGE_ROOT=/path/to/documents
INBOX_PATH=/path/to/inbox

# Security
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
```

### AI Provider Setup
1. **Ollama (Local)**: Install Ollama and pull models
2. **OpenAI**: Set API key in environment
3. **Anthropic**: Configure Claude API access
4. **LiteLLM**: Set up proxy configuration

## 📖 Documentation

### User Guides
- [Getting Started Guide](./getting-started.md)
- [User Manual](./user-manual.md)
- [Admin Guide](./admin-guide.md)

### Technical Documentation
- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)
- [Development Guide](./development.md)
- [Deployment Guide](./deployment.md)

### Feature Documentation
- [Rule Engine Guide](./processing-rule-engine.md)
- [AI Configuration](./ai-configuration.md)
- [Multi-Tenant Setup](./multi-tenant.md)
- [Analytics & Reporting](./analytics.md)

## 🔒 Security

- **Authentication**: JWT-based with role-based access control
- **Data Encryption**: End-to-end encryption for sensitive documents
- **Privacy**: Local AI processing option for sensitive data
- **Compliance**: GDPR, HIPAA compliance features
- **Audit Logging**: Comprehensive activity tracking

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.docai-image.com](https://docs.docai-image.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/docai-image/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/docai-image/discussions)
- **Email**: support@docai-image.com

## 🗺 Roadmap

### Upcoming Features
- **Workflow Builder**: Visual workflow designer
- **Advanced OCR**: Handwriting recognition
- **Mobile App**: Native mobile applications
- **Enterprise Integration**: SAP, Oracle, Salesforce connectors
- **Advanced Analytics**: Machine learning insights

### Version History
- **v0.92.0**: Document Processing Rule Engine
- **v0.91.0**: Vendor Analytics Feature
- **v0.90.0**: LLM Integration & Multi-Provider Support
- **v0.89.0**: Multi-Tenant System

---

**Built with ❤️ by the DocAI-IMAGE Team** 