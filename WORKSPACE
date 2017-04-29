local_repository(
    name = "gs_tools",
    path = "./external/gs_tools",
)

local_repository(
    name = "gs_ui",
    path = "./external/gs_ui",
)

new_local_repository(
    name = "karma",
    path = "./node_modules/karma",
    build_file = "external/gs_tools/bazel/karma/karma.BUILD",
)

new_local_repository(
    name = "tslint",
    path = "./node_modules/tslint",
    build_file = "external/gs_tools/bazel/tslint/tslint.BUILD",
)

new_local_repository(
    name = "typescript",
    path = "./node_modules/typescript",
    build_file = "external/gs_tools/bazel/typescript/typescript.BUILD",
)

new_local_repository(
    name = "webpack",
    path = "./node_modules/webpack",
    build_file = "external/gs_tools/bazel/webpack/webpack.BUILD",
)

git_repository(
    name = "io_bazel_rules_sass",
    remote = "https://github.com/bazelbuild/rules_sass.git",
    tag = "0.0.1",
)
load("@io_bazel_rules_sass//sass:sass.bzl", "sass_repositories")
sass_repositories()
