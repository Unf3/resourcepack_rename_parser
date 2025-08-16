import { ModelNode } from "./types.ts";

export function getModelString(
  node: ModelNode | undefined,
  visited = new WeakSet<ModelNode>()
): string {
  if (!node || typeof node !== "object") return "";

  if (visited.has(node)) {
    console.warn("Recursive link in model: ", node);
    return "";
  }
  visited.add(node);

  if (node.model && typeof node.model === "object") {
    return getModelString(node.model, visited);
  }

  switch (node.type) {
    case "model":
      return typeof node.model === "string" ? node.model : "";

    case "range_dispatch":
      return node.entries?.[0] ? getModelString(node.entries[0], visited) : "";

    case "condition":
      if (node.on_true) return getModelString(node.on_true, visited);
      if (node.on_false) return getModelString(node.on_false, visited);
      return "";

    case "select":
      if (node.cases && node.cases.length) {
        const first = node.cases[0].model;
        return first ? getModelString(first, visited) : "";
      }
      return node.fallback ? getModelString(node.fallback, visited) : "";

    case "composite":
      return node.models?.[0] ? getModelString(node.models[0], visited) : "";

    default:
      console.warn("Unknown model type: ", node.type);
      return "";
  }
}
