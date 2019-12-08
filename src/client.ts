// @ts-ignore
import Client from "ssh2-sftp-client";

enum Type {
  ERROR,
  INIT
}

export default class SftpClient {
  public sftp!: any;
  private readyCallback?(): void;
  private readyPromise?: Promise<void>;
  private retry?(): void;

  constructor(private option: any) {
    // const reconnect = () => {
    // console.log("reconnecting");
    // this.connect("error");
    // };
    this.sftp = new Client();
    const delay = (e: any) => {
      console.log(e);
      // setTimeout(reconnect);
    };
    this.sftp.on("error", delay);
  }

  public readonly ready = () => {
    if (!this.readyPromise) {
      this.readyPromise = new Promise(resolve => {
        this.readyCallback = resolve;
        this.connect(Type.INIT);
      });
    }
    return this.readyPromise;
  };

  private readonly reconnect = async () => {
    console.log("reconnecting");
    this.connect(Type.ERROR);
  };

  private connect = (type: Type) => {
    this.sftp
      .connect(this.option)
      .then(() => {
        console.log("server connected");
        if (typeof this.readyCallback === "function") this.readyCallback();
        if (type === Type.ERROR) {
          if (typeof this.retry === "function") this.retry();
        }
      })
      .catch((e: Error) => {
        console.log("server disconnected by catch", e);
        this.sftp.end().catch();
        this.sftp = new Client();
        setTimeout(this.reconnect, 5000);
      });
  };

  public readonly end = () =>
    this.sftp
      .end()
      .catch()
      .then(() => {
        this.readyPromise = undefined;
        this.readyCallback = undefined;
        console.log("server disconnected by end");
      });

  public readonly setRetryFn = (fn: () => void) => {
    this.retry = fn;
  };
}
