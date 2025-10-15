# AI Canvas Agent

## Overview

The AI Canvas Agent allows you to create and manipulate canvas objects using natural language commands. Simply describe what you want to create or modify, and the AI will execute the operations for you in real-time.

## How to Use

1. **Access the AI Input**
   - Click the AI button (sparkle icon) in the toolbar
   - Or focus the AI input field at the bottom of the canvas

2. **Type Your Command**
   - Describe what you want to create or modify in natural language
   - Be as specific as possible for best results

3. **Execute**
   - Press Enter or click "Generate"
   - Watch as the AI creates or modifies objects in real-time

4. **Collaboration**
   - AI-created objects sync instantly to all collaborators
   - Works seamlessly with manual editing

## Example Commands

### Creating Objects

**Basic Shapes:**
```
Create a red rectangle at 100, 200
Add a blue circle in the center
Create a green square at 300, 400 with size 150
Draw a line from 0,0 to 200,200
```

**Text Objects:**
```
Create text that says "Hello World"
Add a heading that says "Welcome to CollabCanvas" at 100, 50
Create a label "Username" at 200, 300
```

**With Details:**
```
Create a large purple rectangle at 500, 200 with width 300 and height 200
Add a small red circle at the top-left corner with radius 25
```

### Manipulating Objects

**Moving:**
```
Move the blue square to 500, 300
Move the selected object to the center
Move "Header Text" to 100, 100
```

**Resizing:**
```
Make the circle twice as big
Resize the rectangle to 400x300
Make the selected shape 50% bigger
```

**Rotating:**
```
Rotate the text 45 degrees
Rotate the rectangle 90 degrees
Turn the selected object upside down
```

**Appearance:**
```
Change the rectangle color to green
Make the circle red with a blue border
Set the text color to #ff6600
Make the selected shape semi-transparent
```

### Layout & Arrangement

**Rows:**
```
Arrange these objects in a row
Create 5 blue squares in a row with 20px spacing
Line up the selected objects horizontally
```

**Columns:**
```
Stack them vertically with 20px spacing
Arrange in a column from top to bottom
Create a vertical list of text labels
```

**Grids:**
```
Create a 3x3 grid of circles
Arrange these 9 squares in a grid
Make a 2x4 grid with 30px spacing
```

### Complex Commands

**UI Components:**
```
Create a login form
Build a card with title, image placeholder, and description
Create a navigation bar with logo and menu items
Make a mobile app home screen
Create a dashboard with 4 metric cards in a 2x2 grid
```

**Workflows:**
```
Create a flowchart with 5 steps
Build a timeline with 3 events
Design a pricing comparison table
```

## Tips for Best Results

### Be Specific

**Good:**
```
Create a blue rectangle at 200, 300 with width 150 and height 100
```

**Less Specific:**
```
Create a shape
```

### Use Object References

**Good:**
```
Move the blue rectangle to the center
Change the color of "Header Text" to red
```

**Less Clear:**
```
Move it
Change the color
```

### Provide Concrete Values

**Good:**
```
Make the circle 200 pixels wide
Rotate the text exactly 90 degrees
```

**Vague:**
```
Make it bigger
Turn it a bit
```

### Work Incrementally

Instead of one huge command, break it down:

**Better:**
```
1. Create a blue rectangle at 100, 100
2. Add text "Title" centered in the rectangle
3. Make the rectangle 50% bigger
```

**Harder for AI:**
```
Create a blue rectangle at 100, 100 with centered text that says "Title" and make it bigger
```

## Limitations

### Rate Limits

- Maximum **10 commands per minute** per user
- Wait 60 seconds if you hit the limit
- Prevents accidental API cost overruns

### Command Length

- Commands limited to **500 characters**
- Break very long requests into multiple commands

### Object Count

- AI considers up to **100 objects** for context
- Prioritizes selected and visible objects
- Very large canvases may need more specific references

### Scope

The AI works best with:
- Vector shapes (rectangles, circles, text, lines)
- Layout and arrangement tasks
- Color and appearance modifications

The AI cannot currently:
- Manipulate raster images or photos
- Apply complex effects or filters
- Export or save files
- Access external resources

## Troubleshooting

### "Too many AI commands"

You've hit the rate limit. Wait 60 seconds before sending another command.

### "Object not found"

The AI couldn't find the object you referenced. Try:
- Using the object's name if it has one
- Being more specific (color, type, location)
- Selecting the object first, then using "selected" in your command

### "Permission denied"

You don't have edit access to this canvas. Contact the canvas owner.

### AI asks for clarification

The command was ambiguous. Provide the missing details:
- Which object? (if multiple match)
- What color? (if color not specified)
- What type of shape? (if type not specified)

### Command doesn't execute

- Check your internet connection
- Verify you're authenticated
- Try rephrasing the command
- Break complex commands into simpler steps

## Privacy & Costs

### What Gets Sent to AI

- Your natural language command
- Current canvas object data (positions, colors, types)
- Selected object IDs
- Canvas size

**Not sent:**
- Personal information
- Canvas names or metadata
- Other users' data
- Full canvas history

### AI Provider

- Commands processed by Claude 3.5 Haiku (Anthropic)
- Fast, cost-effective model optimized for tool use
- Alternative: OpenAI GPT-4o-mini (configurable)

### Cost Management

- Context optimized to minimize tokens
- Only relevant objects sent to AI
- Coordinates rounded to reduce precision overhead
- Analytics tracked for cost monitoring

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus AI input |
| `Enter` | Submit command |
| `Esc` | Cancel/blur input |

## Getting Help

### Examples Library

Check `_docs/examples/` for more command examples and use cases.

### Support

- Report issues on GitHub
- Check documentation for updates
- Contact support for permissions issues

## Future Enhancements

Coming soon:
- Voice input support
- Multi-turn conversations (remember context)
- Undo/redo AI actions separately
- AI suggestions based on your work
- Template library ("Create a [template name]")
- Image generation integration
- Code export (HTML/CSS/SVG)

---

**Happy Creating!** The AI Canvas Agent is here to accelerate your workflow and bring your ideas to life faster.
