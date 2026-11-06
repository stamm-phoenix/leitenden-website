#!/usr/bin/env bash
# Deploys the app to the Container App in multiple revision mode (as in playwright-api):
#
#   container-app.sh main <image> <suffix>             new revision gets all production traffic
#   container-app.sh preview <pr> <image> <suffix>     new revision behind the label pr-<pr>, no traffic
#   container-app.sh remove-preview <pr>               label, revisions and images of the PR go away
#
# Needs RESOURCE_GROUP, CONTAINER_APP and, for remove-preview, ACR_NAME in the environment.
# A preview revision gets PREVIEW_DATABASE and PREVIEW_CONTAINER (src/lib/server/deployment.ts);
# a production revision must never have them. The main deployment also gives the timer jobs the
# new image (timer-jobs.sh); previews never touch them.
set -euo pipefail

rg="$RESOURCE_GROUP"
app="$CONTAINER_APP"
PREVIEW_VARS=(PREVIEW_DATABASE PREVIEW_CONTAINER)

active_revisions() {
  az containerapp revision list -g "$rg" -n "$app" --query "[?properties.active].name" -o tsv
}

# Revisions that carry a label (previews) or traffic (production) stay active
used_revisions() {
  az containerapp ingress traffic show -g "$rg" -n "$app" \
    --query "[?label != null || weight > \`0\`].revisionName" -o tsv
}

revision_env() {
  az containerapp revision show -g "$rg" -n "$app" --revision "$1" \
    --query "properties.template.containers[0].env[].name" -o tsv
}

deploy_main() {
  local image="$1" suffix="$2" revision="$app--$2" used weight var min
  # The template carries the variables and scale of the last deployed revision, which may be a
  # preview. Production always keeps one replica running: a start from zero takes about 20 s.
  az containerapp update -g "$rg" -n "$app" --image "$image" --revision-suffix "$suffix" \
    --remove-env-vars "${PREVIEW_VARS[@]}" --min-replicas 1 --only-show-errors -o none
  min="$(az containerapp revision show -g "$rg" -n "$app" --revision "$revision" \
    --query "properties.template.scale.minReplicas" -o tsv)"
  if [ "$min" != "1" ]; then
    echo "::error::Production revision $revision has minReplicas $min instead of 1"
    exit 1
  fi
  for var in "${PREVIEW_VARS[@]}"; do
    if revision_env "$revision" | grep -qxF "$var"; then
      echo "::error::Production revision $revision has $var; it would use a preview database"
      az containerapp revision deactivate -g "$rg" -n "$app" --revision "$revision" --only-show-errors -o none
      exit 1
    fi
  done
  az containerapp ingress traffic set -g "$rg" -n "$app" --revision-weight "$revision=100" --only-show-errors -o none

  weight="$(az containerapp ingress traffic show -g "$rg" -n "$app" --query "[?revisionName=='$revision'].weight | [0]" -o tsv)"
  if [ "$weight" != "100" ]; then
    echo "::error::Revision $revision got $weight % instead of 100 % of the traffic"
    exit 1
  fi

  # Older production revisions get no traffic any more
  used="$(used_revisions)"
  for old in $(active_revisions); do
    if [ "$old" != "$revision" ] && ! grep -qxF "$old" <<< "$used"; then
      az containerapp revision deactivate -g "$rg" -n "$app" --revision "$old" --only-show-errors -o none
    fi
  done

  # The timers run the code of production from their next execution on
  "$(dirname "$0")/timer-jobs.sh" image "$image"
}

deploy_preview() {
  local pr="$1" image="$2" suffix="$3" revision="$app--$3" label="pr-$1" fqdn
  # Previews scale to zero when nobody uses them
  az containerapp update -g "$rg" -n "$app" --image "$image" --revision-suffix "$suffix" \
    --set-env-vars "PREVIEW_DATABASE=leitende-pr-$pr" "PREVIEW_CONTAINER=leitende-pr-$pr" \
    --min-replicas 0 --only-show-errors -o none
  az containerapp revision label add -g "$rg" -n "$app" --label "$label" --revision "$revision" \
    --no-prompt --yes --only-show-errors -o none

  # Earlier revisions of this PR
  for old in $(active_revisions); do
    if [ "$old" != "$revision" ] && [[ "$old" == "$app--pr$pr-"* ]]; then
      az containerapp revision deactivate -g "$rg" -n "$app" --revision "$old" --only-show-errors -o none
    fi
  done

  # <app>.<environment domain> becomes <app>---<label>.<environment domain>
  fqdn="$(az containerapp show -g "$rg" -n "$app" --query properties.configuration.ingress.fqdn -o tsv)"
  echo "host=${fqdn/./---$label.}" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "url=https://${fqdn/./---$label.}/leitendenbereich" >> "${GITHUB_OUTPUT:-/dev/null}"
}

remove_preview() {
  local pr="$1" label="pr-$1"
  if az containerapp ingress traffic show -g "$rg" -n "$app" --query "[?label=='$label'].label" -o tsv | grep -q .; then
    az containerapp revision label remove -g "$rg" -n "$app" --label "$label" --only-show-errors -o none
  fi
  for old in $(active_revisions); do
    if [[ "$old" == "$app--pr$pr-"* ]]; then
      az containerapp revision deactivate -g "$rg" -n "$app" --revision "$old" --only-show-errors -o none
    fi
  done
  for tag in $(az acr repository show-tags -n "$ACR_NAME" --repository "$app" -o tsv | grep "^pr$pr-" || true); do
    az acr repository delete -n "$ACR_NAME" --image "$app:$tag" --yes --only-show-errors -o none \
      || echo "::warning::Could not delete $app:$tag"
  done
}

case "${1:-}" in
  main) deploy_main "$2" "$3" ;;
  preview) deploy_preview "$2" "$3" "$4" ;;
  remove-preview) remove_preview "$2" ;;
  *) echo "usage: $0 main|preview|remove-preview …" >&2; exit 2 ;;
esac
