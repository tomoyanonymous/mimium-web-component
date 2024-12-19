import { Context, Config } from "mimium-web";

export class MimiumProcessor extends AudioWorkletProcessor {
  context: Context | null;

  constructor() {
    super();
    this.context = null;
    this.port.onmessage = (e) => {
      switch (e.data.type) {
        case "compile":
          this.compile(e.data.samplerate, e.data.buffersize, e.data.src);
          break;
      }
    };
  }
  public compile(samplerate: number, buffersize: number, src: string) {
    let config = new Config();
    config.sample_rate = samplerate;
    config.output_channels = 1;
    config.buffer_size = buffersize;
    this.context = new Context(config);
    this.context.compile(src);
  }
  public process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameter: Record<string, Float32Array>
  ) {
    const input = inputs[0][0];
    if (this.context) {
      this.context.process(input, outputs[0][0]);
    }
    return true;
  }
}
registerProcessor("MimiumProcessor",MimiumProcessor);
