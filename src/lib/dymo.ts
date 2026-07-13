/**
 * DYMO LabelWriter Service
 * 
 * This service wraps the DYMO Connect Framework JavaScript SDK.
 * The SDK needs to be downloaded from: https://github.com/dymosoftware/dymo-connect-framework
 * 
 * Installation:
 * 1. Download the DYMO Connect Framework from GitHub
 * 2. Place the dymo.label.framework.js file in public/dymo/
 * 3. Load the script in the admin page
 * 
 * Note: DYMO LabelWriter must be installed and connected to the computer
 */

export interface LabelTemplate {
  id: string;
  name: string;
  fields: LabelField[];
  layout: {
    width: number;
    height: number;
  };
}

export interface LabelField {
  id: string;
  type: 'text' | 'barcode' | 'qrcode';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: string;
  dataKey?: string;
}

export interface PrintLabelOptions {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  items: Array<{ name: string; quantity: number; sku?: string }>;
  template: LabelTemplate;
}

export interface PrintParams {
  printerName: string;
  copies?: number;
  jobTitle?: string;
}

export interface RenderParams {
  pngOutput?: boolean;
  leftMargin?: number;
  topMargin?: number;
  scale?: number;
}

/**
 * Check if DYMO framework is loaded
 */
export function isDymoFrameworkLoaded(): boolean {
  return typeof (window as any).dymo !== 'undefined' && 
         typeof (window as any).dymo.label !== 'undefined';
}

/**
 * Initialize DYMO Label Framework
 */
export async function initDymoFramework(): Promise<void> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    await (window as any).dymo.label.framework.init();
  } catch (error) {
    console.error('Failed to initialize DYMO framework:', error);
    throw new Error('Failed to initialize DYMO framework.');
  }
}

/**
 * Check if the environment meets DYMO requirements
 */
export async function checkDymoEnvironment(): Promise<boolean> {
  if (!isDymoFrameworkLoaded()) {
    return false;
  }

  try {
    const result = await (window as any).dymo.label.framework.checkEnvironment();
    return result === true;
  } catch (error) {
    console.error('Failed to check DYMO environment:', error);
    return false;
  }
}

/**
 * Get available DYMO printers
 */
export async function getPrinters(): Promise<string[]> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    const printers = await (window as any).dymo.label.framework.getPrinters();
    return printers.map((p: any) => p.name);
  } catch (error) {
    console.error('Failed to get DYMO printers:', error);
    throw new Error('Failed to get DYMO printers. Ensure DYMO LabelWriter is connected.');
  }
}

/**
 * Load label from file name and return label instance
 */
export async function openLabelFile(fileName: string): Promise<any> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    const label = await (window as any).dymo.label.framework.openLabelFile(fileName);
    return label;
  } catch (error) {
    console.error('Failed to open label file:', error);
    throw new Error(`Failed to open label file: ${fileName}`);
  }
}

/**
 * Load label from XML content and return label instance
 */
export async function openLabelXml(labelXml: string): Promise<any> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    const label = await (window as any).dymo.label.framework.openLabelXml(labelXml);
    return label;
  } catch (error) {
    console.error('Failed to open label XML:', error);
    throw new Error('Failed to open label XML.');
  }
}

/**
 * Validate if the current content is a valid label based on the current service installed
 */
export function isValidLabel(label: any): boolean {
  if (!label || typeof label.isValidLabel !== 'function') {
    return false;
  }

  try {
    return label.isValidLabel();
  } catch (error) {
    console.error('Failed to validate label:', error);
    return false;
  }
}

/**
 * Validate if the current content is a valid DYMO Connect label based on DYMO Connect service
 */
export function isDCDLabel(label: any): boolean {
  if (!label || typeof label.isDCDLabel !== 'function') {
    return false;
  }

  try {
    return label.isDCDLabel();
  } catch (error) {
    console.error('Failed to validate DCD label:', error);
    return false;
  }
}

/**
 * Validate if the current content is a valid DYMO Label Software label based on DYMO Label Software service
 */
export function isDLSLabel(label: any): boolean {
  if (!label || typeof label.isDLSLabel !== 'function') {
    return false;
  }

  try {
    return label.isDLSLabel();
  } catch (error) {
    console.error('Failed to validate DLS label:', error);
    return false;
  }
}

/**
 * Print label using DYMO LabelWriter (framework version)
 */
export async function printLabelFramework(
  printerName: string,
  printParamsXml: string,
  labelXml: string,
  labelSetXml?: string
): Promise<void> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    await (window as any).dymo.label.framework.printLabel(
      printerName,
      printParamsXml,
      labelXml,
      labelSetXml || ''
    );
  } catch (error) {
    console.error('Failed to print label:', error);
    throw new Error('Failed to print label. Check printer connection and try again.');
  }
}

/**
 * Get label preview image of the label
 */
export async function renderLabel(
  labelXml: string,
  renderParamsXml: string,
  printerName?: string
): Promise<string> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    const result = await (window as any).dymo.label.framework.renderLabel(
      labelXml,
      renderParamsXml,
      printerName || ''
    );
    return result;
  } catch (error) {
    console.error('Failed to render label:', error);
    throw new Error('Failed to render label preview.');
  }
}

/**
 * Print a label using DYMO LabelWriter (convenience function)
 */
export async function printLabel(options: PrintLabelOptions): Promise<void> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    // Get available printers
    const printers = await getPrinters();
    if (printers.length === 0) {
      throw new Error('No DYMO printers found. Ensure DYMO LabelWriter is connected.');
    }

    // Use the first available printer (or could be configured in settings)
    const printerName = printers[0];

    // Create label XML based on template
    const labelXml = generateLabelXml(options);

    // Open label
    const label = await openLabelXml(labelXml);

    // Validate label
    if (!isValidLabel(label)) {
      throw new Error('Invalid label format.');
    }

    // Set label data
    setLabelData(label, options);

    // Print label
    label.print(printerName);
  } catch (error) {
    console.error('Failed to print label:', error);
    throw new Error('Failed to print label. Check printer connection and try again.');
  }
}

/**
 * Generate DYMO label XML from template
 */
function generateLabelXml(options: PrintLabelOptions): string {
  const { template, orderId, customerName, address, suburb, state, postcode } = options;
  
  // Basic DYMO label XML structure
  // This is a simplified version - actual implementation depends on DYMO SDK specifics
  return `
    <DieCutLabel Version="8.0" Units="mm">
      <PaperOrientation>Landscape</PaperOrientation>
      <Id>Address</Id>
      <PaperName>30252 Address</PaperName>
      <DrawCommands>
        <RoundRectangle X="0" Y="0" Width="72" Height="252" CornerRadius="0" Filling="Empty" LineColor="Black" LineThickness="0" />
      </DrawCommands>
      <ObjectInfo>
        <TextObject>
          <Name>Text</Name>
          <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          <BackColor Alpha="0" Red="255" Green="255" Blue="255" />
          <LinkedObjectName></LinkedObjectName>
          <Rotation>Rotation0</Rotation>
          <IsMirrored>False</IsMirrored>
          <IsVariable>True</IsVariable>
          <GroupID>-1</GroupID>
          <IsContainedInObject>False</IsContainedInObject>
          <Placement>
            <PageNumber>1</PageNumber>
            <Top>${template.fields.find(f => f.dataKey === 'address')?.y || 10}</Top>
            <Left>${template.fields.find(f => f.dataKey === 'address')?.x || 5}</Left>
          </Placement>
          <Font>
            <FontFamily>Arial</FontFamily>
            <Size>${template.fields.find(f => f.dataKey === 'address')?.fontSize || 12}</Size>
            <Bold>${template.fields.find(f => f.dataKey === 'address')?.fontWeight === 'bold'}</Bold>
            <Italic>False</Italic>
            <Underline>False</Underline>
            <Strikeout>False</Strikeout>
          </Font>
          <CharacterSet>Default</CharacterSet>
          <Text>${customerName}\n${address}\n${suburb} ${state} ${postcode}</Text>
          <Name>Text</Name>
        </TextObject>
      </ObjectInfo>
    </DieCutLabel>
  `;
}

/**
 * Set label data based on template fields
 */
function setLabelData(label: any, options: PrintLabelOptions): void {
  const { template, orderId, customerName, customerEmail, customerPhone, address, suburb, state, postcode, items } = options;

  template.fields.forEach((field) => {
    let value = '';
    
    switch (field.dataKey) {
      case 'orderId':
        value = orderId;
        break;
      case 'customerName':
        value = customerName;
        break;
      case 'customerEmail':
        value = customerEmail;
        break;
      case 'customerPhone':
        value = customerPhone;
        break;
      case 'address':
        value = address;
        break;
      case 'suburb':
        value = suburb;
        break;
      case 'state':
        value = state;
        break;
      case 'postcode':
        value = postcode;
        break;
      case 'items':
        value = items.map(item => `${item.name} x${item.quantity}`).join('\n');
        break;
      default:
        value = '';
    }

    // Set the field value on the label
    // Implementation depends on DYMO SDK specifics
    if (label.setObjectText) {
      label.setObjectText(field.id, value);
    }
  });
}

/**
 * Load DYMO framework script dynamically
 */
export function loadDymoFramework(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDymoFrameworkLoaded()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = '/dymo/dymo-connect-framework-master/dymo.connect.framework.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load DYMO framework'));
    document.head.appendChild(script);
  });
}
