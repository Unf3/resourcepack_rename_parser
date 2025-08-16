import * as path from "@std/path";
import { JSONPath } from "jsonpath-plus";
import { stringify } from "@std/csv";
import {
  extractZipToTemp,
  cleanupTemp,
  pathExists,
  createTranslator,
  addUniqueByKeys,
} from "./util.ts";
import { getModelString } from "./model.ts";
import { loadConfig } from "./config.ts";
import { LangFile, Columns, Entry as RenameEntry } from "./types.ts";

const config = await loadConfig(path.join(Deno.cwd(), "config.json"));

const csvColumns: string[] = config.columns;
const entries: RenameEntry[] = [];

const resourcepacks = Deno.readDir("./input");

const langFile: LangFile = (await JSON.parse(
  await Deno.readTextFile(
    path.join(Deno.cwd(), "assets", "lang", config.langFile)
  )
)) as LangFile;
const translate = createTranslator(langFile);

for await (const resourcepack of resourcepacks) {
  if (!resourcepack.isFile || !resourcepack.name.endsWith(".zip")) continue;
  console.log("Processing:", resourcepack.name);

  const tmpRpDir = await extractZipToTemp(
    path.join(Deno.cwd(), "input", resourcepack.name)
  );

  const itemDir = path.join(tmpRpDir, "assets", "minecraft", "items");
  if (!pathExists(itemDir)) {
    console.warn(
      "assets/minecraft/items does not exist in resourcepack: ",
      resourcepack.name
    );
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
}

const csvData: string = stringify(entries, {
  columns: csvColumns,
});

await Deno.writeTextFile(config.outputFileName, csvData);
console.log(`✅ Results saved to ${config.outputFileName}`);
