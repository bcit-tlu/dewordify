#!/usr/bin/env bash
# Rewrite asset URLs in the build output for CDN upload and verify the
# rewrite succeeded. Based on sugar-suite's cdn-rewrite-dist.sh, with the
# dist directory parameterized (dewordify builds to dist-web/).
set -euo pipefail

CDN_BASE_URL="${CDN_BASE_URL:?CDN_BASE_URL is required}"
CDN_NAMESPACE="${CDN_NAMESPACE:?CDN_NAMESPACE is required}"
REPO_NAME="${REPO_NAME:?REPO_NAME is required}"
SHORT_SHA="${SHORT_SHA:?SHORT_SHA is required}"
ASSET_EXTENSIONS="${ASSET_EXTENSIONS:?ASSET_EXTENSIONS is required}"
DIST_DIR="${DIST_DIR:-dist-web}"

CDN_URL="${CDN_BASE_URL%/}/${CDN_NAMESPACE}/${REPO_NAME}/${SHORT_SHA}"
EXT_PATTERN="${ASSET_EXTENSIONS//,/|}"
export CDN_URL EXT_PATTERN

echo "Rewriting ${DIST_DIR}/ assets to CDN: ${CDN_URL}"

# HTML rewrite
find "${DIST_DIR}" -type f -name '*.html' | while read -r f; do
  rel="${f#"${DIST_DIR}"/}"
  rel_dir="$(dirname "$rel")"
  [ "$rel_dir" = "." ] && rel_dir=""
  HTML_DIR="$rel_dir" perl -pi -e '
    my $cdn  = $ENV{CDN_URL}  // q{};
    my $exts = $ENV{EXT_PATTERN} // q{};
    my $dir  = $ENV{HTML_DIR}    // q{};
    exit 0 unless $cdn && $exts;

    my $norm = sub {
      my ($p) = @_;
      my @out;
      for my $seg (split m{/+}, $p) {
        next if $seg eq q{} || $seg eq q{.};
        if ($seg eq q{..}) { pop @out if @out; next; }
        push @out, $seg;
      }
      return join q{/}, @out;
    };

    my $pat = qr{(src|href|data-src)=(["\x27])([^"\x27]+\.(?:$exts)(?:[#?][^"\x27]*)?)\2}i;
    s{$pat}{
      my ($attr, $q, $path) = ($1, $2, $3);
      $path =~ s{^\s+|\s+$}{}g;
      if ($path =~ m{://} || ($cdn ne q{} && index($path, $cdn) == 0) || $path =~ m{^(?:[a-zA-Z][a-zA-Z0-9+.+-]*:|//)}) {
        "$attr=$q$path$q";
      } else {
        my $p = $path;
        $p =~ s{^\./}{};
        if ($p =~ m{^/}) { $p =~ s{^/}{}; }
        else { $p = $dir ? "$dir/$p" : $p; }
        $p = $norm->($p);
        "$attr=$q$cdn/$p$q";
      }
    }eg;
  ' "$f"
done

# CSS rewrite
find "${DIST_DIR}" -type f -name '*.css' | while read -r f; do
  rel="${f#"${DIST_DIR}"/}"
  rel_dir="$(dirname "$rel")"
  [ "$rel_dir" = "." ] && rel_dir=""
  CSS_DIR="$rel_dir" perl -pi -e '
    my $cdn  = $ENV{CDN_URL}  // q{};
    my $exts = $ENV{EXT_PATTERN} // q{};
    my $dir  = $ENV{CSS_DIR}     // q{};
    exit 0 unless $cdn && $exts;

    my $norm = sub {
      my ($p) = @_;
      my @out;
      for my $seg (split m{/+}, $p) {
        next if $seg eq q{} || $seg eq q{.};
        if ($seg eq q{..}) { pop @out if @out; next; }
        push @out, $seg;
      }
      return join q{/}, @out;
    };

    my $is_abs = sub {
      my ($p) = @_;
      $p =~ s{^\s+|\s+$}{}g;
      return 1 if $p =~ m{://};
      return 1 if $cdn ne q{} && index($p, $cdn) == 0;
      return $p =~ m{^(?:[a-zA-Z][a-zA-Z0-9+.+-]*:|//|data:)}i;
    };

    my $rewrite = sub {
      my ($path) = @_;
      $path =~ s{^\s+|\s+$}{}g;
      return $path if $is_abs->($path);
      my $p = $path;
      $p =~ s{^\./}{};
      if ($p =~ m{^/}) { $p =~ s{^/}{}; }
      else { $p = $dir ? "$dir/$p" : $p; }
      $p = $norm->($p);
      return "$cdn/$p";
    };

    my $url_pat = qr{url\(\s*(["\x27]?)([^"\x27\)]+\.(?:$exts)(?:[#?][^"\x27\)]*)?)\1\s*\)}i;
    s{$url_pat}{
      my ($q, $path) = ($1, $2);
      my $new = $rewrite->($path);
      "url(" . ($q // q{}) . $new . ($q // q{}) . ")";
    }eg;

    my $import_pat = qr{\@import\s+(?:url\()?(["\x27]?)([^"\x27\)]+\.(?:$exts)(?:[#?][^"\x27\)]*)?)\1\)?}i;
    s{$import_pat}{
      my ($q, $path) = ($1, $2);
      my $new = $rewrite->($path);
      "\@import " . ($q // q{}) . $new . ($q // q{});
    }eg;
  ' "$f"
done

# JS rewrite
find "${DIST_DIR}" -type f -name '*.js' | while read -r f; do
  rel="${f#"${DIST_DIR}"/}"
  rel_dir="$(dirname "$rel")"
  [ "$rel_dir" = "." ] && rel_dir=""
  JS_DIR="$rel_dir" perl -pi -e '
    my $cdn  = $ENV{CDN_URL}  // q{};
    my $exts = $ENV{EXT_PATTERN} // q{};
    my $dir  = $ENV{JS_DIR}      // q{};
    exit 0 unless $cdn && $exts;

    my $norm = sub {
      my ($p) = @_;
      my @out;
      for my $seg (split m{/+}, $p) {
        next if $seg eq q{} || $seg eq q{.};
        if ($seg eq q{..}) { pop @out if @out; next; }
        push @out, $seg;
      }
      return join q{/}, @out;
    };

    my $is_abs = sub {
      my ($p) = @_;
      $p =~ s{^\s+|\s+$}{}g;
      return 1 if $p =~ m{://};
      return 1 if $cdn ne q{} && index($p, $cdn) == 0;
      return $p =~ m{^(?:[a-zA-Z][a-zA-Z0-9+.+-]*:|//|data:)}i;
    };

    my $rewrite = sub {
      my ($path) = @_;
      $path =~ s{^\s+|\s+$}{}g;
      return $path if $is_abs->($path);
      my $p = $path;
      $p =~ s{^\./}{};
      if ($p =~ m{^/}) { $p =~ s{^/}{}; }
      else { $p = $dir ? "$dir/$p" : $p; }
      $p = $norm->($p);
      return "$cdn/$p";
    };

    my $str_pat = qr{(["\x27])([^"\x27]+?\.(?:$exts)(?:[#?][^"\x27]*)?)\1}i;
    s{$str_pat}{
      my ($q, $path) = ($1, $2);
      my $new = $rewrite->($path);
      $q . $new . $q;
    }eg;
  ' "$f"
done

echo "CDN rewrite complete."

# Verify the rewrite actually injected the immutable CDN URL into files that
# contain asset references. Vendor files that reference no assets do not need
# rewriting, so skip them.
asset_ref_regex="\.(${EXT_PATTERN})([#?][^\"'\)]*)?([\"'\)]|$)"
missing_files=$(find "${DIST_DIR}/" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) | while read -r f; do
  if grep -qE "${asset_ref_regex}" "$f" && ! grep -qF "${CDN_URL}/" "$f"; then
    printf '%s\n' "$f"
  fi
done)
if [ -n "${missing_files}" ]; then
  echo "ERROR: rewrite did not inject ${CDN_URL}/ into the following files:" >&2
  echo "${missing_files}" >&2
  exit 1
fi

# Verify completeness: flag asset references that were left un-rewritten in
# any scanned file (mixed rewritten + untouched references must not pass).
# A reference is considered left alone when it is relative — no scheme://,
# protocol-relative //, scheme:, data:, or the CDN URL prefix.
partial_files=$(find "${DIST_DIR}/" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) | while read -r f; do
  case "$f" in
    *.css)  KIND=css ;;
    *.html) KIND=html ;;
    *)      KIND=js ;;
  esac
  KIND="$KIND" perl -ne '
    my $cdn  = $ENV{CDN_URL}     // q{};
    my $exts = $ENV{EXT_PATTERN} // q{};
    my $kind = $ENV{KIND}        // q{};
    exit 0 unless $cdn && $exts && $kind;

    my $is_abs = sub {
      my ($p) = @_;
      $p =~ s{^\s+|\s+$}{}g;
      return 1 if $p =~ m{://};
      return 1 if $cdn ne q{} && index($p, $cdn) == 0;
      return $p =~ m{^(?:[a-zA-Z][a-zA-Z0-9+.+-]*:|//|data:)}i;
    };

    my @paths;
    if ($kind eq q{html}) {
      while (/(?:src|href|data-src)=(["\x27])([^"\x27]+\.(?:$exts)(?:[#?][^"\x27]*)?)\1/gi) {
        push @paths, $2;
      }
    } elsif ($kind eq q{css}) {
      while (/url\(\s*(["\x27]?)([^"\x27\)]+\.(?:$exts)(?:[#?][^"\x27\)]*)?)\1\s*\)/gi) {
        push @paths, $2;
      }
      while (/\@import\s+(?:url\()?(["\x27]?)([^"\x27\)]+\.(?:$exts)(?:[#?][^"\x27\)]*)?)\1\)?/gi) {
        push @paths, $2;
      }
    } else {
      while (/(["\x27])([^"\x27]+?\.(?:$exts)(?:[#?][^"\x27]*)?)\1/gi) {
        push @paths, $2;
      }
    }
    for my $p (@paths) {
      unless ($is_abs->($p)) {
        print "$.: $p\n";
      }
    }
  ' "$f" | sed "s|^|$f:|"
done)
if [ -n "$partial_files" ]; then
  echo "ERROR: un-rewritten asset references remain (partial rewrite):" >&2
  echo "$partial_files" >&2
  exit 1
fi
