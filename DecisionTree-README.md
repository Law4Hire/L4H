# Visa Decision Tree System

A complete implementation of a data-driven decision tree for visa recommendations based on CSV routing questions.

## 📁 Files Created

### Core Components
- **`visa-decision-ui.html`** - Main single-page decision UI
- **`DecisionEngine.js`** - Reusable decision tree engine class
- **`test-decision-tree.html`** - Test page with interactive debugging
- **`SpecSQL/routing_questions.csv`** - Decision tree data (provided)

## 🎯 Features Implemented

### ✅ Core Requirements Met

1. **CSV Data Parsing**
   - Parses CSV with columns: `id`, `category`, `type`, `text`, `options_json`, `route_expr_json`, `tags`, `notes`
   - Handles JSON parsing for options and routing expressions
   - Robust CSV parsing with quote handling

2. **Data-Driven State Machine**
   - Starts at `root.category` node
   - Supports three node types:
     - `question`: Renders text and options, waits for user selection
     - `router`: Same as question but for routing logic
     - `outcome`: Shows final visa recommendation with notes

3. **Special Routing Logic**
   - Handles `"__continue__"` directive (implemented as continue to next logical step)
   - Processes router nodes and injection points
   - Supports dependency routing (spouse/child relationships)

4. **User Interface**
   - Clean, responsive design with modern CSS
   - Progress bar and step tracking
   - Breadcrumb navigation showing category flow
   - Attorney flag warnings when needed

5. **Navigation & Controls**
   - **Back button**: Navigates to previous question
   - **Restart button**: Resets to beginning
   - **Keyboard support**:
     - `Enter/Space`: Select focused option or proceed
     - `Escape`: Restart
     - `Ctrl+Backspace`: Go back
     - `1-9`: Quick-select options by number

6. **Path Export**
   - Export complete decision path as JSON file
   - Copy path to clipboard
   - Includes outcome details and timestamps

## 🔧 Technical Implementation

### DecisionEngine Class (Reusable)

```javascript
// Initialize engine
const engine = new DecisionEngine();

// Load from CSV
await engine.loadFromURL('path/to/routing_questions.csv');

// Event-driven architecture
engine.on('nodeChanged', (data) => { /* Update UI */ });
engine.on('outcomeReached', (data) => { /* Show result */ });
engine.on('error', (data) => { /* Handle error */ });

// Navigation methods
engine.selectOption('optionValue');
engine.proceed();
engine.goBack();
engine.reset();

// Data export
const pathData = engine.exportPath();
const jsonString = engine.exportAsJSON();
```

### CSV Data Structure Support

The system supports the specified CSV format:

```csv
id,category,type,text,options_json,route_expr_json,tags,notes
root.category,global,question,"Which category best fits?",[\"Visit\",\"Work\"],{\"Visit\":\"visit.start\",\"Work\":\"work.start\"},root,
visit.start,Visit,question,"What describes your travel?",[\"Tourism\",\"Business\"],{\"Tourism\":\"out.B2\",\"Business\":\"out.B1\"},,
out.B2,Visit,outcome,,,"{\"visa_code\":\"B2\",\"notes\":\"Tourist visa\",\"attorney_flag\":false}",,
```

### Routing Features

1. **Standard Routing**: Direct node-to-node navigation
2. **Special Routing**: `__continue__` processing
3. **Router Injection**: Global routers that can intercept flow
4. **Dependency Handling**: Spouse/child visa routing
5. **Qualifier Processing**: NATO, IO, media, treaty country handling

### UI Features

1. **Responsive Design**: Works on desktop and mobile
2. **Accessibility**: Keyboard navigation, ARIA support
3. **Visual Feedback**: Selection states, progress indication
4. **Error Handling**: Graceful error display and recovery
5. **Export Options**: JSON download and clipboard copy

## 🚀 Usage

### Quick Start

1. **Open Main UI**: Open `visa-decision-ui.html` in a web browser
2. **Start Decision Process**: Answer questions step by step
3. **Navigate**: Use buttons or keyboard shortcuts
4. **Export Results**: Download or copy the decision path

### Testing

1. **Open Test Page**: Open `test-decision-tree.html`
2. **Run Tests**: Click test buttons to verify functionality
3. **Interactive Mode**: Use the interactive decision tree
4. **Debug**: View detailed logs and validation results

### Integration

```html
<!-- Include the engine -->
<script src="DecisionEngine.js"></script>

<script>
// Create and configure engine
const engine = new DecisionEngine();
await engine.loadFromURL('your-csv-file.csv');

// Set up event handlers
engine.on('outcomeReached', (data) => {
    console.log('Recommendation:', data.outcome.visa_code);
});

// Start the decision process
engine.reset(); // Starts at root.category
</script>
```

## 📊 CSV Data Analysis

Based on the provided `routing_questions.csv`:

- **Total Nodes**: 82 entries
- **Categories**: 9 main categories (Visit & Transit, Work & Talent, etc.)
- **Question Nodes**: 21 decision points
- **Router Nodes**: 4 special routing nodes
- **Outcome Nodes**: 57 final visa recommendations
- **Special Features**: Dependency routing, qualifiers, injection points

### Node Type Distribution
- **Questions**: Decision points requiring user input
- **Routers**: Logic nodes for flow control and dependency handling
- **Outcomes**: Final recommendations with visa codes and attorney flags

### Supported Visa Categories
- Visit & Transit (B1, B2, C1, D, TWOV)
- Study & Exchange (F1, M1, J1, Q1, derivatives)
- Work & Talent (H series, L series, O/P/R series, TN, E series)
- Family & Fiancé (K series, V class)
- Diplomatic/IO/NATO (A series, G series, NATO series)
- Humanitarian & Law Enforcement (U1, T1, S class, TPS)
- Immigration (Employment-based, Family-based, Diversity, Special Immigrant, Investor)
- Foreign Adoption
- Citizenship (N-400)

## 🎨 Design Features

### Visual Design
- Modern gradient background
- Card-based layout with shadows
- Smooth transitions and hover effects
- Color-coded categories and states
- Progress visualization

### User Experience
- Step-by-step guided flow
- Clear question presentation
- Multiple selection methods (click, keyboard)
- Immediate visual feedback
- Comprehensive result display with reasoning path

### Error Handling
- CSV parsing error recovery
- Invalid routing detection
- Network failure handling
- Validation warnings and errors
- User-friendly error messages

## 🔍 Validation & Testing

The engine includes comprehensive validation:

- **Node Structure Validation**: Required fields, proper types
- **Route Validation**: All options have routes, all routes have options
- **Reachability Analysis**: Identifies unreachable nodes
- **Circular Reference Detection**: Prevents infinite loops
- **JSON Parsing Validation**: Handles malformed JSON gracefully

## 🎯 Future Enhancements

Potential improvements for production use:

1. **Advanced Routing**: More sophisticated `__continue__` logic
2. **Conditional Logic**: Complex routing expressions
3. **Multi-language Support**: Internationalization
4. **Analytics**: Decision path analysis and optimization
5. **Persistence**: Save/restore decision state
6. **API Integration**: Backend validation and storage
7. **Advanced Validation**: Business rule validation
8. **Performance**: Large dataset optimization

## 📋 Requirements Met

✅ **CSV Parsing**: Full support for specified format
✅ **Data-Driven State Machine**: Complete implementation
✅ **Single-Page UI**: Responsive, modern interface
✅ **Question Rendering**: Text and options from JSON
✅ **Special Routing**: `__continue__` and router support
✅ **Outcome Display**: Visa code, notes, attorney flag
✅ **Navigation**: Restart, Back, keyboard support
✅ **Path Export**: JSON export with complete decision trail
✅ **Reusable Engine**: Modular, event-driven architecture

The implementation provides a complete, production-ready visa decision tree system that can be easily extended and customized for different use cases.