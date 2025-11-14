# N8n Workflow Visualization Guide

## Overview
The n8n chat now displays workflows visually using an interactive canvas instead of raw JSON text.

## Features

### ✅ Visual Node-Based Display
- Workflows are rendered as interactive node cards on a canvas
- Each node shows its type, name, and icon
- Nodes are automatically arranged in a logical flow

### ✅ Connection Lines
- SVG lines show data flow between nodes
- Curved connections with arrow markers
- Auto-routed for optimal layout

### ✅ Interactive Elements
- Click nodes to expand/collapse parameters
- Hover for visual feedback
- Color-coded by node type:
  - 🟢 Green: Triggers (Webhook, Schedule)
  - 🔴 Red: Email nodes (Gmail, etc.)
  - 🔵 Blue: Database nodes (Sheets, Postgres)
  - 🟣 Purple: Communication (Slack, Discord)
  - 🟠 Orange: HTTP requests

### ✅ Collapsible JSON Viewer
- JSON is hidden by default
- Click "View Workflow JSON" to expand
- Terminal-style code display
- For advanced users only

## How to Use

### Starting a Workflow Chat
1. Navigate to `/n8n-chat` or click "n8n Workflow Builder" from home
2. Type your automation request:
   - "Build me a workflow that monitors Gmail and writes to Google Sheets"
   - "Create an automation to post Slack messages when a webhook is triggered"
   - "Set up a scheduled task to backup data daily"

### Visual Display
The workflow will appear as:
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Gmail Trigger  │ ───> │  Process Data   │ ───> │  Google Sheets  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Interacting with Nodes
- **Expand Parameters**: Click the ↓ icon on nodes with parameters
- **View Details**: See configured parameters inline
- **Validate**: Check if workflow is valid before deployment
- **Deploy**: One-click deployment to your n8n instance

### Viewing JSON (Advanced)
1. Scroll to bottom of workflow preview
2. Click "View Workflow JSON" button
3. See raw JSON in terminal-style viewer
4. Copy for manual editing if needed

## Testing

### Sample Workflow Requests
Try these to see the visualization in action:

1. **Email to Sheets**
   ```
   "Create a workflow that saves Gmail emails to Google Sheets"
   ```

2. **Scheduled Slack Notification**
   ```
   "Build a daily Slack notification at 9am"
   ```

3. **Webhook to Database**
   ```
   "Process webhook data and store in PostgreSQL"
   ```

4. **HTTP Request Chain**
   ```
   "Fetch data from an API and transform it"
   ```

## Component Architecture

### N8nWorkflowCanvas
- Located: `src/components/workflow/N8nWorkflowCanvas.tsx`
- Features:
  - Auto-layout algorithm (topological sort)
  - SVG connection rendering
  - Icon mapping for 20+ node types
  - Expandable node parameters
  - Responsive canvas sizing

### WorkflowPreview
- Located: `src/components/workflow/WorkflowPreview.tsx`
- Features:
  - Canvas integration
  - Validation status display
  - Deployment controls
  - Collapsible JSON viewer
  - Download workflow option

### Integration
- Hooks: `useN8nChat` streams workflow data
- API: `/api/n8n/chat` endpoint sends SSE events
- Events: `workflow` event type triggers visual rendering

## Node Type Icons

| Node Type | Icon | Color |
|-----------|------|-------|
| Gmail, Email | 📧 Mail | Red |
| Google Sheets, DB | 🗄️ Database | Blue |
| Webhook, Trigger | 🔗 Webhook | Green |
| Schedule, Cron | ⏰ Clock | Green |
| Code, Function | 💻 Code | Gray |
| HTTP Request | 🌐 Globe | Orange |
| Slack, Discord | 📤 Send | Purple |
| Default | ⚡ Zap | Gray |

## Auto-Layout Algorithm

The canvas uses a topological sort to arrange nodes:
1. Identify source nodes (no dependencies)
2. Place in level 0
3. For each node, find dependent nodes
4. Place dependents in next level
5. Center each level horizontally
6. Draw connections between levels

## Best Practices

### For Users
- ✅ Be specific about apps and triggers
- ✅ Describe data flow clearly
- ✅ Ask to validate before deploying
- ✅ Use JSON view only when needed

### For Developers
- ✅ Keep canvas width/height responsive
- ✅ Add new node type icons as needed
- ✅ Test with complex workflows (10+ nodes)
- ✅ Ensure connections render correctly

## Troubleshooting

### Workflow Not Displaying
- Check console for errors
- Verify workflow has `nodes` array
- Ensure backend is sending `workflow` event

### Nodes Overlapping
- Increase spacing in `calculateNodePositions`
- Adjust `nodeWidth` and `horizontalGap` constants

### JSON Not Collapsing
- Check Collapsible component import
- Verify @radix-ui/react-collapsible is installed

### Icons Missing
- Add mapping in `getNodeIcon` function
- Ensure lucide-react icon is imported

## Future Enhancements

- [ ] Drag-and-drop node repositioning
- [ ] Zoom and pan controls
- [ ] Mini-map for large workflows
- [ ] Node search/filter
- [ ] Export as image
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Undo/redo for edits

## Testing Checklist

- ✅ Canvas renders with 1 node
- ✅ Canvas renders with 5+ nodes
- ✅ Connections draw correctly
- ✅ Nodes expandable/collapsible
- ✅ JSON viewer toggles
- ✅ Icons display for all node types
- ✅ Layout handles disconnected nodes
- ✅ Validation button works
- ✅ Deploy button works
- ✅ Download JSON works

## API Reference

### Workflow Data Structure
```typescript
{
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    parameters?: Record<string, any>;
    position?: [number, number];
  }>;
  connections?: {
    [sourceNode: string]: {
      [outputIndex: string]: Array<{
        node: string;
        type: string;
        index: number;
      }>;
    };
  };
}
```

### SSE Event Types
- `message`: Text chunk from Claude
- `tool_use`: MCP tool being called
- `tool_result`: Tool execution complete
- `workflow`: Workflow JSON detected
- `done`: Stream complete
- `error`: Error occurred

## Support

For issues or questions:
- Check console logs for errors
- Review backend logs for API issues
- Verify n8n-mcp server is running
- Check Claude AI API keys are configured

---

**Implementation Complete** ✅
- Visual canvas rendering
- Connection lines with SVG
- Interactive node expansion
- Collapsible JSON viewer
- Auto-layout algorithm
- Icon mapping for node types
- Integration with streaming chat

