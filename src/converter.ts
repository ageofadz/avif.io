import _ from "lodash";

export interface ConversionResult {
  data: Uint8Array;
}

export interface ConversionOptions {
  inputData: ArrayBuffer;
  effort: number; // Conversion effort as a 0-100 percentage
  quality: number; // Quality as a 0-100 percentage
  useYuv444: boolean;
  keepTransparency: boolean;
  isRawRgba?: boolean;
  width?: number;
  height?: number;

  onProgress(progress: number): void;

  onFinished(result: ConversionResult): void;

  onError(error: string): void;
}

interface ConversionWorker {
  worker: Worker;
  conversionId?: ConversionId;
}

interface Conversion {
  options: ConversionOptions;
  id: ConversionId;
}

export class ConversionId {
  constructor(readonly value: number) {}
}

export default class Converter {
  private workers: readonly ConversionWorker[];
  private pendingConversions: Conversion[] = [];
  private lastConversionId: number = 0;

  constructor() {
    const numWorkers = Math.max(
      1,
      Math.floor(navigator.hardwareConcurrency / 2)
    );
    this.workers = _.range(numWorkers).map(Converter.createWorker);
  }

  private static createWorker(): ConversionWorker {
    return {
      worker: new Worker("worker.js"),
    };
  }

  convertFile(options: ConversionOptions): ConversionId {
    const conversionId = new ConversionId(this.lastConversionId);
    this.lastConversionId++;
    this.pendingConversions.push({ options, id: conversionId });
    this.tryConvertingFiles();
    return conversionId;
  }

  cancelConversion(conversionId: ConversionId) {
    this.cancelPendingConversion(conversionId);
    this.cancelOngoingConversion(conversionId);
  }

  private tryConvertingFiles(): void {
    if (_.isEmpty(this.pendingConversions)) return;

    const worker = this.getAvailableWorker();
    if (worker === undefined) return;

    const { options, id: conversionId } = this.pendingConversions.shift();
    worker.conversionId = conversionId;

    worker.worker.onmessage = (msg) => {
      switch (msg.data.type) {
        case "progress":
          options.onProgress(msg.data.progress);
          break;
        case "finished":
          options.onFinished({
            data: msg.data.data,
          });
          worker.conversionId = undefined;
          this.tryConvertingFiles();
          break;
        case "error":
          options.onError(msg.data.error);
          worker.conversionId = undefined;
          this.tryConvertingFiles();
          break;
      }
    };

    worker.worker.postMessage(
      {
        type: "start",
        input: options.inputData,
        isRawRgba: options.isRawRgba,
        effort: options.effort,
        quality: options.quality,
        useYuv444: options.useYuv444,
        keepTransparency: options.keepTransparency,
        width: options.width,
        height: options.height,
      },
      [options.inputData]
    );
  }

  private getAvailableWorker(): ConversionWorker {
    for (const worker of this.workers) {
      if (worker.conversionId === undefined) return worker;
    }

    return undefined;
  }

  private cancelPendingConversion(conversionId: ConversionId) {
    this.pendingConversions = this.pendingConversions.filter(
      (conversion) => conversion.id.value !== conversionId.value
    );
  }

  private cancelOngoingConversion(conversionId: ConversionId) {
    this.workers = this.workers.map((worker) => {
      if (worker.conversionId?.value === conversionId.value) {
        worker.worker.terminate();
        return Converter.createWorker();
      } else {
        return worker;
      }
    });
  }
}
