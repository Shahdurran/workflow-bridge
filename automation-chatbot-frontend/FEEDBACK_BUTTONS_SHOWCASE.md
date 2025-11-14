# FeedbackButtons Component - Visual Showcase

## 🎨 Component States & Appearance

### State 1: Initial Display (Before Feedback)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Workflow JSON Display - Your existing component]             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Was this workflow helpful?  [👍 Yes]  [👎 No]  [📝 Report Issue] │
└────────────────────────────────────────────────────────────────┘
       ↑ Muted text             ↑ Outline buttons with icons
```

**Visual Details:**
- Text: `text-sm text-muted-foreground` (gray, subtle)
- Buttons: `variant="outline"` with `size="sm"`
- Icons: Lucide icons (ThumbsUp, ThumbsDown, MessageSquare)
- Spacing: `gap-4` between elements, `gap-2` between buttons
- Layout: Flex row, items centered

---

### State 2: After Thumbs Up (Success)

```
┌────────────────────────────────────────────────────────────────┐
│  👍 Thanks for your feedback! This helps us improve.            │
└────────────────────────────────────────────────────────────────┘
       ↑ Green text with check icon, fade-in animation
```

**Visual Details:**
- Color: `text-green-600 dark:text-green-400`
- Animation: `animate-in fade-in` (smooth fade)
- Duration: Shows for 3 seconds, then disappears
- Icon: ThumbsUp icon in green
- Font: `text-sm`

---

### State 3: After Thumbs Down (Feedback Form)

```
┌────────────────────────────────────────────────────────────────┐
│  What could we improve?                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Tell us what went wrong or what we could do better...   │ │
│  │                                                          │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Submit Feedback]  [Cancel]  [📝 Report Issue]                │
└────────────────────────────────────────────────────────────────┘
       ↑ Primary button   ↑ Outline   ↑ Ghost button
```

**Visual Details:**
- Header: `text-sm font-medium`
- Textarea: 3 rows, `resize-none`, full width
- Placeholder: Muted, helpful text
- Animation: `animate-in slide-in-from-top-2`
- Buttons:
  - Submit: Primary button with loading state
  - Cancel: Outline variant
  - Report Issue: Ghost variant with icon

---

### State 4: Selected Thumbs Up (Highlighted)

```
┌────────────────────────────────────────────────────────────────┐
│  Was this workflow helpful?  [👍 Yes]  [👎 No]  [📝 Report Issue] │
│                              ↑ Green bg                         │
└────────────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Selected button: `bg-green-500 hover:bg-green-600 text-white`
- Other buttons: Disabled, grayed out
- Transition: `transition-all` for smooth color change

---

### State 5: Selected Thumbs Down (Highlighted)

```
┌────────────────────────────────────────────────────────────────┐
│  Was this workflow helpful?  [👍 Yes]  [👎 No]  [📝 Report Issue] │
│                                       ↑ Red bg                  │
└────────────────────────────────────────────────────────────────┘
```

**Visual Details:**
- Selected button: `bg-red-500 hover:bg-red-600 text-white`
- Other buttons: Disabled, grayed out

---

## 🎭 Interaction Flow

### Flow 1: Quick Positive Feedback

```
1. User sees feedback buttons
   └─> Clicks [👍 Yes]
       └─> Button turns green
           └─> Shows "Thanks!" message (3 seconds)
               └─> Message fades away
                   └─> Feedback recorded in database
```

**User Experience:**
- **Time:** < 2 seconds
- **Clicks:** 1
- **Effort:** Minimal
- **Feedback:** Immediate visual confirmation

---

### Flow 2: Negative Feedback with Details

```
1. User sees feedback buttons
   └─> Clicks [👎 No]
       └─> Button turns red
           └─> Textarea slides in
               └─> User types feedback (optional)
                   └─> Clicks [Submit Feedback]
                       └─> Shows "Thank you" message
                           └─> Feedback recorded with text
```

**User Experience:**
- **Time:** ~30 seconds (if providing details)
- **Clicks:** 2
- **Effort:** Low (text is optional)
- **Feedback:** Helpful toast notification

---

### Flow 3: Report Detailed Issue

```
1. User sees feedback buttons
   └─> Clicks [📝 Report Issue]
       └─> Modal opens
           └─> Selects issue category
               └─> Writes detailed explanation
                   └─> Optionally uploads corrected JSON
                       └─> Clicks [Submit Report]
                           └─> Modal closes, toast confirms
                               └─> Detailed feedback recorded
```

**User Experience:**
- **Time:** 1-3 minutes (for detailed report)
- **Clicks:** 3-4
- **Effort:** Medium (for power users)
- **Feedback:** Modal provides structured input

---

## 🎨 Color Palette

### Light Mode

| Element | Color | Hex |
|---------|-------|-----|
| Text (muted) | Gray | `text-muted-foreground` |
| Success | Green | `#10b981` |
| Error/Negative | Red | `#ef4444` |
| Primary button | Blue | `hsl(var(--primary))` |
| Outline button | Gray border | `border-input` |
| Background | White | `bg-background` |

### Dark Mode

| Element | Color | Hex |
|---------|-------|-----|
| Text (muted) | Gray | `text-muted-foreground` |
| Success | Green | `#10b981` (adjusted) |
| Error/Negative | Red | `#ef4444` (adjusted) |
| Primary button | Blue | `hsl(var(--primary))` |
| Outline button | Gray border | `border-input` |
| Background | Dark | `bg-background` |

---

## 📐 Dimensions & Spacing

```
Container:
  - Display: flex
  - Flex direction: row
  - Align items: center
  - Gap between sections: 1rem (16px)

Buttons:
  - Size: sm (small)
  - Height: ~32px
  - Padding: 0.5rem 1rem
  - Gap between buttons: 0.5rem (8px)
  - Border radius: 0.375rem (6px)

Textarea (when shown):
  - Width: 100%
  - Rows: 3
  - Min height: ~80px
  - Padding: 0.5rem 0.75rem
  - Border radius: 0.375rem (6px)
```

---

## 🎬 Animations

### 1. Thank You Message
```css
animate-in fade-in
```
- Duration: ~300ms
- Easing: ease-in-out
- Effect: Smooth opacity transition from 0 to 1

### 2. Feedback Textarea
```css
animate-in slide-in-from-top-2
```
- Duration: ~200ms
- Easing: ease-out
- Effect: Slides down from above while fading in

### 3. Button State Change
```css
transition-all
```
- Duration: ~150ms
- Easing: ease-in-out
- Properties: background-color, color, border-color

---

## 💡 Usage Examples

### Basic Usage
```tsx
<FeedbackButtons
  interactionId="uuid-here"
  workflowData={workflow}
  platform="zapier"
/>
```

### With Callback
```tsx
<FeedbackButtons
  interactionId="uuid-here"
  workflowData={workflow}
  platform="zapier"
  onFeedbackSubmitted={() => {
    console.log('User provided feedback!');
    analytics.track('feedback_submitted');
  }}
/>
```

### Custom Styling
```tsx
<FeedbackButtons
  interactionId="uuid-here"
  workflowData={workflow}
  platform="zapier"
  className="my-6 p-4 bg-muted/30 rounded-lg border"
/>
```

### In a Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Generated Workflow</CardTitle>
  </CardHeader>
  <CardContent>
    <pre>{JSON.stringify(workflow, null, 2)}</pre>
  </CardContent>
  <CardFooter className="border-t pt-4">
    <FeedbackButtons
      interactionId={interactionId}
      workflowData={workflow}
      platform="zapier"
    />
  </CardFooter>
</Card>
```

---

## 🎯 Design Principles

### 1. **Low Friction**
- One click for positive feedback
- Optional details for negative feedback
- Never blocks the user

### 2. **Clear Communication**
- "Was this workflow helpful?" - Direct question
- "Thanks for your feedback!" - Positive reinforcement
- "What could we improve?" - Invites constructive input

### 3. **Visual Feedback**
- Immediate color change on click
- Loading states during submission
- Success/error toasts
- Disabled states prevent confusion

### 4. **Progressive Disclosure**
- Start simple (two buttons)
- Reveal details only when needed
- Keep advanced options separate (modal)

### 5. **Respectful**
- Never forces feedback
- Makes it easy to provide
- Thanks the user
- Doesn't interrupt workflow

---

## 🔧 Accessibility

### Keyboard Navigation
- ✅ All buttons keyboard accessible
- ✅ Tab order: Yes → No → Report Issue
- ✅ Enter/Space to activate
- ✅ Escape closes modal

### Screen Readers
- ✅ ARIA labels on buttons
- ✅ Role attributes where appropriate
- ✅ Status announcements for state changes

### Focus Management
- ✅ Visible focus indicators
- ✅ Focus trap in modal
- ✅ Focus returns after modal close

---

## 📱 Responsive Behavior

### Mobile (< 640px)
```
┌──────────────────────────┐
│ Was this helpful?         │
│ [👍 Yes] [👎 No]          │
│ [📝 Report Issue]         │
└──────────────────────────┘
   ↑ Buttons stack vertically
```

### Tablet (640px - 1024px)
```
┌────────────────────────────────┐
│ Was this workflow helpful?      │
│ [👍 Yes] [👎 No] [📝 Report]   │
└────────────────────────────────┘
   ↑ All in one row, compact
```

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────┐
│ Was this workflow helpful?  [👍 Yes] [👎 No] [📝 Report Issue] │
└─────────────────────────────────────────────────┘
   ↑ Full width, spacious layout
```

---

## 🎨 Visual States Summary

| State | Button Color | Action | Duration |
|-------|--------------|--------|----------|
| **Default** | Outline | Awaiting input | Permanent |
| **Hover** | Highlighted outline | Visual feedback | While hovering |
| **Selected (Yes)** | Green solid | Feedback submitted | Permanent |
| **Selected (No)** | Red solid | Shows textarea | Permanent |
| **Loading** | Disabled gray | Submitting | ~1-2 seconds |
| **Success** | Green text | Shows message | 3 seconds |
| **Disabled** | Gray, no hover | Cannot interact | While processing |

---

## 🎭 Edge Cases Handled

### 1. **Double Submission**
- ✅ Buttons disable after first click
- ✅ Loading state prevents spam
- ✅ State persists (can't change vote)

### 2. **Network Error**
- ✅ Shows error toast
- ✅ Buttons re-enable
- ✅ User can try again

### 3. **No Interaction ID**
- ✅ Component doesn't render
- ✅ Graceful fallback

### 4. **Large Feedback Text**
- ✅ Textarea auto-sizes
- ✅ No character limit
- ✅ Scrolls if needed

---

## ✨ Final Visual Example

### Complete Component in Context

```
┌──────────────────────────────────────────────────────────┐
│ Generated Workflow - Zapier                               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  {                                                        │
│    "name": "New Form to Email",                          │
│    "trigger": {                                          │
│      "app": "webhook",                                   │
│      "event": "new_submission"                           │
│    },                                                    │
│    "actions": [                                          │
│      {                                                   │
│        "app": "gmail",                                   │
│        "action": "send_email"                            │
│      }                                                   │
│    ]                                                     │
│  }                                                        │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  💡 Your feedback helps improve our AI! 👍👎            │
│                                                           │
│  Was this workflow helpful?                              │
│  [👍 Yes]  [👎 No]  [📝 Report Issue]                   │
└──────────────────────────────────────────────────────────┘
```

**This is what users see!** Clean, simple, and inviting. 🎉

---

## 🚀 Result

The **FeedbackButtons** component provides:
- ✅ **Beautiful** UI that fits your design system
- ✅ **Intuitive** interaction patterns
- ✅ **Smooth** animations and transitions
- ✅ **Accessible** for all users
- ✅ **Responsive** across all devices
- ✅ **Professional** feel with attention to detail

**Ready to collect valuable training data!** 📊

