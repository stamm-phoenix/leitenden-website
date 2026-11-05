#!/usr/bin/env bash
# Adds or removes the login callback of a preview in the app registration website-astro, which
# leaders sign in with (src/lib/server/login.ts). Same approach as in website-astro, for the
# hosts of this Container App.
#
# Usage: entra-preview-redirect.sh add <pr-number>
#        entra-preview-redirect.sh remove <pr-number>
#
# Needs a logged-in Azure CLI and ENTRA_WEBSITE_APP_OBJECT_ID and PREVIEW_DOMAIN
# (e.g. proudfield-37525178.germanywestcentral.azurecontainerapps.io).
set -euo pipefail

action="${1:?action (add|remove) missing}"
pr="${2:?PR number missing}"
app="${ENTRA_WEBSITE_APP_OBJECT_ID:?ENTRA_WEBSITE_APP_OBJECT_ID missing}"
domain="${PREVIEW_DOMAIN:?PREVIEW_DOMAIN missing}"

if [[ ! "$pr" =~ ^[1-9][0-9]{0,5}$ ]]; then
  echo "::error::Unexpected PR number: $pr"
  exit 1
fi
if [[ ! "$domain" =~ ^[a-z0-9-]+(\.[a-z0-9-]+)*\.azurecontainerapps\.io$ ]]; then
  echo "::error::Unexpected domain: $domain"
  exit 1
fi
uri="https://leitenden-website---pr-$pr.$domain/.auth/login/aad/callback"

case "$action" in
  add)
    filter='. + [$uri] | unique'
    check='index($uri) != null'
    ;;
  remove)
    filter='map(select(. != $uri))'
    check='index($uri) == null'
    ;;
  *)
    echo "::error::Unknown action: $action"
    exit 1
    ;;
esac

current_uris() {
  az ad app show --id "$app" --query 'web.redirectUris' -o json
}

# Graph replaces the whole list on update; runs of website-astro change the same list, so read
# back and retry until it sticks.
for attempt in 1 2 3 4 5; do
  uris="$(current_uris)"
  if jq -e --arg uri "$uri" "$check" <<<"$uris" >/dev/null; then
    echo "Redirect URIs up to date ($action $uri)."
    exit 0
  fi
  mapfile -t updated < <(jq -r --arg uri "$uri" "$filter | .[]" <<<"$uris")
  echo "Attempt $attempt: $action $uri"
  az ad app update --id "$app" --web-redirect-uris "${updated[@]}"
  sleep $((attempt * 3))
done

if jq -e --arg uri "$uri" "$check" <<<"$(current_uris)" >/dev/null; then
  echo "Redirect URIs up to date ($action $uri)."
  exit 0
fi
echo "::error::Could not $action redirect URI $uri"
exit 1
