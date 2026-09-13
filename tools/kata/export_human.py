"""Export KataGo's human-style network (b18c384nbt-humanv0) to ONNX for the browser.

Usage (from the repo root, with a venv that has torch, onnx, onnxruntime, numpy):

    python tools/kata/export_human.py --katago <path to KataGo checkout> \
        --ckpt b18c384nbt-humanv0.ckpt --out models/humanv0

Writes:
    <out>.fp32.onnx   full precision (reference)
    <out>.fp16w.onnx  fp16 weights, fp32 compute: half the download, runs on the
                      WebAssembly backend, which has no fp16 kernels

Inputs:  bin [B,22,H,W] float, global [B,19] float, meta [B,192] float
Outputs: policy [B, H*W+1] logits (last entry is pass), value [B,3] logits
Only the primary policy head is exported; the network's other heads are dropped.
"""
import argparse
import os
import sys

import numpy as np
import torch


def build_wrapper(model):
    class Wrap(torch.nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m

        def forward(self, bin_input, global_input, meta_input):
            outs = self.m(bin_input, global_input, input_meta=meta_input)
            # outputs_byheads: tuple of head tuples; the first head is the main one
            head = outs[0]
            policy = head[0][:, 0, :]
            value = head[1]
            return policy, value

    return Wrap(model).eval()


def to_fp16_weights(model_path, out_path, min_elems=64):
    """Store float32 initializers as float16 and cast them back at run time."""
    import onnx
    from onnx import TensorProto, helper, numpy_helper

    model = onnx.load(model_path)
    graph = model.graph
    new_inits = []
    casts = []
    for init in graph.initializer:
        arr = numpy_helper.to_array(init)
        if init.data_type == TensorProto.FLOAT and arr.size >= min_elems:
            half_name = init.name + "__fp16"
            new_inits.append(numpy_helper.from_array(arr.astype(np.float16), name=half_name))
            casts.append(helper.make_node("Cast", [half_name], [init.name], to=TensorProto.FLOAT,
                                          name="cast__" + init.name))
        else:
            new_inits.append(init)
    del graph.initializer[:]
    graph.initializer.extend(new_inits)
    # Casts must come before their consumers; prepending keeps topological order.
    nodes = list(graph.node)
    del graph.node[:]
    graph.node.extend(casts + nodes)
    onnx.checker.check_model(model)
    onnx.save(model, out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--katago", required=True, help="KataGo repo checkout (for python/katago)")
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--out", required=True, help="output path prefix")
    ap.add_argument("--size", type=int, default=9, help="board size used for the export trace")
    args = ap.parse_args()

    sys.path.insert(0, os.path.join(args.katago, "python"))
    from katago.train.load_model import load_model

    model, swa_model, _ = load_model(args.ckpt, use_swa=False, device="cpu", pos_len=19, verbose=False)
    try:
        _, swa_model, _ = load_model(args.ckpt, use_swa=True, device="cpu", pos_len=19, verbose=False)
        if swa_model is not None:
            print("using SWA weights")
            model = swa_model
    except Exception as e:  # noqa: BLE001
        print("no SWA weights:", e)
    model.eval()
    wrap = build_wrapper(model)

    n = args.size
    bin_input = torch.zeros(1, 22, n, n)
    bin_input[:, 0] = 1.0
    global_input = torch.zeros(1, 19)
    meta_input = torch.zeros(1, 192)

    fp32 = args.out + ".fp32.onnx"
    os.makedirs(os.path.dirname(fp32) or ".", exist_ok=True)
    torch.onnx.export(
        wrap, (bin_input, global_input, meta_input), fp32,
        input_names=["bin", "global", "meta"], output_names=["policy", "value"],
        dynamic_axes={
            "bin": {0: "batch", 2: "height", 3: "width"},
            "global": {0: "batch"}, "meta": {0: "batch"},
            "policy": {0: "batch", 1: "moves"}, "value": {0: "batch"},
        },
        opset_version=17, dynamo=False,
    )
    print("wrote", fp32, os.path.getsize(fp32) // 1_000_000, "MB")

    fp16w = args.out + ".fp16w.onnx"
    to_fp16_weights(fp32, fp16w)
    print("wrote", fp16w, os.path.getsize(fp16w) // 1_000_000, "MB")

    # Sanity: torch vs both ONNX files on a random-ish 9x9 and 19x19 input.
    import onnxruntime as ort
    for size in (9, 19):
        b = torch.zeros(1, 22, size, size)
        b[:, 0] = 1.0
        rng = np.random.default_rng(0)
        stones = rng.integers(0, 3, size=(size, size))
        b[0, 1] = torch.tensor(stones == 1, dtype=torch.float32)
        b[0, 2] = torch.tensor(stones == 2, dtype=torch.float32)
        g = torch.zeros(1, 19)
        g[0, 5] = -7.5 / 20
        g[0, 6] = 1.0
        g[0, 7] = 0.5
        m = torch.zeros(1, 192)
        m[0, 0] = 1
        m[0, 1] = 1
        m[0, 6:20] = 1
        m[0, 40:54] = 1
        with torch.no_grad():
            ref_policy, ref_value = wrap(b, g, m)
        for path in (fp32, fp16w):
            sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
            import time
            t0 = time.time()
            pol, val = sess.run(None, {"bin": b.numpy(), "global": g.numpy(), "meta": m.numpy()})
            dt = time.time() - t0
            diff = np.abs(pol - ref_policy.numpy()).max()
            same_top = int(np.argmax(pol) == int(torch.argmax(ref_policy)))
            print(f"{os.path.basename(path)} {size}x{size}: max|dpolicy|={diff:.4f} topMoveAgrees={same_top} "
                  f"value={np.round(val, 3)} {dt*1000:.0f}ms")


if __name__ == "__main__":
    main()
