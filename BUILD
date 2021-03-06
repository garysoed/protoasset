package(default_visibility = ["//:internal"])

load("@gs_tools//bazel/karma:defs.bzl", "karma_run")
load("@gs_tools//bazel/typescript:defs.bzl", "ts_binary", "ts_library")
load("@gs_tools//bazel/webpack:defs.bzl", "webpack_binary")

package_group(
    name = "internal",
    packages = ["//..."]
)

ts_library(
    name = "lib_js",
    srcs = [],
    deps = [
        "//src/main"
    ]
)

ts_library(
    name = "render_lib_js",
    srcs = [],
    deps = [
        "//src/render",
    ]
)

ts_binary(
    name = "bin_js",
    deps = [":lib_js"],
)
webpack_binary(
    name = "pack_js",
    package = ":bin_js",
    entry = "src/main/exports.js",
)

ts_binary(
    name = "render_bin_js",
    deps = [":render_lib_js"]
)
webpack_binary(
    name = "render_pack",
    package = ":render_bin_js",
    entry = "src/render/exports.js",
)

filegroup(
    name = "tslint_config",
    srcs = ["tslint.json"]
)

karma_run(
    name = "test",
    srcs = [
        "//src/asset:test_src",
        "//src/common:test_src",
        "//src/data:test_src",
        "//src/landing:test_src",
        "//src/project:test_src",
        "//src/render:test_src",
        "//src/routing:test_src",
    ]
)

test_suite(
    name = "lint",
    tests = [
        "//src/asset:lint",
        "//src/common:lint",
        "//src/data:lint",
        "//src/landing:lint",
        "//src/project:lint",
        "//src/render:lint",
        "//src/routing:lint",
    ]
)

filegroup(
    name = "pack_template",
    srcs = [
        "@gs_ui//:pack_template",
        "//src/asset:template",
        "//src/common:template",
        "//src/landing:template",
        "//src/project:template",
    ]
)

genrule(
    name = "pack",
    srcs = [
        "//:pack_js",
        "//:pack_template",
    ],
    outs = ["pack.js"],
    cmd = "awk 'FNR==1{print \"\"}1' $(SRCS) > $@",
)
