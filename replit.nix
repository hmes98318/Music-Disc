{ pkgs }: {
    deps = [
        pkgs.esbuild
        pkgs.nodejs-20_x
        pkgs.jdk

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}