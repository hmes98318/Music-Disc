{ pkgs }: {
    deps = [
        pkgs.esbuild
        pkgs.nodejs-22_x
        pkgs.jdk

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}