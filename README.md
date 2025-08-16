# Resourcepack table generator
This project allows you to get all of the item renames from a resourcepack into a csv file.

## Usage
1. Put your resourcepack into input directory.
2. Run `deno run run`.
3. CSV with all renamings from it is now in output/renames.csv

## Config
| Property               | Default                                       | Description |
|------------------------|-----------------------------------------------|-------------|
| *columns*            | *["pack_name", "model", "item_name", "custom_name"]* | Allows you to disable or change order of specific columns    |
| *outputFileName*     | *"renames.csv"*                      | Output file name |
| *langFile*           | *"en_us.json"*                              | Which lang file to use (from ./assets/lang/ )              |
*duplicateKeyFilter* | *["model", "custom_name"]* | Excludes any entry whose *model* and *custom_name* both match an existing record. |