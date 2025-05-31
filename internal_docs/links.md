# 137Docs - External Links & Resources

**Version**: 0.92 - Document Processing Rule Engine  
**Last Updated**: May 30, 2025

## Repository & Source Code

- **GitHub Repository**: [137Docs DocAI-IMAGE](https://github.com/your-org/DocAI-IMAGE)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/DocAI-IMAGE/issues)
- **Releases**: [GitHub Releases](https://github.com/your-org/DocAI-IMAGE/releases)

## Documentation

### **Core Documentation**
- **Main README**: [`docs/README.md`](./README.md)
- **Architecture Overview**: [`docs/137docs_architecture.md`](./137docs_architecture.md)
- **Implementation Guide**: [`docs/implementation_guide.md`](./implementation_guide.md)
- **Sprint Plan**: [`docs/sprint-plan.md`](./sprint-plan.md)

### **Feature Documentation**
- **Rule Engine Concept**: [`docs/processing-rule-engine.md`](./processing-rule-engine.md) *(NEW)*
- **Vendor Analytics**: [`docs/vendor-analytics-feature.md`](./vendor-analytics-feature.md)
- **LLM Integration**: [`docs/llm-integration.md`](./llm-integration.md)
- **Multi-Tenant System**: [`docs/tenant-system.md`](./tenant-system.md)

### **Technical Documentation**
- **API Documentation**: Available at `/docs` when server is running
- **Database Schema**: [`docs/database-schema.md`](./database-schema.md)
- **Deployment Guide**: [`docs/deployment.md`](./deployment.md)

## Technology Stack

### **Backend Technologies**
- **FastAPI**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **SQLAlchemy**: [https://www.sqlalchemy.org/](https://www.sqlalchemy.org/)
- **Alembic**: [https://alembic.sqlalchemy.org/](https://alembic.sqlalchemy.org/)
- **Qdrant Vector DB**: [https://qdrant.tech/](https://qdrant.tech/)
- **Ollama**: [https://ollama.ai/](https://ollama.ai/)

### **Frontend Technologies**
- **React 18**: [https://react.dev/](https://react.dev/)
- **TypeScript**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **ShadCN/UI**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Recharts**: [https://recharts.org/](https://recharts.org/)

### **AI/ML Technologies**
- **ColPali**: [https://github.com/illuin-tech/colpali](https://github.com/illuin-tech/colpali)
- **OpenAI API**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic Claude**: [https://docs.anthropic.com/](https://docs.anthropic.com/)
- **LiteLLM**: [https://litellm.ai/](https://litellm.ai/)

## Development Resources

### **Python/FastAPI Resources**
- **FastAPI Tutorial**: [https://fastapi.tiangolo.com/tutorial/](https://fastapi.tiangolo.com/tutorial/)
- **SQLAlchemy 2.0 Tutorial**: [https://docs.sqlalchemy.org/en/20/tutorial/](https://docs.sqlalchemy.org/en/20/tutorial/)
- **Async SQLAlchemy**: [https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

### **React/TypeScript Resources**
- **React 18 Documentation**: [https://react.dev/learn](https://react.dev/learn)
- **TypeScript Handbook**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **ShadCN/UI Components**: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

### **Database & Infrastructure**
- **PostgreSQL Documentation**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **pgvector Extension**: [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- **Docker Compose**: [https://docs.docker.com/compose/](https://docs.docker.com/compose/)

## Demo & Live Examples

### **Demo Environment**
- **Live Demo**: [https://demo.137docs.com](https://demo.137docs.com) *(Coming Soon)*
- **API Documentation**: [https://demo.137docs.com/docs](https://demo.137docs.com/docs) *(Coming Soon)*

### **Sample Documents**
- **Test Dataset**: Available in `/sample-documents/` directory
- **Example Rules**: Pre-configured processing rules for common vendors
- **Demo Tenants**: Sample multi-tenant configurations

## Community & Support

### **Support Channels**
- **GitHub Discussions**: [https://github.com/your-org/DocAI-IMAGE/discussions](https://github.com/your-org/DocAI-IMAGE/discussions)
- **Issue Reports**: [https://github.com/your-org/DocAI-IMAGE/issues/new](https://github.com/your-org/DocAI-IMAGE/issues/new)
- **Feature Requests**: [https://github.com/your-org/DocAI-IMAGE/issues/new?template=feature_request.md](https://github.com/your-org/DocAI-IMAGE/issues/new?template=feature_request.md)

### **Contributing**
- **Contributing Guide**: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Code of Conduct**: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- **Development Setup**: [`docs/development-setup.md`](./development-setup.md)

## Release Information

### **Latest Release (v0.92)**
- **Release Date**: May 30, 2025
- **Major Features**: Document Processing Rule Engine, Real-time Monitoring
- **Download**: [GitHub Release v0.92](https://github.com/your-org/DocAI-IMAGE/releases/tag/v0.92)
- **Changelog**: [`CHANGELOG.md`](./CHANGELOG.md)

### **Previous Releases**
- **v0.91**: Vendor Analytics Feature (May 27, 2025)
- **v0.90**: LLM Integration & Multi-Provider Support (May 25, 2025)
- **v0.89**: Multi-Tenant System (May 22, 2025)

## Third-Party Integrations

### **Current Integrations**
- **Ollama**: Local LLM processing
- **OpenAI**: Cloud-based AI services
- **Anthropic**: Claude AI integration
- **Qdrant**: Vector database for semantic search

### **Planned Integrations**
- **Microsoft Azure**: OCR and AI services
- **AWS Textract**: Advanced document analysis
- **Google Cloud AI**: Document processing
- **Zapier**: Workflow automation

## Deployment Platforms

### **Supported Platforms**
- **Docker**: Containerized deployment
- **Docker Compose**: Local development
- **Kubernetes**: Production orchestration
- **AWS ECS**: Cloud container service
- **Digital Ocean**: Droplet deployment

### **Cloud Providers**
- **AWS**: EC2, RDS, S3 integration
- **Google Cloud**: Compute Engine, Cloud SQL
- **Microsoft Azure**: Virtual Machines, Azure SQL
- **Digital Ocean**: Droplets, Managed Databases

## Monitoring & Analytics

### **Application Monitoring**
- **Health Endpoints**: Built-in health checks at `/api/health`
- **Metrics Collection**: Performance and usage metrics
- **Error Tracking**: Comprehensive error logging
- **Rule Analytics**: Processing rule effectiveness tracking

### **Infrastructure Monitoring**
- **Database Monitoring**: PostgreSQL performance metrics
- **Container Monitoring**: Docker resource usage
- **API Monitoring**: FastAPI performance tracking
- **Vector DB Monitoring**: Qdrant search performance

## Security & Compliance

### **Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and viewer permissions
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries

### **Compliance Considerations**
- **GDPR**: Data protection and privacy controls
- **SOC 2**: Security framework compliance
- **ISO 27001**: Information security management
- **Data Retention**: Configurable retention policies

---

**For the most up-to-date links and resources, please refer to the official repository and documentation.** 📚🔗✨ 