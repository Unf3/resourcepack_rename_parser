import * as path from "@std/path";
import * as logger from "@std/log";
import { JSONPath } from "jsonpath-plus";
import { stringify } from "@std/csv";
import {
  extractZipToTemp,
  cleanupTemp,
  pathExists,
  createTranslator,
  addUniqueByKeys,
  emptyDirEntryIterable,
} from "./util.ts";
import { getModelString } from "./model.ts";
import { loadConfig } from "./config.ts";
import { LangFile, Columns, Entry as RenameEntry } from "./types.ts";

const config = await loadConfig(path.join(Deno.cwd(), "config.json"));

const csvColumns: string[] = config.columns;
const entries: RenameEntry[] = [];

let resourcepacks: AsyncIterable<Deno.DirEntry>;
const inputDirPath = path.join(Deno.cwd(), "input");
if (await pathExists(inputDirPath)) {
  resourcepacks = Deno.readDir(path.join(Deno.cwd(), "input"));
} else {
  logger.warn("Input directory not found. Creating it...");
  Deno.mkdir(inputDirPath);
  resourcepacks = emptyDirEntryIterable();
}

const langFile: LangFile = (await JSON.parse(
  await Deno.readTextFile(
    path.join(Deno.cwd(), "assets", "lang", config.langFile)
  )
)) as LangFile;
const translate = createTranslator(langFile);

let rp_count = 0;
for await (const resourcepack of resourcepacks) {
  if (!resourcepack.isFile || !resourcepack.name.endsWith(".zip")) continue;
  logger.info("Processing: " + resourcepack.name);

  const tmpRpDir = await extractZipToTemp(
    path.join(Deno.cwd(), "input", resourcepack.name)
  );

  const itemDir = path.join(tmpRpDir, "assets", "minecraft", "items");
  if (!pathExists(itemDir)) {
    logger.warn(
      "assets/minecraft/items does not exist in resourcepack: ",
      resourcepack.name
    );
    continue;
  }
  for await (const item of Deno.readDir(itemDir)) {
    if (!item.isFile || !item.name.endsWith(".json")) continue;

    const filePath = path.join(itemDir, item.name);
    const data = JSON.parse(await Deno.readTextFile(filePath));

    const query = `$..cases[?(@parent.component=='custom_name')]`;
    const results = JSONPath({ path: query, json: data });

    const translation = translate(item.name);

    for (const node of results) {
      const names = Array.isArray(node.when)
        ? node.when
        : node.when != null
        ? [node.when]
        : [];

      for (const rename of names) {
        const model = getModelString(node.model ?? {});
        const entry: RenameEntry = {
          [Columns.PackName]: resourcepack?.name ?? "",
          [Columns.ItemName]: translation ?? "",
          [Columns.CustomName]: rename ? rename : "",
          [Columns.ModelPath]: model ? model : "",
        };

        addUniqueByKeys(entries, entry, config.duplicateKeyFilter);
      }
    }
  }
  cleanupTemp(tmpRpDir);
  rp_count++;
}

if (!rp_count) {
  logger.error(
    "0 Resourcepacks are found in input directory. Please add at least one"
  );
  Deno.exit(1);
}

const csvData: string = stringify(entries, {
  columns: csvColumns,
});

await Deno.writeTextFile(config.outputFileName, csvData);
logger.info(`✅ Results saved to ${config.outputFileName}`);
