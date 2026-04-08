declare const describe: (name: string, fn: () => void | Promise<void>) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const expect: any;
declare const jest: any;
declare const process: {
  env: Record<string, string | undefined>;
};
declare const global: any;

declare namespace jest {
  type Mock = any;
}
