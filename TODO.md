# Claude Code Chat Web App - Feature Implementation TODO

## High Priority (Mobile Essential)

### 1. ✅ Better Session Management
- [x] Session titles (auto-generated from first message)
- [x] Session list with preview
- [x] Load previous sessions
- [x] Delete sessions
- [x] Session metadata (date, message count, token usage)

## Medium Priority (Enhanced Mobile UX)

### 2. 🎯 Quick Actions & Gestures
- [ ] Swipe to delete messages
- [ ] Pull to refresh
- [ ] Long press for message options
- [ ] Quick action buttons (clear, new chat)
- [ ] Floating action button for new chat

### 3. 📝 Custom Prompts (Mobile Optimized)
- [ ] Quick prompt templates
- [ ] Save frequently used prompts
- [ ] Prompt shortcuts in keyboard area

### 4. 🔔 Mobile Notifications
- [ ] Permission request notifications
- [ ] Background task completion
- [ ] PWA push notifications

### 5. 🎨 Mobile UI Enhancements
- [ ] Improved touch targets
- [ ] Better loading states
- [ ] Skeleton screens
- [ ] Haptic feedback
- [ ] Pull-down settings drawer

### 6. 📸 Image Support
- [ ] Camera capture (mobile camera API)
- [ ] Photo library selection
- [ ] Paste image from clipboard
- [ ] Display images inline in chat
- [ ] Pinch to zoom images

### 7. 💾 Export Features
- [ ] Export conversation as markdown
- [ ] Share conversation (mobile share API)
- [ ] Copy entire conversation

## Low Priority (Nice to Have)

### 8. 🔌 Simplified MCP Management
- [ ] Enable/disable MCP servers
- [ ] Basic MCP server status

## Not Implementing (Desktop-Only Features)
- ❌ File path clicking (no file system access on mobile)
- ❌ Terminal integration
- ❌ Keyboard shortcuts (limited on mobile)
- ❌ Context menu integration
- ❌ Advanced diff visualization (too complex for mobile)
- ❌ Multi-pane layouts

## Implementation Notes
- Focus on touch-first interactions
- Optimize for one-handed use
- Keep UI simple and uncluttered
- Prioritize performance on low-end devices
- Test on various screen sizes (phones and tablets)