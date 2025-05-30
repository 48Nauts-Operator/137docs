import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Zap,
  FileText,
  User,
  Tag as TagIcon,
  Settings,
  TestTube
} from 'lucide-react';
import { useProcessingRules, useTenants, ProcessingRule } from '../services/api';

const ProcessingRulesPage: React.FC = () => {
  const { rules, loading, error, fetchRules, createRule, updateRule, deleteRule } = useProcessingRules();
  const { tenants } = useTenants();
  const [editingRule, setEditingRule] = useState<ProcessingRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ProcessingRule>>({
    name: '',
    description: '',
    vendor: '',
    preferred_tenant_id: undefined,
    conditions: [{ field: 'text', operator: 'contains', value: '' }],
    actions: [{ type: 'assign_tenant', value: '' }],
    priority: 0,
    enabled: true,
  });

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'not_contains', label: 'Does not contain' },
  ];

  const fields = [
    { value: 'text', label: 'Document Text' },
    { value: 'title', label: 'Title' },
    { value: 'sender', label: 'Sender' },
    { value: 'recipient', label: 'Recipient' },
    { value: 'document_type', label: 'Document Type' },
    { value: 'category', label: 'Category' },
    { value: 'filename', label: 'Filename' },
  ];

  const actionTypes = [
    { value: 'assign_tenant', label: 'Assign Tenant' },
    { value: 'set_category', label: 'Set Category' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'set_status', label: 'Set Status' },
    { value: 'set_document_type', label: 'Set Document Type' },
  ];

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.conditions || !newRule.actions) {
      alert('Please fill in all required fields');
      return;
    }

    const success = await createRule(newRule);
    if (success) {
      setIsCreating(false);
      setNewRule({
        name: '',
        description: '',
        vendor: '',
        preferred_tenant_id: undefined,
        conditions: [{ field: 'text', operator: 'contains', value: '' }],
        actions: [{ type: 'assign_tenant', value: '' }],
        priority: 0,
        enabled: true,
      });
    } else {
      alert('Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;

    const success = await updateRule(editingRule.id, editingRule);
    if (success) {
      setEditingRule(null);
    } else {
      alert('Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      const success = await deleteRule(id);
      if (!success) {
        alert('Failed to delete rule');
      }
    }
  };

  const addCondition = (rule: Partial<ProcessingRule>) => {
    const conditions = [...(rule.conditions || [])];
    conditions.push({ field: 'text', operator: 'contains', value: '' });
    return { ...rule, conditions };
  };

  const removeCondition = (rule: Partial<ProcessingRule>, index: number) => {
    const conditions = [...(rule.conditions || [])];
    conditions.splice(index, 1);
    return { ...rule, conditions };
  };

  const addAction = (rule: Partial<ProcessingRule>) => {
    const actions = [...(rule.actions || [])];
    actions.push({ type: 'assign_tenant', value: '' });
    return { ...rule, actions };
  };

  const removeAction = (rule: Partial<ProcessingRule>, index: number) => {
    const actions = [...(rule.actions || [])];
    actions.splice(index, 1);
    return { ...rule, actions };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading processing rules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            Process Rules
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate document classification, tagging, and tenant assignment
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Rules ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.vendor || <span className="text-gray-400">Any</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {rule.conditions.map((condition, idx) => (
                        <div key={idx} className="text-sm">
                          <Badge variant="outline">
                            {condition.field} {condition.operator} "{condition.value}"
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {rule.actions.map((action, idx) => (
                        <div key={idx} className="text-sm">
                          <Badge variant="secondary">
                            {action.type}: {action.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{rule.matches_count} matches</div>
                      {rule.last_matched_at && (
                        <div className="text-gray-500">
                          Last: {new Date(rule.last_matched_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-8 h-8 text-gray-400" />
                      <div className="text-gray-500">No processing rules configured</div>
                      <div className="text-sm text-gray-400">
                        Create your first rule to automate document processing
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Rule Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Create New Processing Rule</span>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rule Name *</label>
                  <Input
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Swisscom Invoice Processing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <Input
                    value={newRule.vendor || ''}
                    onChange={(e) => setNewRule({ ...newRule, vendor: e.target.value })}
                    placeholder="e.g., Swisscom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Optional description of what this rule does"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Input
                    type="number"
                    value={newRule.priority || 0}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Tenant</label>
                  <Select
                    value={newRule.preferred_tenant_id?.toString() || ''}
                    onValueChange={(value) => setNewRule({ ...newRule, preferred_tenant_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.alias}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium mb-2">Conditions *</label>
                <div className="space-y-2">
                  {newRule.conditions?.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[idx] = { ...condition, field: value };
                          setNewRule({ ...newRule, conditions });
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[idx] = { ...condition, operator: value };
                          setNewRule({ ...newRule, conditions });
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={condition.value}
                        onChange={(e) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[idx] = { ...condition, value: e.target.value };
                          setNewRule({ ...newRule, conditions });
                        }}
                        placeholder="Value to match"
                        className="flex-1"
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNewRule(removeCondition(newRule, idx))}
                        disabled={(newRule.conditions?.length || 0) <= 1}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewRule(addCondition(newRule))}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium mb-2">Actions *</label>
                <div className="space-y-2">
                  {newRule.actions?.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded">
                      <Select
                        value={action.type}
                        onValueChange={(value) => {
                          const actions = [...(newRule.actions || [])];
                          actions[idx] = { ...action, type: value };
                          setNewRule({ ...newRule, actions });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {action.type === 'assign_tenant' ? (
                        <Select
                          value={action.value}
                          onValueChange={(value) => {
                            const actions = [...(newRule.actions || [])];
                            actions[idx] = { ...action, value };
                            setNewRule({ ...newRule, actions });
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                {tenant.alias}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={action.value}
                          onChange={(e) => {
                            const actions = [...(newRule.actions || [])];
                            actions[idx] = { ...action, value: e.target.value };
                            setNewRule({ ...newRule, actions });
                          }}
                          placeholder="Action value"
                          className="flex-1"
                        />
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNewRule(removeAction(newRule, idx))}
                        disabled={(newRule.actions?.length || 0) <= 1}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewRule(addAction(newRule))}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Action
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={newRule.enabled || false}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                  />
                  <label htmlFor="enabled" className="text-sm">Enable this rule</label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRule}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProcessingRulesPage; 