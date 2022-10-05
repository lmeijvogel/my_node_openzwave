import { Logger } from "./logger";
import * as OpenZWave from "openzwave-shared";
import { FakeZWave } from "./fake_zwave";

const LOGLEVEL_INFO = 6;

class ZWaveFactory {
    constructor(private testMode: boolean) {
        this.testMode = testMode;
    }

    create(): OpenZWave {
        // Always create real instance, even if it's not going to be used.
        // This makes sure that even in test mode, we can ascertain that the
        // the real library can be compiled correctly, which saves panic fixes at 24:00.
        const realZwave = new OpenZWave({
            SaveConfiguration: false,
            RetryTimeout: 3000,
            SaveLogLevel: LOGLEVEL_INFO,
            QueueLogLevel: LOGLEVEL_INFO,
        });

        const fakeZWave = new FakeZWave();

        if (this.testMode) {
            Logger.info("ZWaveFactory: Creating Fake ZWave");

            return fakeZWave;
        } else {
            Logger.verbose("ZWaveFactory: Creating real ZWave");

            return realZwave;
        }
    }
}

export { ZWaveFactory };
