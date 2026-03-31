import Razorpay from "razorpay";

// Lazy singleton — only instantiated at request time so the build doesn't fail
// when RAZORPAY_KEY_ID is absent from the build environment.
let _razorpay: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  }
  return _razorpay;
};

// Keep the named export for any existing callers that do `import { razorpay }`
// but redirect them to the lazy getter so the SDK isn't constructed at import time.
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return (getRazorpay() as any)[prop];
  },
});
