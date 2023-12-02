{ pkgs }: {
    deps = [
        pkgs.esbuild
        pkgs.nodejs-18_x
        pkgs.jdk

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}