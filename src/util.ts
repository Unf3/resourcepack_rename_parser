import AdmZip from "adm-zip";
import { LangFile } from "./types.ts";

export async function extractZipToTemp(zipPath: string): Promise<string> {
  const tmpDir = await Deno.makeTempDir({ prefix: "rp_" });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tmpDir);
  return tmpDir;
}

export async function cleanupTemp(dir: string) {
  const isUnix = dir.startsWith("/tmp");
  const isWindows =
    dir.startsWith("C:\\Temp") || dir.startsWith(Deno.env.get("TEMP") || "");

  if (!isUnix && !isWindows) {
    throw new Deno.errors.PermissionDenied(
      "Directory must be a valid temp directory (e.g., '/tmp' on Unix or 'C:\\Temp' on Windows)"
    );
  }

  await Deno.remove(dir, { recursive: true }).catch(() => {});
}

export async function* emptyDirEntryIterable(): AsyncIterable<Deno.DirEntry> {}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export function createTranslator(langFile: LangFile) {
  const map = new Map<string, string>();

  for (const [key, value] of Object.entries(langFile)) {
    const parts = key.split(".");
    const type = parts[0];
    const name = parts[parts.length - 1];
    if (type === "item" || type === "block") {
      map.set(name, value);
    }
  }

  return function getTranslation(itemName: string): string {
    const name = itemName.replace(/\.json$/, "");
    return map.get(name) ?? name;
  };
}

export function addUniqueByKeys<T, K extends keyof T>(
  array: T[],
  newItem: T,
  keys: K[]
): boolean {
  const exists = array.some((item) =>
    keys.every((key) => item[key] === newItem[key])
  );

  if (!exists) {
    array.push(newItem);
    return true;
  } else {
    return false;
  }
}
