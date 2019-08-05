import Line from "./line";
import SftpClient from "./client";
import { handleUpload } from "./handleUpload";

const nsfw = require("nsfw");
const fs = require("fs");
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
// const catchError = (e: Error) => {
//   console.log(e);
//   // 非网络错误，无视掉就好
//   line.next();
// };
//
// const actions = {
//   CREATED: 0,
//   DELETED: 1,
//   MODIFIED: 2,
//   RENAMED: 3
// } as const;
//
// const handleUpload = (evt: FileChangeEvent, filePath: string) => {
//   console.log("%s %s.", filePath, evt);
//
//   if (evt === "remove") {
//     const work = async () => {
//       try {
//         await sftp.delete(filePath.replace(localPath, remotePath));
//         line.next();
//       } catch (e) {
//         sftp
//           .rmdir(filePath.replace(localPath, remotePath), true)
//           .then(line.next)
//           .catch(catchError);
//       }
//     };
//     line.push(work);
//   }
//
//   if (evt === "update") {
//     const stat = fs.statSync(filePath);
//     if (stat.isDirectory()) {
//       const work = async () => {
//         try {
//           await sftp.mkdir(filePath.replace(localPath, remotePath), true);
//           line.next();
//         } catch (e) {
//           catchError(e);
//         }
//       };
//       line.push(work);
//     } else {
//       const work = async () => {
//         try {
//           await sftp.fastPut(filePath, filePath.replace(localPath, remotePath));
//           line.next();
//         } catch (e) {
//           catchError(e);
//         }
//       };
//       line.push(work);
//     }
//   }
// };

const commonExclude = require("./commonExclude").default;
const realExclude: Rule[] = [...commonExclude, ...exclude];
type FileChangeEvent = "remove" | "update";
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

// watch(localPath, { recursive: true, filter }, handleUpload);
