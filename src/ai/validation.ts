import {
  DEFAULT_MARKDOWN_FLOW_RENDER_POLICY,
  isMarkdownFlowBlockType,
  type MarkdownFlowBlockType,
  type MarkdownFlowRenderPolicy,
} from "./protocol";

export type MarkdownFlowBlockValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export type MarkdownFlowValidationMode = "normalize" | "strict";

export interface MarkdownFlowBlockValidationOptions {
  /** Accept harmless, documented block-language aliases. Defaults to `normalize`. */
  normalization?: MarkdownFlowValidationMode;
}

export interface MarkdownFlowNormalizedBlock {
  language: MarkdownFlowBlockType;
  code: string;
  normalized: boolean;
}

type JsonRecord = Record<string, unknown>;

const structuredTypes = new Set<MarkdownFlowBlockType>([
  "callout", "metrics", "timeline", "steps", "comparison", "accordion", "tabs", "cards", "filetree", "progress", "checklist", "status", "quote",
]);

const chartTypes = new Set(["bar", "line", "pie", "area", "radar", "composed", "sparkline", "scatter", "funnel", "gauge", "heatmap", "waterfall", "cohort"]);
const tones = new Set(["note", "insight", "success", "warning"]);
const itemStatuses = new Set(["complete", "current", "upcoming", "blocked"]);
const languageAliases: Readonly<Record<string, MarkdownFlowBlockType>> = {
  mermaidjs: "mermaid",
  "mermaid-js": "mermaid",
};

function normalizeLanguage(language: string, options: MarkdownFlowBlockValidationOptions): MarkdownFlowBlockType | undefined {
  if (isMarkdownFlowBlockType(language)) return language;
  if (options.normalization === "strict") return undefined;

  const normalized = language.toLowerCase();
  return isMarkdownFlowBlockType(normalized) ? normalized : languageAliases[normalized];
}

function mergePolicy(policy?: MarkdownFlowRenderPolicy): Required<MarkdownFlowRenderPolicy> {
  return { ...DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, ...policy };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function renameKey(value: JsonRecord, from: string, to: string): boolean {
  if (!(from in value) || to in value) return false;
  value[to] = value[from];
  delete value[from];
  return true;
}

function normalizeStructuredConfig(type: MarkdownFlowBlockType, config: JsonRecord): boolean {
  let changed = false;
  if (["timeline", "steps", "accordion", "progress", "checklist", "status"].includes(type)) {
    for (const alias of ["milestones", "steps", "services", "tasks"]) changed = renameKey(config, alias, "items") || changed;
  }
  if (type === "filetree") changed = renameKey(config, "entries", "files") || changed;
  if (type === "quote") changed = renameKey(config, "text", "body") || changed;
  if ((type === "callout" || type === "quote") && "content" in config) changed = renameKey(config, "content", "body") || changed;

  if (Array.isArray(config.items)) {
    for (const item of config.items) {
      if (!isRecord(item)) continue;
      if (type !== "accordion") changed = renameKey(item, "content", "description") || changed;
      if (type === "checklist") changed = renameKey(item, "completed", "checked") || changed;
    }
  }
  return changed;
}

/**
 * Canonicalizes the documented, unambiguous LLM variations before validation
 * and rendering. It intentionally does not translate foreign chart schemas.
 */
export function normalizeMarkdownFlowBlock(
  language: string,
  code: string,
  options: MarkdownFlowBlockValidationOptions = {},
): MarkdownFlowNormalizedBlock | undefined {
  const normalizedLanguage = normalizeLanguage(language, options);
  if (!normalizedLanguage) return undefined;
  if (options.normalization === "strict" || normalizedLanguage === "mermaid") {
    return { language: normalizedLanguage, code, normalized: normalizedLanguage !== language };
  }

  let config: unknown;
  try {
    config = JSON.parse(code);
  } catch {
    return { language: normalizedLanguage, code, normalized: normalizedLanguage !== language };
  }
  if (!isRecord(config)) return { language: normalizedLanguage, code, normalized: normalizedLanguage !== language };

  let normalized = normalizedLanguage !== language;
  if (normalizedLanguage === "chart") {
    normalized = renameKey(config, "xAxis", "x") || normalized;
    normalized = renameKey(config, "yAxis", "y") || normalized;
  } else if (structuredTypes.has(normalizedLanguage)) {
    normalized = normalizeStructuredConfig(normalizedLanguage, config) || normalized;
  }
  return { language: normalizedLanguage, code: normalized ? JSON.stringify(config) : code, normalized };
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
  if (!["x", "y", "keys", "colors", "lines", "bars", "areas"].every((key) => config[key] === undefined || (key === "x" || key === "y" ? isString(config[key]) : Array.isArray(config[key]) && config[key].every(isString)))) return "Chart series properties must be strings or string arrays.";
  if (isDatasetChart) return null;
  if (config.type === "scatter" && (!isString(config.x) || !isString(config.y))) return 'Scatter charts require both numeric "x" and "y" fields.';

  const data = config.data as JsonRecord[];
  const xKey = (config.x as string | undefined) ?? "name";
  const seriesKeys = Array.isArray(config.keys) && config.keys.length ? config.keys as string[] : isString(config.y) ? [config.y] : ["value"];
  const fields = config.type === "composed"
    ? [...((config.bars as string[] | undefined) ?? []), ...((config.lines as string[] | undefined) ?? []), ...((config.areas as string[] | undefined) ?? [])]
    : seriesKeys;
  const numericFields = config.type === "scatter" ? [xKey, config.y as string] : fields.length ? fields : seriesKeys;
  const missingField = [xKey, ...numericFields].find((field) => data.some((row) => row[field] === undefined));
  if (missingField) return `Chart field "${missingField}" is missing from one or more data rows. Use an existing field name for "x", "y", or "keys".`;
  const nonNumeric = numericFields.find((field) => data.some((row) => typeof row[field] !== "number" || !Number.isFinite(row[field] as number)));
  if (nonNumeric) return `Chart series field "${nonNumeric}" must contain finite numeric values in every data row.`;
  return null;
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
  options: MarkdownFlowBlockValidationOptions = {},
): MarkdownFlowBlockValidationResult {
  const block = normalizeMarkdownFlowBlock(language, code, options);
  if (!block) return { valid: false, reason: `Unsupported AI block language "${language}". Use an enabled Markdown Flow block type.` };
  const { language: normalizedLanguage, code: normalizedCode } = block;
  const policy = mergePolicy(renderPolicy);
  if (!policy.allowedBlocks.includes(normalizedLanguage)) return { valid: false, reason: `The "${normalizedLanguage}" block type is disabled by this render policy.` };
  if (normalizedCode.length > policy.maxBlockCharacters) return { valid: false, reason: "This block exceeds the configured size limit." };
  if (normalizedLanguage === "mermaid") return normalizedCode.trim() ? { valid: true } : { valid: false, reason: "A Mermaid block cannot be empty. Put the diagram definition inside the fence." };

  let config: unknown;
  try {
    config = JSON.parse(normalizedCode);
  } catch (error) {
    const detail = error instanceof SyntaxError && error.message ? ` ${error.message}` : "";
    return { valid: false, reason: `AI blocks must contain valid JSON.${detail}` };
  }
  if (!isRecord(config)) return { valid: false, reason: "A block configuration must be a JSON object." };

  const reason = structuredTypes.has(normalizedLanguage)
    ? validateStructuredBlock(normalizedLanguage, config, policy)
    : normalizedLanguage === "chart"
      ? validateChart(config, policy)
      : validateMedia(normalizedLanguage, config, policy);

  return reason ? { valid: false, reason } : { valid: true };
}
