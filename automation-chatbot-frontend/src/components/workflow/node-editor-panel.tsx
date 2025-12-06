import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowNode } from '@/types/api';

interface NodeEditorPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export default function NodeEditorPanel({ node, onClose, onUpdate }: NodeEditorPanelProps) {
  const [editedNode, setEditedNode] = useState<WorkflowNode | null>(node);

  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  if (!editedNode) return null;

  const handleSave = () => {
    if (editedNode) {
      onUpdate(editedNode);
      onClose();
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-10 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Edit Node</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Node Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            editedNode.type === 'trigger' ? 'bg-green-100 text-green-800' :
            editedNode.type === 'action' ? 'bg-blue-100 text-blue-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {editedNode.type}
          </span>
          <span className="text-sm text-gray-500">{editedNode.app}</span>
        </div>

        {/* Node Name */}
        <div className="space-y-2">
          <Label htmlFor="node-name">Name</Label>
          <Input
            id="node-name"
            value={editedNode.action}
            onChange={(e) => setEditedNode({ ...editedNode, action: e.target.value })}
            placeholder="Node name"
          />
        </div>

        {/* Node ID */}
        <div className="space-y-2">
          <Label htmlFor="node-id">ID</Label>
          <Input
            id="node-id"
            value={editedNode.id}
            disabled
            className="bg-gray-50"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="node-notes">Notes</Label>
          <Textarea
            id="node-notes"
            value={editedNode.notes || ''}
            onChange={(e) => setEditedNode({ ...editedNode, notes: e.target.value })}
            placeholder="Add notes about this node..."
            rows={3}
          />
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="node-x" className="text-xs text-gray-500">X</Label>
              <Input
                id="node-x"
                type="number"
                value={Array.isArray(editedNode.position) ? editedNode.position[0] : editedNode.position.x}
                onChange={(e) => {
                  const newX = parseFloat(e.target.value);
                  if (Array.isArray(editedNode.position)) {
                    setEditedNode({ ...editedNode, position: [newX, editedNode.position[1]] });
                  } else {
                    setEditedNode({ ...editedNode, position: { ...editedNode.position, x: newX } });
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="node-y" className="text-xs text-gray-500">Y</Label>
              <Input
                id="node-y"
                type="number"
                value={Array.isArray(editedNode.position) ? editedNode.position[1] : editedNode.position.y}
                onChange={(e) => {
                  const newY = parseFloat(e.target.value);
                  if (Array.isArray(editedNode.position)) {
                    setEditedNode({ ...editedNode, position: [editedNode.position[0], newY] });
                  } else {
                    setEditedNode({ ...editedNode, position: { ...editedNode.position, y: newY } });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        {editedNode.parameters && Object.keys(editedNode.parameters).length > 0 && (
          <div className="space-y-2">
            <Label>Parameters</Label>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-40 overflow-auto">
              <pre>{JSON.stringify(editedNode.parameters, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <Label className="text-sm font-medium">Advanced Settings</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="node-disabled" className="text-sm font-normal">Disabled</Label>
            <input
              id="node-disabled"
              type="checkbox"
              checked={editedNode.disabled || false}
              onChange={(e) => setEditedNode({ ...editedNode, disabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="node-continue-on-fail" className="text-sm font-normal">Continue on Fail</Label>
            <input
              id="node-continue-on-fail"
              type="checkbox"
              checked={editedNode.continueOnFail || false}
              onChange={(e) => setEditedNode({ ...editedNode, continueOnFail: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="node-retry-on-fail" className="text-sm font-normal">Retry on Fail</Label>
            <input
              id="node-retry-on-fail"
              type="checkbox"
              checked={editedNode.retryOnFail || false}
              onChange={(e) => setEditedNode({ ...editedNode, retryOnFail: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1 bg-workflow-blue hover:bg-blue-700">
            Save Changes
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

