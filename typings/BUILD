package(default_visibility = ["//:internal"])

load("@gs_tools//bazel/typescript:defs.bzl", "ts_library")


ts_library(
    name = "typings",
    srcs = glob(['*.d.ts']),
    deps = [
      "//typings/globals/fuse",
      "//typings/globals/handlebars",
      "//typings/globals/html2canvas",
      "//typings/globals/jszip",
    ]
)
