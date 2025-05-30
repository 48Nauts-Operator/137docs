"""
DocAI-IMAGE Version Configuration
Contains version information and release notes for the application.
"""

__version__ = "0.92.0"
__release_date__ = "2025-05-30"
__release_name__ = "Document Processing Rule Engine"

VERSION_HISTORY = [
    {
        "version": "0.92.0",
        "date": "2025-05-30",
        "name": "Document Processing Rule Engine",
        "description": "Comprehensive rule-based document automation system",
        "features": [
            "Visual Rule Builder with drag-and-drop interface",
            "Smart Automation for document classification and tenant assignment",
            "Real-time Processing Monitor with live dashboard",
            "Priority-based Rule Execution with comprehensive action support",
            "Rule Analytics and usage statistics tracking",
            "Multi-condition rule evaluation with flexible operators",
            "Automated workflow processing based on document content",
            "Rule testing and validation capabilities"
        ],
        "changes": [
            "Added processing_rules table with 13-column schema",
            "Implemented RuleEvaluator for condition processing",
            "Created RuleActionExecutor for automated actions",
            "Built DocumentRuleProcessor for document workflow",
            "Added 8 comprehensive API endpoints for rule management",
            "Integrated rule engine with existing document pipeline",
            "Updated navigation with Processing submenu structure"
        ]
    },
    {
        "version": "0.91.0",
        "date": "2025-05-27",
        "name": "Vendor Analytics Feature",
        "description": "Advanced vendor analytics and missing invoice detection",
        "features": [
            "Dynamic Vendor Insights with one-click analytics",
            "AI-powered Missing Invoice Detection",
            "Vendor billing frequency analysis and categorization",
            "Interactive charts and spending analysis",
            "Anomaly detection for vendor patterns"
        ]
    },
    {
        "version": "0.90.0",
        "date": "2025-05-25", 
        "name": "LLM Integration & Multi-Provider Support",
        "description": "Comprehensive AI integration with multiple providers",
        "features": [
            "Multi-Provider AI Support (Ollama, OpenAI, Anthropic, LiteLLM)",
            "Privacy-first local processing with Ollama",
            "Automated Document Analysis with AI-powered extraction",
            "Complete AI Configuration UI with connection testing",
            "Real-time AI processing and content analysis"
        ]
    },
    {
        "version": "0.89.0",
        "date": "2025-05-22",
        "name": "Multi-Tenant System",
        "description": "Complete tenant management and document assignment",
        "features": [
            "Complete Tenant Management for companies and individuals",
            "AI Tenant Extraction with intelligent recipient detection",
            "Fuzzy search algorithms for tenant matching",
            "Seamless Context Switching with automatic document filtering",
            "Dynamic tenant switching and organization"
        ]
    }
]

def get_version():
    """Get the current version string."""
    return __version__

def get_release_info():
    """Get current release information."""
    return {
        "version": __version__,
        "date": __release_date__,
        "name": __release_name__
    }

def get_version_history():
    """Get complete version history."""
    return VERSION_HISTORY

def get_latest_features():
    """Get features from the latest release."""
    if VERSION_HISTORY:
        return VERSION_HISTORY[0].get("features", [])
    return []

def get_latest_changes():
    """Get technical changes from the latest release."""
    if VERSION_HISTORY:
        return VERSION_HISTORY[0].get("changes", [])
    return [] 