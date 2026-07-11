import {
  DEFAULT_MARKDOWN_FLOW_RENDER_POLICY,
  isMarkdownFlowBlockType,
  type MarkdownFlowBlockType,
  type MarkdownFlowRenderPolicy,
} from "./protocol";

export type MarkdownFlowBlockValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

type JsonRecord = Record<string, unknown>;

const structuredTypes = new Set<MarkdownFlowBlockType>([
  "callout", "metrics", "timeline", "steps", "comparison", "accordion", "tabs", "cards", "filetree", "progress", "checklist", "status", "quote",
]);

const chartTypes = new Set(["bar", "line", "pie", "area", "radar", "composed", "sparkline", "scatter", "funnel", "gauge", "heatmap", "waterfall", "cohort"]);
const tones = new Set(["note", "insight", "success", "warning"]);
const itemStatuses = new Set(["complete", "current", "upcoming", "blocked"]);

function mergePolicy(policy?: MarkdownFlowRenderPolicy): Required<MarkdownFlowRenderPolicy> {
  return { ...DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, ...policy };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: JsonRecord, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function optionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function optionalNumber(value: unknown): boolean {
  return value === undefined || typeof value === "number";
}

function validateItems(items: unknown, policy: Required<MarkdownFlowRenderPolicy>): string | null {
  if (!Array.isArray(items) || items.length === 0 || items.length > policy.maxTableRows) return "Items must be a non-empty, bounded array.";

  const allowed = ["date", "title", "description", "status", "meta", "open", "content", "value", "total", "checked"];
  const valid = items.every((item) => isRecord(item)
    && hasOnlyKeys(item, allowed)
    && isString(item.title)
    && optionalString(item.date)
    && optionalString(item.description)
    && optionalString(item.meta)
    && optionalString(item.content)
    && optionalNumber(item.value)
    && optionalNumber(item.total)
    && (item.open === undefined || typeof item.open === "boolean")
    && (item.checked === undefined || typeof item.checked === "boolean")
    && (item.status === undefined || (isString(item.status) && itemStatuses.has(item.status))));

  return valid ? null : "Items contain unsupported or invalid values.";
}

function validateStructuredBlock(type: MarkdownFlowBlockType, config: JsonRecord, policy: Required<MarkdownFlowRenderPolicy>): string | null {
  const common = ["title", "tone", "body", "metrics", "items", "columns", "rows", "tabs", "cards", "files", "attribution", "role"];
  if (!hasOnlyKeys(config, common)) return "The block contains unsupported properties.";
  if (![config.title, config.body, config.attribution, config.role].every(optionalString)) return "Text properties must be strings.";
  if (config.tone !== undefined && (!isString(config.tone) || !tones.has(config.tone))) return "The block tone is not supported.";

  if (type === "callout") return config.title !== undefined || config.body !== undefined ? null : "A callout needs a title or body.";
  if (type === "quote") return isString(config.body) && config.body.length > 0 ? null : "A quote needs a body.";

  if (["timeline", "steps", "accordion", "progress", "checklist", "status"].includes(type)) return validateItems(config.items, policy);

  if (type === "metrics") {
    if (!Array.isArray(config.metrics) || config.metrics.length === 0 || config.metrics.length > policy.maxTableRows) return "Metrics must be a non-empty, bounded array.";
    return config.metrics.every((metric) => isRecord(metric)
      && hasOnlyKeys(metric, ["label", "value", "change", "detail"])
      && isString(metric.label)
      && isStringOrNumber(metric.value)
      && optionalString(metric.change)
      && optionalString(metric.detail)) ? null : "Metrics contain unsupported or invalid values.";
  }

  if (type === "comparison") {
    const columns = config.columns;
    if (!Array.isArray(columns) || !columns.length || columns.length > 12 || !columns.every(isString)) return "Comparison columns must be a bounded array of strings.";
    if (!Array.isArray(config.rows) || !config.rows.length || config.rows.length > policy.maxTableRows) return "Comparison rows must be a non-empty, bounded array.";
    return config.rows.every((row) => isRecord(row)
      && hasOnlyKeys(row, ["label", "values"])
      && isString(row.label)
      && Array.isArray(row.values)
      && row.values.length === columns.length
      && row.values.every((value) => isStringOrNumber(value) || typeof value === "boolean")) ? null : "Comparison rows contain unsupported or invalid values.";
  }

  if (type === "tabs") {
    if (!Array.isArray(config.tabs) || !config.tabs.length || config.tabs.length > 12) return "Tabs must be a non-empty, bounded array.";
    return config.tabs.every((tab) => isRecord(tab)
      && hasOnlyKeys(tab, ["label", "title", "content"])
      && isString(tab.label)
      && optionalString(tab.title)
      && isString(tab.content)) ? null : "Tabs contain unsupported or invalid values.";
  }

  if (type === "cards") {
    if (!Array.isArray(config.cards) || !config.cards.length || config.cards.length > policy.maxTableRows) return "Cards must be a non-empty, bounded array.";
    return config.cards.every((card) => isRecord(card)
      && hasOnlyKeys(card, ["title", "description", "meta", "eyebrow"])
      && isString(card.title)
      && optionalString(card.description)
      && optionalString(card.meta)
      && optionalString(card.eyebrow)) ? null : "Cards contain unsupported or invalid values.";
  }

  if (type === "filetree") {
    if (!Array.isArray(config.files) || !config.files.length || config.files.length > policy.maxTableRows) return "Files must be a non-empty, bounded array.";
    return config.files.every((file) => isRecord(file)
      && hasOnlyKeys(file, ["name", "type", "detail", "depth"])
      && isString(file.name)
      && (file.type === undefined || file.type === "file" || file.type === "folder")
      && optionalString(file.detail)
      && optionalNumber(file.depth)) ? null : "Files contain unsupported or invalid values.";
  }

  return "The block type is not supported.";
}

function validateChart(config: JsonRecord, policy: Required<MarkdownFlowRenderPolicy>): string | null {
  if (!hasOnlyKeys(config, ["type", "title", "data", "dataset", "x", "y", "keys", "colors", "lines", "bars", "areas", "max"])) return "The chart contains unsupported properties.";
  if (!isString(config.type) || !chartTypes.has(config.type)) return "The chart type is not supported.";
  const datasetId = config.dataset;
  const isDatasetChart = datasetId !== undefined;
  if (isDatasetChart && !isString(datasetId)) return "The dataset reference must be a string.";
  if (isDatasetChart && config.data !== undefined) return "A chart must use inline data or a dataset reference, not both.";
  if (!isDatasetChart && (!Array.isArray(config.data) || !config.data.length || config.data.length > policy.maxChartDataPoints || !config.data.every(isRecord))) return "Chart data must be a non-empty, bounded array of objects.";
  if (isDatasetChart) {
    const approvedDatasetId = datasetId as string;
    if (!policy.allowedDatasetIds.includes(approvedDatasetId)) return "This dataset is disabled by this render policy.";
    const requestedFields = [config.x, config.y, ...(Array.isArray(config.keys) ? config.keys : []), ...(Array.isArray(config.lines) ? config.lines : []), ...(Array.isArray(config.bars) ? config.bars : []), ...(Array.isArray(config.areas) ? config.areas : [])];
    if (!requestedFields.length || !requestedFields.every(isString)) return "A dataset chart needs approved visual fields.";
    const allowedFields = policy.allowedDatasetFields[approvedDatasetId];
    if (!allowedFields || requestedFields.some((field) => !allowedFields.includes(field))) return "The chart requests fields outside the approved dataset schema.";
  }
  if (![config.title].every(optionalString) || !optionalNumber(config.max)) return "Chart text and numeric properties are invalid.";
  return ["x", "y", "keys", "colors", "lines", "bars", "areas"].every((key) => config[key] === undefined || (key === "x" || key === "y" ? isString(config[key]) : Array.isArray(config[key]) && config[key].every(isString))) ? null : "Chart series properties must be string arrays.";
}

function validateMedia(type: MarkdownFlowBlockType, config: JsonRecord, policy: Required<MarkdownFlowRenderPolicy>): string | null {
  const usesUrls = (url: unknown) => isString(url) && /^https?:\/\//.test(url);

  if (type === "embed") {
    if (!policy.allowExternalUrls) return "External media is disabled by this render policy.";
    return hasOnlyKeys(config, ["title", "url", "kind", "description", "publisher"])
      && usesUrls(config.url)
      && [config.title, config.description, config.publisher].every(optionalString)
      && (config.kind === undefined || config.kind === "link" || config.kind === "video" || config.kind === "document") ? null : "The embed configuration is invalid.";
  }

  if (type === "image") {
    if (!policy.allowExternalUrls) return "External media is disabled by this render policy.";
    return hasOnlyKeys(config, ["title", "layout", "images"])
      && optionalString(config.title)
      && (config.layout === undefined || config.layout === "gallery" || config.layout === "before-after")
      && Array.isArray(config.images)
      && config.images.length > 0
      && config.images.length <= policy.maxTableRows
      && config.images.every((image) => isRecord(image)
        && hasOnlyKeys(image, ["src", "alt", "caption", "label"])
        && usesUrls(image.src)
        && [image.alt, image.caption, image.label].every(optionalString)) ? null : "The image configuration is invalid.";
  }

  return hasOnlyKeys(config, ["title", "locations"])
    && optionalString(config.title)
    && Array.isArray(config.locations)
    && config.locations.length > 0
    && config.locations.length <= policy.maxTableRows
    && config.locations.every((location) => isRecord(location)
      && hasOnlyKeys(location, ["name", "detail", "x", "y"])
      && isString(location.name)
      && optionalString(location.detail)
      && typeof location.x === "number"
      && typeof location.y === "number") ? null : "The map configuration is invalid.";
}

/** Validates LLM-facing blocks before they reach an interactive renderer. */
export function validateMarkdownFlowBlock(
  language: string,
  code: string,
  renderPolicy?: MarkdownFlowRenderPolicy,
): MarkdownFlowBlockValidationResult {
  if (!isMarkdownFlowBlockType(language)) return { valid: false, reason: "This block type is not part of the Markdown Flow protocol." };
  const policy = mergePolicy(renderPolicy);
  if (!policy.allowedBlocks.includes(language)) return { valid: false, reason: "This block type is disabled by this render policy." };
  if (code.length > policy.maxBlockCharacters) return { valid: false, reason: "This block exceeds the configured size limit." };
  if (language === "mermaid") return code.trim() ? { valid: true } : { valid: false, reason: "A Mermaid block cannot be empty." };

  let config: unknown;
  try {
    config = JSON.parse(code);
  } catch {
    return { valid: false, reason: "AI blocks must contain valid JSON." };
  }
  if (!isRecord(config)) return { valid: false, reason: "A block configuration must be a JSON object." };

  const reason = structuredTypes.has(language)
    ? validateStructuredBlock(language, config, policy)
    : language === "chart"
      ? validateChart(config, policy)
      : validateMedia(language, config, policy);

  return reason ? { valid: false, reason } : { valid: true };
}
