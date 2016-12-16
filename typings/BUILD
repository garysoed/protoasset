package(default_visibility = ["//:internal"])

load("@gs_tools//bazel/ts:defs.bzl", "ts_library")


ts_library(
    name = "typings",
    srcs = glob(['*.d.ts']),
    deps = [
      "//typings/globals/fuse",
    ]
)
