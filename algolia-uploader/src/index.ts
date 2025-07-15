import * as fs from "fs";
import { algoliasearch } from "algoliasearch";
import { ChunkSchema } from "../../chunk-generator/schema";
import assert from "assert";

const ChunkArraySchema = ChunkSchema.array().nonempty();

async function main() {
  const algoliaAppId = process.env["INPUT_ALGOLIA-APP-ID"];
  const algoliaApiKey = process.env["INPUT_ALGOLIA-API-KEY"];
  const algoliaIndexName = process.env["INPUT_ALGOLIA-INDEX-NAME"];
  const chunksFilePath = process.env["INPUT_CHUNKS-FILE-PATH"];
  const siv3dDocsVersion = process.env["INPUT_SIV3D-DOCS-VERSION"];

  if (
    !algoliaAppId ||
    !algoliaApiKey ||
    !algoliaIndexName ||
    !chunksFilePath ||
    !siv3dDocsVersion
  ) {
    console.error(
      "Error: algolia-app-id, algolia-api-key, algolia-index-name, chunks-file-path, and siv3d-docs-version are required"
    );
    process.exit(1);
  }

  const chunks = ChunkArraySchema.parse(
    JSON.parse(fs.readFileSync(chunksFilePath, "utf-8"))
  );
  assert(chunks.every((chunk) => chunk.pageVersion === siv3dDocsVersion));

  const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);

  console.log(`Updating ${chunks.length} chunks to ${algoliaIndexName}`);
  await algoliaClient.partialUpdateObjects({
    indexName: algoliaIndexName,
    waitForTasks: true,
    createIfNotExists: true,
    objects: chunks,
  });

  console.log(`Deleting the old chunks from ${algoliaIndexName}`);
  const deleteByResponse = await algoliaClient.deleteBy({
    indexName: algoliaIndexName,
    deleteByParams: {
      filters: `NOT version:${siv3dDocsVersion}`,
    },
  });
  await algoliaClient.waitForTask({
    indexName: algoliaIndexName,
    taskID: deleteByResponse.taskID,
  });
  console.log("Done");
}

if (require.main === module) {
  main();
}
