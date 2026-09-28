{ pkgs ? import <nixpkgs> {
    config.allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [
      "vault"
    ];
  }
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    kubectl
    kubernetes-helm
    fluxcd
    gh
    kubectx
    kustomize
    oras
    git
    jq
    vault
    nodejs_24
  ];
  shellHook = ''
    # Put the repo's bin/ on PATH so `dewordify` works without a global install.
    # (npm -g would fail anyway: the Nix store is read-only.)
    export PATH="$PWD/bin:$PATH"
    echo "Dewordify dev shell — Node.js $(node --version)"
    echo "Run: npm install && npm run build:cli"
    echo "Then: dewordify file.docx  (or: node bin/dewordify.js file.docx)"
  '';
}
