/**
 * Create Form Tool
 *
 * AI tool for creating pre-designed form layouts (login, signup, contact forms).
 * Automatically creates labels, input fields, and submit buttons with proper spacing.
 *
 * Use this tool when:
 * - "Create a login form"
 * - "Build a signup form with email and password"
 * - "Make a contact form with name, email, and message"
 *
 * Best Practice: Composite tool built on primitives (createText, createRectangle).
 * Returns grouped objects that can be modified with other tools.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import * as logger from "firebase-functions/logger";

/**
 * Schema for form creation parameters
 */
const CreateFormSchema = z.object({
  // Form type (pre-defined templates)
  type: z
    .enum(["login", "signup", "contact", "custom"])
    .default("login")
    .describe(
      "Form type: login (username/password), signup (email/password/confirm), contact (name/email/message), or custom"
    ),

  // Custom fields (for type='custom')
  fields: z
    .array(
      z.object({
        label: z.string().describe("Field label text"),
        placeholder: z.string().optional().describe("Input placeholder text"),
        type: z
          .enum(["text", "email", "password", "textarea"])
          .default("text")
          .describe("Input type"),
      })
    )
    .optional()
    .describe("Custom fields (only used when type='custom')"),

  // Positioning
  x: z
    .number()
    .optional()
    .describe("X position of form top-left (defaults to viewport center)"),
  y: z
    .number()
    .optional()
    .describe("Y position of form top-left (defaults to viewport center)"),

  // Styling
  labelColor: z.string().default("#1f2937").describe("Label text color"),
  inputFill: z.string().default("#ffffff").describe("Input field background color"),
  inputStroke: z.string().default("#d1d5db").describe("Input field border color"),
  buttonFill: z.string().default("#3b82f6").describe("Submit button color"),
  buttonText: z.string().default("Submit").describe("Submit button text"),

  // Dimensions
  inputWidth: z.number().default(300).describe("Input field width in pixels"),
  inputHeight: z.number().default(40).describe("Input field height in pixels"),
  spacing: z.number().default(20).describe("Vertical spacing between fields"),

  // Naming
  namePrefix: z
    .string()
    .optional()
    .describe("Prefix for object names (e.g., 'LoginForm')"),
});

/**
 * Tool for creating form layouts
 *
 * Examples:
 * - "Create a login form" → type='login'
 * - "Build a signup form" → type='signup'
 * - "Make a contact form" → type='contact'
 */
export class CreateFormTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createForm",
      "Create a complete form layout (login, signup, or contact form). " +
        "Automatically creates labels, input fields, and submit button with proper spacing. " +
        "Examples: 'create a login form', 'build a signup form', 'make a contact form'. " +
        "Returns a grouped set of objects that can be modified further.",
      CreateFormSchema,
      context
    );
  }

  /**
   * Execute form creation
   *
   * @param input - Form creation parameters
   * @returns Tool result with created object IDs
   */
  async execute(input: z.infer<typeof CreateFormSchema>): Promise<ToolResult> {
    try {
      // Determine form fields based on type
      let formFields: Array<{
        label: string;
        placeholder: string;
        type: "text" | "email" | "password" | "textarea";
      }>;

      switch (input.type) {
        case "login":
          formFields = [
            {label: "Username", placeholder: "Enter username", type: "text"},
            {label: "Password", placeholder: "Enter password", type: "password"},
          ];
          break;

        case "signup":
          formFields = [
            {label: "Email", placeholder: "Enter your email", type: "email"},
            {label: "Password", placeholder: "Create password", type: "password"},
            {
              label: "Confirm Password",
              placeholder: "Confirm password",
              type: "password",
            },
          ];
          break;

        case "contact":
          formFields = [
            {label: "Name", placeholder: "Your name", type: "text"},
            {label: "Email", placeholder: "Your email", type: "email"},
            {label: "Message", placeholder: "Your message", type: "textarea"},
          ];
          break;

        case "custom":
          if (!input.fields || input.fields.length === 0) {
            return {
              success: false,
              error: "Custom form type requires 'fields' parameter",
              message: "Please provide custom fields",
            };
          }
          formFields = input.fields.map((f) => ({
            label: f.label,
            placeholder: f.placeholder || f.label,
            type: f.type,
          }));
          break;
      }

      // Calculate positioning
      const startX =
        input.x ??
        (this.context.viewportBounds?.centerX ||
          this.context.canvasSize.width / 2) -
          input.inputWidth / 2;
      const startY =
        input.y ??
        (this.context.viewportBounds?.centerY ||
          this.context.canvasSize.height / 2) -
          ((formFields.length * (input.inputHeight + input.spacing + 25) + 60) / 2);

      let currentY = startY;
      const createdIds: string[] = [];
      const namePrefix = input.namePrefix || input.type.charAt(0).toUpperCase() + input.type.slice(1);

      logger.info("Creating form", {
        type: input.type,
        fieldCount: formFields.length,
        position: {x: startX, y: startY},
      });

      // Create each form field (label + input)
      for (let i = 0; i < formFields.length; i++) {
        const field = formFields[i];

        // Create label
        const labelId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "text",
          position: {x: startX, y: currentY},
          text: field.label,
          fontSize: 14,
          appearance: {fill: input.labelColor},
          name: `${namePrefix} Label - ${field.label}`,
          userId: this.context.userId,
        });
        createdIds.push(labelId);
        currentY += 20; // Label height + small gap

        // Create input field
        const inputHeight = field.type === "textarea" ? input.inputHeight * 2.5 : input.inputHeight;
        const inputId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {x: startX, y: currentY},
          dimensions: {width: input.inputWidth, height: inputHeight},
          appearance: {
            fill: input.inputFill,
            stroke: input.inputStroke,
            strokeWidth: 1,
          },
          name: `${namePrefix} Input - ${field.label}`,
          userId: this.context.userId,
        });
        createdIds.push(inputId);

        // Create placeholder text inside input
        const placeholderId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "text",
          position: {x: startX + 12, y: currentY + (inputHeight - 16) / 2},
          text: field.placeholder,
          fontSize: 14,
          appearance: {fill: "#9ca3af"}, // Gray placeholder color
          name: `${namePrefix} Placeholder - ${field.label}`,
          userId: this.context.userId,
        });
        createdIds.push(placeholderId);

        currentY += inputHeight + input.spacing;
      }

      // Create submit button
      currentY += 10; // Extra gap before button
      const buttonHeight = 45;

      const buttonId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: startX, y: currentY},
        dimensions: {width: input.inputWidth, height: buttonHeight},
        appearance: {
          fill: input.buttonFill,
          stroke: input.buttonFill,
          strokeWidth: 0,
        },
        name: `${namePrefix} Button`,
        userId: this.context.userId,
      });
      createdIds.push(buttonId);

      // Create button text
      const buttonTextId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {
          x: startX + input.inputWidth / 2 - (input.buttonText.length * 7) / 2,
          y: currentY + (buttonHeight - 18) / 2,
        },
        text: input.buttonText,
        fontSize: 16,
        appearance: {fill: "#ffffff"},
        name: `${namePrefix} Button Text`,
        userId: this.context.userId,
      });
      createdIds.push(buttonTextId);

      // Update context memory
      this.context.lastCreatedObjectIds = createdIds;

      const message = `Created ${input.type} form with ${formFields.length} fields at (${Math.round(startX)}, ${Math.round(startY)})`;

      return {
        success: true,
        message,
        objectsCreated: createdIds,
        data: {
          formType: input.type,
          fieldCount: formFields.length,
          objectCount: createdIds.length,
          position: {x: startX, y: startY},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create form",
      };
    }
  }
}
