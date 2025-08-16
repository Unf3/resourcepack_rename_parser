export type LangFile = Record<string, string>;

export enum Columns {
  PackName = "pack_name",
  ItemName = "item_name",
  CustomName = "custom_name",
  ModelPath = "model",
}

export type Config = {
  columns: Columns[];
  outputFileName: string;
  langFile: string;
  duplicateKeyFilter: (keyof Entry)[];
};

export type ModelNode = {
  type: string;
  model?: ModelNode;
  entries?: ModelNode[];
  on_true?: ModelNode;
  on_false?: ModelNode;
  cases?: Array<{ model?: ModelNode }>;
  fallback?: ModelNode;
  models?: ModelNode[];
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
};

export type Entry = {
  pack_name: string;
  item_name: string;
  custom_name: string;
  model: string;
};
