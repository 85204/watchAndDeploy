import Line from "./line";
import SftpClient from "./client";
import { handleUpload } from "./handleUpload";

const nsfw = require("nsfw");
const {
  localPath,
  exclude,
  host,
  include = [""],
  password,
  port,
  remotePath,
  username
} = require("../config").default;

const option = {
  host,
  port,
  username,
  password
};
const line = new Line();
const client = new SftpClient(option);
const { sftp, ready, end, setRetryFn } = client;

setRetryFn(line.retry);

line.setBeforeWork(ready);
line.setAfterWork(end);
process.on("warning", e => console.warn(e.stack));

const commonExclude = require("./commonExclude").default;
const realExclude: Rule[] = [...commonExclude, ...exclude];
type Rule = string | RegExp;

const filter = (filePath: string): boolean => {
  const isExclude =
    realExclude.find(rule =>
      typeof rule === "string" ? filePath.includes(rule) : rule.test(filePath)
    ) !== undefined;
  if (isExclude) return false;
  const isInclude =
    (include as Rule[]).find(rule =>
      typeof rule === "string" ? filePath.includes(rule) : rule.test(filePath)
    ) !== undefined;
  return isInclude;
};

(async () => {
  const watcher: any = await nsfw(
    localPath,
    handleUpload({
      sftp,
      line,
      localPath,
      remotePath,
      filter
    }),
    {
      // debounceMS: 250,
      errorCallback: console.warn
    }
  );
  watcher.start();
  console.log("Watching file changes.");
  // watcher.stop();
})();

