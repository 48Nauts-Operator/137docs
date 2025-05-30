"""
Rule Engine for automated document processing and classification.

This module provides functionality to evaluate processing rules against documents
and execute actions when rules match.
"""
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repository import ProcessingRuleRepository
from app.models import Document

logger = logging.getLogger(__name__)


class RuleEvaluator:
    """Evaluates processing rules against documents."""
    
    def __init__(self):
        self.rule_repo = ProcessingRuleRepository()
    
    async def evaluate_document(self, db: AsyncSession, document: Document) -> List[Dict[str, Any]]:
        """
        Evaluate all enabled rules against a document and return matching actions.
        
        Args:
            db: Database session
            document: Document to evaluate
            
        Returns:
            List of actions to execute
        """
        logger.info(f"Evaluating rules for document {document.id}: {document.title}")
        
        # Get all enabled rules ordered by priority
        rules = await self.rule_repo.get_enabled_rules(db)
        
        matched_actions = []
        
        for rule in rules:
            try:
                if await self._evaluate_rule(document, rule):
                    logger.info(f"Rule '{rule['name']}' matched document {document.id}")
                    
                    # Increment match count
                    await self.rule_repo.increment_matches(db, rule['id'])
                    
                    # Add actions to execute
                    actions = rule.get('actions', [])
                    for action in actions:
                        action['rule_id'] = rule['id']
                        action['rule_name'] = rule['name']
                        matched_actions.append(action)
                    
                    # If this rule has high priority and matches, we might want to stop
                    # For now, continue evaluating all rules
                    
            except Exception as e:
                logger.error(f"Error evaluating rule {rule['id']}: {e}")
                continue
        
        logger.info(f"Found {len(matched_actions)} actions for document {document.id}")
        return matched_actions
    
    async def _evaluate_rule(self, document: Document, rule: Dict[str, Any]) -> bool:
        """
        Evaluate a single rule against a document.
        
        Args:
            document: Document to evaluate
            rule: Rule to evaluate
            
        Returns:
            True if rule matches, False otherwise
        """
        conditions = rule.get('conditions', [])
        
        if not conditions:
            return False
        
        # Check vendor match first (if specified)
        if rule.get('vendor') and document.sender:
            if not self._matches_vendor(document.sender, rule['vendor']):
                return False
        
        # Evaluate all conditions (AND logic)
        for condition in conditions:
            if not self._evaluate_condition(document, condition):
                return False
        
        return True
    
    def _matches_vendor(self, document_sender: str, rule_vendor: str) -> bool:
        """Check if document sender matches rule vendor."""
        if not document_sender or not rule_vendor:
            return False
        
        # Case-insensitive partial match
        return rule_vendor.lower() in document_sender.lower()
    
    def _evaluate_condition(self, document: Document, condition: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition against a document.
        
        Args:
            document: Document to evaluate
            condition: Condition to evaluate
            
        Returns:
            True if condition matches, False otherwise
        """
        field = condition.get('field')
        operator = condition.get('operator')
        value = condition.get('value')
        
        if not all([field, operator, value]):
            return False
        
        # Get document field value
        doc_value = self._get_document_field_value(document, field)
        
        if doc_value is None:
            return False
        
        # Convert to string for text operations
        doc_value_str = str(doc_value).lower()
        value_str = str(value).lower()
        
        # Evaluate based on operator
        if operator == 'equals':
            return doc_value_str == value_str
        elif operator == 'contains':
            return value_str in doc_value_str
        elif operator == 'starts_with':
            return doc_value_str.startswith(value_str)
        elif operator == 'ends_with':
            return doc_value_str.endswith(value_str)
        elif operator == 'not_equals':
            return doc_value_str != value_str
        elif operator == 'not_contains':
            return value_str not in doc_value_str
        else:
            logger.warning(f"Unknown operator: {operator}")
            return False
    
    def _get_document_field_value(self, document: Document, field: str) -> Any:
        """Get the value of a document field."""
        field_mapping = {
            'title': document.title,
            'content': document.content,
            'text': document.content,  # Alias for content
            'sender': document.sender,
            'recipient': document.recipient,
            'document_type': document.document_type,
            'category': document.category,
            'amount': document.amount,
            'currency': document.currency,
            'status': document.status,
            'filename': document.original_file_name,
            'file_path': document.file_path,
        }
        
        return field_mapping.get(field)


class RuleActionExecutor:
    """Executes actions from matched rules."""
    
    async def execute_actions(self, db: AsyncSession, document: Document, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute a list of actions on a document.
        
        Args:
            db: Database session
            document: Document to modify
            actions: List of actions to execute
            
        Returns:
            Summary of executed actions
        """
        logger.info(f"Executing {len(actions)} actions for document {document.id}")
        
        executed = []
        failed = []
        
        for action in actions:
            try:
                result = await self._execute_action(db, document, action)
                if result:
                    executed.append({
                        'action': action,
                        'result': result
                    })
                else:
                    failed.append({
                        'action': action,
                        'error': 'Action returned False'
                    })
            except Exception as e:
                logger.error(f"Failed to execute action {action}: {e}")
                failed.append({
                    'action': action,
                    'error': str(e)
                })
        
        return {
            'executed': executed,
            'failed': failed,
            'total': len(actions)
        }
    
    async def _execute_action(self, db: AsyncSession, document: Document, action: Dict[str, Any]) -> bool:
        """
        Execute a single action on a document.
        
        Args:
            db: Database session
            document: Document to modify
            action: Action to execute
            
        Returns:
            True if action was executed successfully
        """
        action_type = action.get('type')
        value = action.get('value')
        
        if not action_type:
            return False
        
        logger.info(f"Executing action {action_type} with value {value} on document {document.id}")
        
        if action_type == 'assign_tenant':
            return await self._assign_tenant(document, value)
        elif action_type == 'set_category':
            return await self._set_category(document, value)
        elif action_type == 'add_tag':
            return await self._add_tag(db, document, value)
        elif action_type == 'set_status':
            return await self._set_status(document, value)
        elif action_type == 'set_document_type':
            return await self._set_document_type(document, value)
        else:
            logger.warning(f"Unknown action type: {action_type}")
            return False
    
    async def _assign_tenant(self, document: Document, tenant_id: Any) -> bool:
        """Assign document to a tenant."""
        try:
            document.entity_id = int(tenant_id) if tenant_id else None
            logger.info(f"Assigned document {document.id} to tenant {tenant_id}")
            return True
        except (ValueError, TypeError):
            logger.error(f"Invalid tenant_id: {tenant_id}")
            return False
    
    async def _set_category(self, document: Document, category: str) -> bool:
        """Set document category."""
        if not category:
            return False
        
        document.category = str(category)
        logger.info(f"Set category '{category}' for document {document.id}")
        return True
    
    async def _add_tag(self, db: AsyncSession, document: Document, tag_name: str) -> bool:
        """Add tag to document."""
        if not tag_name:
            return False
        
        try:
            from app.repository import DocumentRepository
            doc_repo = DocumentRepository()
            result = await doc_repo.add_tag(db, document.id, str(tag_name))
            if result:
                logger.info(f"Added tag '{tag_name}' to document {document.id}")
            return result
        except Exception as e:
            logger.error(f"Failed to add tag '{tag_name}' to document {document.id}: {e}")
            return False
    
    async def _set_status(self, document: Document, status: str) -> bool:
        """Set document status."""
        if not status:
            return False
        
        document.status = str(status)
        logger.info(f"Set status '{status}' for document {document.id}")
        return True
    
    async def _set_document_type(self, document: Document, doc_type: str) -> bool:
        """Set document type."""
        if not doc_type:
            return False
        
        document.document_type = str(doc_type)
        logger.info(f"Set document_type '{doc_type}' for document {document.id}")
        return True


class DocumentRuleProcessor:
    """Main class for processing documents through the rule engine."""
    
    def __init__(self):
        self.evaluator = RuleEvaluator()
        self.executor = RuleActionExecutor()
    
    async def process_document(self, db: AsyncSession, document: Document) -> Dict[str, Any]:
        """
        Process a document through the rule engine.
        
        Args:
            db: Database session
            document: Document to process
            
        Returns:
            Processing results
        """
        logger.info(f"Processing document {document.id} through rule engine")
        
        try:
            # Evaluate rules to get matching actions
            actions = await self.evaluator.evaluate_document(db, document)
            
            if not actions:
                logger.info(f"No rules matched for document {document.id}")
                return {
                    'document_id': document.id,
                    'rules_matched': 0,
                    'actions_executed': 0,
                    'actions_failed': 0,
                    'results': []
                }
            
            # Execute actions
            execution_result = await self.executor.execute_actions(db, document, actions)
            
            # Commit changes
            await db.commit()
            
            return {
                'document_id': document.id,
                'rules_matched': len(set(action.get('rule_id') for action in actions)),
                'actions_executed': len(execution_result['executed']),
                'actions_failed': len(execution_result['failed']),
                'results': execution_result
            }
            
        except Exception as e:
            logger.error(f"Error processing document {document.id} through rule engine: {e}")
            await db.rollback()
            return {
                'document_id': document.id,
                'error': str(e),
                'rules_matched': 0,
                'actions_executed': 0,
                'actions_failed': 0,
                'results': []
            } 