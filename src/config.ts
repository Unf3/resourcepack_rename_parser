import { Columns, Config } from "./types.ts";

export async function loadConfig(configPath: string): Promise<Config> {
  const configModule = await import(configPath, {
    with: { type: "json" },
  });
  const config = configModule.default;

  const columns: Columns[] = config.columns.map((col: string) => {
    if (!Object.values(Columns).includes(col as Columns)) {
      throw new Error(`Unknown column in config: ${col}`);
    }
    return col as Columns;
  });

  const resultConfig: Config = {
    columns,
    ...config,
  };

  return resultConfig;
}
