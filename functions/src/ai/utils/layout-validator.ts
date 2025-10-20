/**
 * Layout validator utility
 *
 * Validates layout parameters before creation to prevent invalid layouts.
 * Provides clear error messages for common issues.
 */

/**
 * Form field configuration
 */
interface FormField {
  label: string;
  type: string;
}

/**
 * Navbar item configuration
 */
interface NavbarItem {
  label: string;
}

/**
 * Validate form layout parameters
 *
 * @param fields - Array of form field configurations
 * @throws Error if form layout is invalid
 */
export function validateFormLayout(fields: FormField[]): void {
  if (!Array.isArray(fields)) {
    throw new Error("Form fields must be an array");
  }

  if (fields.length === 0) {
    throw new Error("Form must have at least 1 field");
  }

  if (fields.length > 20) {
    throw new Error("Form cannot have more than 20 fields (requested: " + fields.length + ")");
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];

    if (!field.label || typeof field.label !== "string") {
      throw new Error(`Field ${i + 1} must have a label (string)`);
    }

    if (!field.type || typeof field.type !== "string") {
      throw new Error(`Field ${i + 1} must have a type (string)`);
    }

    const validTypes = ["text", "email", "password", "textarea", "number", "tel", "url"];
    if (!validTypes.includes(field.type)) {
      throw new Error(
        `Field ${i + 1} has invalid type: ${field.type}. Valid types: ${validTypes.join(", ")}`
      );
    }
  }
}

/**
 * Validate grid layout parameters
 *
 * @param rows - Number of rows in grid
 * @param cols - Number of columns in grid
 * @throws Error if grid layout is invalid
 */
export function validateGridLayout(rows: number, cols: number): void {
  if (typeof rows !== "number" || !Number.isFinite(rows)) {
    throw new Error("Grid rows must be a valid number (got: " + rows + ")");
  }

  if (typeof cols !== "number" || !Number.isFinite(cols)) {
    throw new Error("Grid columns must be a valid number (got: " + cols + ")");
  }

  if (rows < 1 || cols < 1) {
    throw new Error(`Grid must have at least 1 row and 1 column (got: ${rows}x${cols})`);
  }

  if (rows > 10 || cols > 10) {
    throw new Error(`Grid cannot exceed 10x10 (got: ${rows}x${cols})`);
  }

  if (rows * cols > 100) {
    throw new Error(
      `Grid cannot create more than 100 objects (${rows}x${cols} = ${rows * cols} objects)`
    );
  }
}

/**
 * Validate navbar layout parameters
 *
 * @param items - Array of navbar item configurations
 * @throws Error if navbar layout is invalid
 */
export function validateNavbarLayout(items: NavbarItem[]): void {
  if (!Array.isArray(items)) {
    throw new Error("Navbar items must be an array");
  }

  if (items.length === 0) {
    throw new Error("Navbar must have at least 1 item");
  }

  if (items.length > 10) {
    throw new Error("Navbar cannot have more than 10 items (requested: " + items.length + ")");
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.label || typeof item.label !== "string") {
      throw new Error(`Navbar item ${i + 1} must have a label (string)`);
    }
  }
}
