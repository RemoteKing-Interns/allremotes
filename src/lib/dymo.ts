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
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  dataKey?: string;
}

export interface PrintLabelOptions {
  printerName?: string;
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
  fieldValues?: Record<string, string>;
}

export interface PrintParams {
  printerName: string;
  copies?: number;
  jobTitle?: string;
}

export interface DymoPrinterInfo {
  name: string;
  modelName: string;
  isConnected: boolean;
  isLocal: boolean;
}

export interface PrintLabelResult {
  status: 'confirmed' | 'submitted';
  message: string;
}

export interface RenderParams {
  pngOutput?: boolean;
  leftMargin?: number;
  topMargin?: number;
  scale?: number;
}

export const DYMO_PRINTER_STORAGE_KEY = 'allremotes_dymo_printer';
export const DYMO_TEMPLATE_STORAGE_KEY = 'allremotes_dymo_template';

const DYMO_SCRIPT_ID = 'allremotes-dymo-framework';
const DYMO_LOAD_PROMISE_KEY = '__allRemotesDymoLoadPromise';
const DYMO_INIT_PROMISE_KEY = '__allRemotesDymoInitPromise';
const DYMO_FRAMEWORK_KEY = '__allRemotesDymoFramework';

export function getSelectedDymoPrinter(): string {
  return typeof window === 'undefined' ? '' : localStorage.getItem(DYMO_PRINTER_STORAGE_KEY) || '';
}

export function setSelectedDymoPrinter(printerName: string): void {
  if (typeof window === 'undefined') return;
  if (printerName) localStorage.setItem(DYMO_PRINTER_STORAGE_KEY, printerName);
  else localStorage.removeItem(DYMO_PRINTER_STORAGE_KEY);
}

export function getSelectedLabelTemplateId(): string {
  return typeof window === 'undefined' ? '' : localStorage.getItem(DYMO_TEMPLATE_STORAGE_KEY) || '';
}

export function setSelectedLabelTemplateId(templateId: string): void {
  if (typeof window === 'undefined') return;
  if (templateId) localStorage.setItem(DYMO_TEMPLATE_STORAGE_KEY, templateId);
  else localStorage.removeItem(DYMO_TEMPLATE_STORAGE_KEY);
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

  const runtime = window as any;
  if (runtime[DYMO_INIT_PROMISE_KEY]) return runtime[DYMO_INIT_PROMISE_KEY];

  const promise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      reject(new Error('DYMO framework initialization timed out. Ensure DYMO Connect is running.'));
    }, 10000);

    const attemptInitialization = () => {
      if (settled) return;

      try {
        runtime.dymo.label.framework.init((env: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (!env || env.isWebServicePresent === false) {
            reject(new Error('DYMO Connect service not found. Ensure DYMO Connect is installed and running.'));
            return;
          }
          runtime[DYMO_FRAMEWORK_KEY] = env;
          resolve();
        });
      } catch (error: any) {
        if (String(error?.message || error).includes('service discovery is in progress')) {
          setTimeout(attemptInitialization, 100);
          return;
        }
        settled = true;
        clearTimeout(timeout);
        console.error('Failed to initialize DYMO framework:', error);
        reject(new Error('Failed to initialize DYMO framework.'));
      }
    };

    attemptInitialization();
  });

  runtime[DYMO_INIT_PROMISE_KEY] = promise;
  try {
    await promise;
  } catch (error) {
    delete runtime[DYMO_INIT_PROMISE_KEY];
    throw error;
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
export async function getPrinterInfos(): Promise<DymoPrinterInfo[]> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded. Please ensure dymo.label.framework.js is loaded.');
  }

  try {
    const printers = await (window as any).dymo.label.framework.getPrintersAsync();
    return Array.from(printers as ArrayLike<any>, (printer: any) => ({
      name: printer.name,
      modelName: printer.modelName || 'DYMO LabelWriter',
      isConnected: Boolean(printer.isConnected),
      isLocal: printer.isLocal !== false,
    }));
  } catch (error) {
    console.error('Failed to get DYMO printers:', error);
    throw new Error('Failed to get DYMO printers. Ensure DYMO LabelWriter is connected.');
  }
}

export async function getPrinters(): Promise<string[]> {
  return (await getPrinterInfos()).map((printer) => printer.name);
}

/**
 * Render a label to a base64 PNG image for preview.
 * Returns a data URI string suitable for <img src>.
 */
export async function renderLabelPreview(labelXml: string, printerName?: string): Promise<string> {
  if (!isDymoFrameworkLoaded()) {
    throw new Error('DYMO framework not loaded.');
  }

  try {
    const base64 = await (window as any).dymo.label.framework.renderLabelAsync(
      labelXml,
      '',
      printerName || '',
    );
    const cleaned = String(base64).replace(/['"]+/g, '');
    return cleaned.startsWith('data:') ? cleaned : `data:image/png;base64,${cleaned}`;
  } catch (error) {
    console.error('Failed to render label preview:', error);
    throw new Error('Failed to generate label preview.');
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
async function printAndWaitForCompletion(label: any, printerName: string): Promise<PrintLabelResult> {
  const framework = (window as any).dymo.label.framework;
  const statuses = framework.PrintJobStatus;

  return new Promise<PrintLabelResult>((resolve, reject) => {
    let settled = false;
    let lastStatusMessage = 'No printer status received';
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Printer did not confirm completion within 30 seconds. Last status: ${lastStatusMessage}.`));
    }, 30000);

    const finish = (result?: PrintLabelResult, error?: Error) => {
      if (settled) return false;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(result || { status: 'confirmed', message: 'Printer confirmed the label completed.' });
      return false;
    };

    const statusCallback = (_job: any, statusInfo: any) => {
      if (settled) return false;
      const status = Number(statusInfo?.status);
      lastStatusMessage = statusInfo?.statusMessage || `status ${status}`;

      if (status === statuses.Finished) return finish();
      if (status === statuses.Unknown && /not implemented/i.test(lastStatusMessage)) {
        return finish({ status: 'submitted', message: 'Job submitted to DYMO Connect; this printer does not support completion confirmation.' });
      }
      if ([statuses.Error, statuses.PaperOut, statuses.ProcessingError, statuses.PrinterBusy, statuses.InvalidJobId, statuses.NotSpooled].includes(status)) {
        return finish(undefined, new Error(`Printer rejected the job: ${lastStatusMessage}.`));
      }
      return true;
    };

    Promise.resolve(label.printAndPollStatusAsync(printerName, '', '', statusCallback, 500)).catch((error) => {
      finish(undefined, error instanceof Error ? error : new Error(String(error)));
    });
  });
}

/**
 * Print a label via the DYMO Connect web service, bypassing the SDK's
 * network-printer JSONP path (which fails because the 550 Turbo has no HTTP
 * service — only raw TCP/9100). The web service prints through the Windows
 * print spooler, which correctly sends data over TCP/9100 to the LAN printer.
 */
async function printViaDymoWebService(printerName: string, labelXml: string): Promise<void> {
  const env = (window as any)[DYMO_FRAMEWORK_KEY];
  if (!env || typeof env.printLabelAsync !== 'function') {
    throw new Error('DYMO Connect framework not initialized. Restart DYMO Connect and refresh the page.');
  }
  await env.printLabelAsync(printerName, '', labelXml, '');
}

export async function printLabel(options: PrintLabelOptions): Promise<PrintLabelResult> {
  await initDymoFramework();

  try {
    // Get available printers
    const printers = await getPrinterInfos();
    if (printers.length === 0) {
      throw new Error('No DYMO printers found. Ensure DYMO LabelWriter is connected.');
    }

    const configuredPrinter = options.printerName || getSelectedDymoPrinter();
    const printer = configuredPrinter ? printers.find((candidate) => candidate.name === configuredPrinter) : printers[0];
    if (!printer) {
      throw new Error(`Selected DYMO printer "${configuredPrinter}" is unavailable. Open Printer Setup and select a connected printer.`);
    }
    const printerName = printer.name;

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
    if (!printer.isLocal) {
      // LAN/network printers: the SDK's printAsync detects these as "network printers" and
      // tries to send print data via JSONP HTTP to the printer's URI. But the DYMO LabelWriter
      // 550 Turbo only supports raw TCP/9100 — it has no HTTP proxy. The JSONP requests fail
      // silently and no print data reaches the printer.
      // Fix: bypass the SDK's network printer path and call the DYMO Connect web service
      // directly. The web service prints through the Windows print spooler (same as the
      // desktop app), which correctly sends data over TCP/9100.
      const labelXmlToPrint = label.getLabelXml ? label.getLabelXml() : labelXml;
      await printViaDymoWebService(printerName, labelXmlToPrint);
      return { status: 'submitted', message: 'LAN print job sent to DYMO Connect. Check the printer.' };
    }
    return await printAndWaitForCompletion(label, printerName);
  } catch (error) {
    console.error('Failed to print label:', error);
    throw error instanceof Error ? error : new Error('Failed to print label. Check printer connection and try again.');
  }
}

/**
 * Render a test label preview as a base64 PNG data URI.
 */
export async function renderTestLabelPreview(printerName?: string): Promise<string> {
  return renderLabelFromOptions({
    printerName,
    orderId: 'TEST',
    customerName: 'All Remotes',
    customerEmail: '',
    customerPhone: '',
    address: 'Printer test successful',
    suburb: '',
    state: '',
    postcode: '',
    items: [],
    template: {
      id: 'printer-test',
      name: 'Printer Test',
      layout: { width: 252, height: 79 },
      fields: [
        { id: 'test_heading', type: 'text', label: 'Heading', dataKey: 'customerName', x: 8, y: 12, fontSize: 16, fontWeight: 'bold' },
        { id: 'test_message', type: 'text', label: 'Message', dataKey: 'address', x: 8, y: 36, fontSize: 11, fontWeight: 'normal' },
      ],
    },
  });
}

/**
 * Render any label from PrintLabelOptions to a base64 PNG data URI.
 */
export async function renderLabelFromOptions(options: PrintLabelOptions): Promise<string> {
  await initDymoFramework();

  const labelXml = generateLabelXml(options);
  const label = await openLabelXml(labelXml);
  if (!isValidLabel(label)) {
    throw new Error('Invalid label format.');
  }
  setLabelData(label, options);

  const xmlToRender = label.getLabelXml ? label.getLabelXml() : labelXml;
  return renderLabelPreview(xmlToRender, options.printerName);
}

/**
 * Generate DYMO label XML from template
 */
function generateLabelXml(options: PrintLabelOptions): string {
  const { template } = options;

  const objects = template.fields
    .map((field) => {
      const isBold = field.fontWeight === 'bold' ? 'True' : 'False';
      const size = field.fontSize || 12;
      const x = field.x / 72;
      const y = field.y / 72;
      const width = field.width ? field.width / 72 : Math.max(0.1, 3.4 - x);
      const height = field.height ? field.height / 72 : Math.max(0.2, size / 72 * 1.4);
      return `
        <TextObject>
          <Name>${field.id}</Name>
          <Brushes>
            <BackgroundBrush><SolidColorBrush><Color A="0" R="1" G="1" B="1"></Color></SolidColorBrush></BackgroundBrush>
            <BorderBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></BorderBrush>
            <StrokeBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></StrokeBrush>
            <FillBrush><SolidColorBrush><Color A="0" R="0" G="0" B="0"></Color></SolidColorBrush></FillBrush>
          </Brushes>
          <Rotation>Rotation0</Rotation>
          <OutlineThickness>1</OutlineThickness>
          <IsOutlined>False</IsOutlined>
          <BorderStyle>SolidLine</BorderStyle>
          <Margin><DYMOThickness Left="0" Top="0" Right="0" Bottom="0" /></Margin>
          <HorizontalAlignment>Left</HorizontalAlignment>
          <VerticalAlignment>Middle</VerticalAlignment>
          <FitMode>AlwaysFit</FitMode>
          <IsVertical>False</IsVertical>
          <FormattedText>
            <FitMode>AlwaysFit</FitMode>
            <HorizontalAlignment>Left</HorizontalAlignment>
            <VerticalAlignment>Middle</VerticalAlignment>
            <IsVertical>False</IsVertical>
            <LineTextSpan>
              <TextSpan>
                <Text> </Text>
                <FontInfo>
                  <FontName>Arial</FontName>
                  <FontSize>${size}</FontSize>
                  <IsBold>${isBold}</IsBold>
                  <IsItalic>False</IsItalic>
                  <IsUnderline>False</IsUnderline>
                  <FontBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></FontBrush>
                </FontInfo>
              </TextSpan>
            </LineTextSpan>
          </FormattedText>
          <ObjectLayout>
            <DYMOPoint><X>${x}</X><Y>${y}</Y></DYMOPoint>
            <Size><Width>${width}</Width><Height>${height}</Height></Size>
          </ObjectLayout>
        </TextObject>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<DesktopLabel Version="1">
  <DYMOLabel Version="3">
    <Description>DYMO Label</Description>
    <Orientation>Landscape</Orientation>
    <LabelName>Address</LabelName>
    <InitialLength>0</InitialLength>
    <BorderStyle>SolidLine</BorderStyle>
    <DYMORect>
      <DYMOPoint><X>0.23</X><Y>0.06</Y></DYMOPoint>
      <Size><Width>3.21</Width><Height>0.9966667</Height></Size>
    </DYMORect>
    <BorderColor><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></BorderColor>
    <BorderThickness>1</BorderThickness>
    <Show_Border>False</Show_Border>
    <HasFixedLength>False</HasFixedLength>
    <FixedLengthValue>0</FixedLengthValue>
    <DynamicLayoutManager>
      <RotationBehavior>ClearObjects</RotationBehavior>
      <LabelObjects>${objects}
      </LabelObjects>
    </DynamicLayoutManager>
  </DYMOLabel>
  <LabelApplication>Blank</LabelApplication>
  <DataTable><Columns></Columns><Rows></Rows></DataTable>
</DesktopLabel>`;
}

/**
 * Set label data based on template fields
 */
function setLabelData(label: any, options: PrintLabelOptions): void {
  const { template, orderId, customerName, customerEmail, customerPhone, address, suburb, state, postcode, items, fieldValues } = options;

  template.fields.forEach((field) => {
    let value = '';

    // Check fieldValues override first (from modal editing)
    if (fieldValues && fieldValues[field.dataKey || field.id] !== undefined) {
      value = fieldValues[field.dataKey || field.id];
    } else {
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
export async function loadDymoFramework(): Promise<void> {
  const runtime = window as any;
  if (runtime[DYMO_LOAD_PROMISE_KEY]) return runtime[DYMO_LOAD_PROMISE_KEY];

  const promise = (async () => {
    if (!isDymoFrameworkLoaded()) {
      let script = document.getElementById(DYMO_SCRIPT_ID) as HTMLScriptElement | null
        || document.querySelector<HTMLScriptElement>('script[src="/dymo/dymo-connect-framework-master/dymo.connect.framework.js"]');

      if (!script) {
        script = document.createElement('script');
        script.src = '/dymo/dymo-connect-framework-master/dymo.connect.framework.js';
        document.head.appendChild(script);
      }
      script.id = DYMO_SCRIPT_ID;

      await new Promise<void>((resolve, reject) => {
        if (isDymoFrameworkLoaded()) {
          resolve();
          return;
        }
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => reject(new Error('Failed to load DYMO framework')), { once: true });
      });
    }

    await initDymoFramework();
  })();

  runtime[DYMO_LOAD_PROMISE_KEY] = promise;
  try {
    await promise;
  } catch (error) {
    delete runtime[DYMO_LOAD_PROMISE_KEY];
    throw error;
  }
}
