import Line from "./line";
import fs from "fs";

enum EventActions {
  CREATED,
  DELETED,
  MODIFIED,
  RENAMED
}

export type Deps = {
  sftp: any;
  line: Line;
  localPath: string;
  remotePath: string;
  filter(filePath: string): boolean;
};

type BaseFileChangeEvent = {
  action: EventActions;
  directory: string;
};

interface FileCreateEvent extends BaseFileChangeEvent {
  action: EventActions.CREATED;
  file: string;
}

interface FileModifyEvent extends BaseFileChangeEvent {
  action: EventActions.MODIFIED;
  file: string;
}

interface FileDeleteEvent extends BaseFileChangeEvent {
  action: EventActions.DELETED;
  file: string;
}

interface FileRenameEvent extends BaseFileChangeEvent {
  action: EventActions.RENAMED;
  oldFile: string;
  newDirectory: string;
  newFile: string;
}

type FileChangeEvent =
  | FileCreateEvent
  | FileDeleteEvent
  | FileModifyEvent
  | FileRenameEvent;

export const handleUpload = ({
  sftp,
  line,
  localPath,
  remotePath,
  filter
}: Deps) => {
  const catchError = (e: Error) => {
    console.log(e);
    // 非网络错误，无视掉就好
    line.next();
  };

  return (evtList: FileChangeEvent[]) => {
    evtList.forEach(evt => {
      if (evt.action === EventActions.DELETED) {
        const filePath = `${evt.directory}/${evt.file}`;
        if (!filter(filePath)) return;
        console.log(filePath, EventActions[evt.action]);
        const work = async () => {
          try {
            await sftp.delete(filePath.replace(localPath, remotePath));
            line.next();
          } catch (e) {
            sftp
              .rmdir(filePath.replace(localPath, remotePath), true)
              .then(line.next)
              .catch(catchError);
          }
        };
        line.push(work);
      }

      if (
        evt.action === EventActions.CREATED ||
        evt.action === EventActions.MODIFIED
      ) {
        const filePath = `${evt.directory}/${evt.file}`;
        if (!filter(filePath)) return;
        console.log(filePath, EventActions[evt.action]);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const work = async () => {
            try {
              await mkdir(
                sftp,
                filePath.replace(localPath, remotePath).split("/")
              );
              line.next();
            } catch (e) {
              catchError(e);
            }
          };
          line.push(work);
        } else {
          const work = async () => {
            try {
              const dir = evt.directory.replace(localPath, remotePath).split("/");
              await mkdir(sftp, dir);
              await sftp.fastPut(
                filePath,
                filePath.replace(localPath, remotePath)
              );
              line.next();
            } catch (e) {
              catchError(e);
            }
          };
          line.push(work);
        }
      }

      if (evt.action === EventActions.RENAMED) {
        const oldFilePath = `${evt.directory}/${evt.oldFile}`;
        const newFilePath = `${evt.newDirectory}/${evt.newFile}`;
        if (!filter(oldFilePath)) return;
        console.log(oldFilePath, newFilePath, EventActions[evt.action]);
        const work = async () => {
          try {
            await sftp.rename(
              oldFilePath.replace(localPath, remotePath),
              newFilePath.replace(localPath, remotePath)
            );
            line.next();
          } catch (e) {
            catchError(e);
          }
        };
        line.push(work);
      }
    });
  };
};

async function isDirExist(sftp: any, path: string) {
  try {
    console.log('detect path:', path);
    return await sftp.list(path);
  } catch (e) {
    // console.warn(e);
    return false;
  }
}

async function mkdir(sftp: any, dirPathList: string[]) {
  const existDirPath = dirPathList.slice();
  // console.log(await isDirExist(sftp, existDirPath.join("/")));
  const mkdirList: string[] = [];
  while (!await isDirExist(sftp, existDirPath.join("/"))) {
    const dirName = existDirPath.pop();
    if (dirName) {
      mkdirList.unshift(dirName);
    }
  }
  for (const dirName of mkdirList) {
    existDirPath.push(dirName);
    await sftp.mkdir(existDirPath.join("/"));
  }
}
