type Func = () => Promise<void>;

export default class Line {
  private line: Func[] = [];
  // private retryDelay: number = 1000;
  // private retryTimes: number = 0;
  private beforeWork?(): Promise<void>;
  private afterWork?(): Promise<void>;
  private busy?: Promise<void>;

  public push = async (fn: Func) => {
    this.line.push(fn);
    if (this.line.length === 1) {
      if (this.busy) {
        await this.busy;
      }
      if (typeof this.beforeWork === "function") {
        try {
          await this.beforeWork();
          this.line[0]();
        } catch (e) {
          this.retry();
        }
      } else {
        this.line[0]();
      }
    }
  };

  public next = () => {
    this.line.shift();
    if (this.line.length !== 0) {
      this.line[0]();
    } else {
      if (typeof this.afterWork === "function") {
        this.busy = this.afterWork().then(() => {
          console.log("all work finished.");
        });
      } else {
        console.log("all work finished.");
      }
    }
  };

  public retry = () => {
    // setTimeout(() => {
      if (this.line.length !== 0) {
        //   if (this.retryDelay === 0) {
        console.log("retrying");
        //     this.retryTimes++;
        //     this.retryDelay = this.retryTimes ** 2 * 1000;
        //     this.retryDelay = this.retryDelay > 300000 ? 300000 : this.retryDelay;
        this.line[0]();
        // } else {
        //   this.retryDelay -= 1000;
        //   console.log(`next retry in ${this.retryDelay / 1000}s`);
        // }
      }
    // }, 1000);
  };

  public setBeforeWork = (fn: () => Promise<void>) => {
    this.beforeWork = fn;
  };

  public setAfterWork = (fn: () => Promise<void>) => {
    this.afterWork = fn;
  };
}
