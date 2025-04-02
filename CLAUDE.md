# AI Reader Browser Extension Guidelines

## Development Commands
- **Setup**: Copy `config.example.js` to `config.js` and add API keys (OpenAI, Exa, Perplexity)
- **Build**: No build required - works directly from source
- **Testing**: Load unpacked in Chrome (chrome://extensions → Load unpacked)
- **Debugging**: Chrome DevTools (F12) → inspect background/content scripts
- **Reload**: After changes, click "Reload" on chrome://extensions or press Ctrl+R in devtools
- **Testing Single Feature**: Add console logs and verify in DevTools Console panel
- **Manual Testing**: Test on varied websites (news, blogs, documentation) with different content types
- **Key Files**: Check `content.js` (UI), `APIClient.js` (external APIs), `PromptManager.js` (prompts)

## Code Style
- **Naming**: camelCase (variables/functions), PascalCase (classes/components)
- **Formatting**: 2-space indent, semicolons required, consistent braces
- **Imports**: Group by type (core, third-party, local) with blank line between
- **Error Handling**: try/catch with descriptive messages, log with console.error
- **Types**: Use JSDoc annotations (e.g. `@param {string} name`, `@returns {Promise<Object>}`)
- **Line Length**: Maximum 100 characters
- **Async**: Prefer async/await over Promise chains
- **Classes**: Export both class and singleton instance (e.g. `export default & export const instance`)
- **Caching**: Implement caching for API responses to improve performance
- **Modularity**: Create small, focused functions; avoid side effects

## Project Architecture
- **background.js**: Service worker for API requests and background processing
- **content.js**: DOM manipulation and primary user interface
- **components/modules/**: Core functionality (PromptManager, ButtonManager, APIClient)
- **State Management**: Use Chrome storage API for persistence
- **API Integration**: External APIs (OpenAI, Exa, Perplexity) via APIClient module
- **UI Components**: Use native DOM APIs with event-driven architecture
- **Responsive Design**: Support for both light/dark mode and different screen sizes
- **PDF Support**: Extension works with both web and local PDF documents:
  - Native Chrome PDF viewer support
  - PDF.js renderer detection and compatibility
  - Local PDFs via "Allow access to file URLs" setting
  - Adaptive layouts for PDF contexts