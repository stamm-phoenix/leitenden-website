#!/usr/bin/env bash
# The timers of website-astro (api/timers/) as Container Apps Jobs with a schedule trigger: each
# run is one execution of one container, however many replicas the web app has, and PR previews
# never run them. The image is the one of the app; src/jobs/timer.ts runs the timer.
#
#   timer-jobs.sh setup <image>   create missing jobs (switch "false"), copy secrets and variables
#                                 of the Container App to every job (admin, by hand)
#   timer-jobs.sh image <image>   every job runs <image> from its next execution (deploy of main)
#
# Needs RESOURCE_GROUP and CONTAINER_APP in the environment. A job runs its timer only when its
# switch is "true"; switch it with
#   az containerapp job update -g <rg> -n <job> --set-env-vars <SWITCH>=true
set -euo pipefail

rg="$RESOURCE_GROUP"
app="$CONTAINER_APP"

# job | timer (app.timer name) | cron in UTC, the NCRONTAB of the timer without seconds | switch
# test/timer-jobs.test.ts checks the schedules against api/timers/ of website-astro.
JOBS=(
  "leitenden-timer-aufgaben|taskReminders|17 * * * *|TASK_REMINDERS_ENABLED"
  "leitenden-timer-leitendenrunde|leitendenrundeReminders|47 * * * *|LEITENDENRUNDE_REMINDERS_ENABLED"
  "leitenden-timer-essensplanung|essensplanungAufbewahrung|23 3 * * *|ESSENSPLANUNG_AUFBEWAHRUNG_ENABLED"
)
# Variables of the app the jobs do not get: the login, the proxy header, preview names (the
# template of the app may be the one of a preview revision) and switches, which each job sets
SKIPPED_VARS='SESSION_SECRET|PROTOCOL_HEADER|PREVIEW_DATABASE|PREVIEW_CONTAINER|[A-Z_]+_ENABLED'
DEPLOY_IDENTITY=leitenden-website-deploy

app_query() {
  az containerapp show -g "$rg" -n "$app" --query "$1" -o tsv
}

# Fails on other errors (e.g. no access) instead of taking the job for missing
job_exists() {
  [ -n "$(az containerapp job list -g "$rg" --query "[?name=='$1'].name" -o tsv)" ]
}

setup() {
  local image="$1" identity environment registry deploy_principal line job timer cron switch
  local secret_list secret_vars plain_vars
  local -a secrets vars
  identity="$(app_query "keys(identity.userAssignedIdentities)[0]")"
  environment="$(app_query "properties.environmentId")"
  registry="$(app_query "properties.configuration.registries[0].server")"
  deploy_principal="$(az identity show -g "$rg" -n "$DEPLOY_IDENTITY" --query principalId -o tsv)"
  # Key Vault references of the app (stamm-phoenix-secrets), read with the runtime identity
  # (assignments, not process substitutions, so that a failing query stops the script)
  secret_list="$(app_query "properties.configuration.secrets[?keyVaultUrl != null].join('', [name, '=keyvaultref:', keyVaultUrl, ',identityref:', identity])")"
  secret_vars="$(app_query "properties.template.containers[0].env[?secretRef != null].join('', [name, '=secretref:', secretRef])")"
  plain_vars="$(app_query "properties.template.containers[0].env[?secretRef == null].join('', [name, '=', value])")"
  mapfile -t secrets < <(grep . <<< "$secret_list" || true)
  mapfile -t vars < <(printf '%s\n%s\n' "$secret_vars" "$plain_vars" | grep . | grep -vE "^($SKIPPED_VARS)=" || true)
  if [ "${#secrets[@]}" -eq 0 ] || [ "${#vars[@]}" -eq 0 ]; then
    echo "::error::No secrets or variables found on $app"
    exit 1
  fi

  for line in "${JOBS[@]}"; do
    IFS='|' read -r job timer cron switch <<< "$line"
    if job_exists "$job"; then
      echo "Updating $job (its switch stays as it is)"
      az containerapp job secret set -g "$rg" -n "$job" --secrets "${secrets[@]}" --only-show-errors -o none
      az containerapp job update -g "$rg" -n "$job" --cron-expression "$cron" \
        --set-env-vars "${vars[@]}" --only-show-errors -o none
    else
      echo "Creating $job with $switch=false"
      # No retry: a timer that failed half way must not send its mails twice
      az containerapp job create -g "$rg" -n "$job" --environment "$environment" \
        --workload-profile-name Consumption \
        --trigger-type Schedule --cron-expression "$cron" \
        --replica-timeout 1800 --replica-retry-limit 0 --parallelism 1 --replica-completion-count 1 \
        --image "$image" --cpu 0.5 --memory 1Gi \
        --command node --args build/jobs/timer.js "$timer" \
        --mi-user-assigned "$identity" --registry-server "$registry" --registry-identity "$identity" \
        --secrets "${secrets[@]}" --env-vars "${vars[@]}" "$switch=false" \
        --only-show-errors -o none
    fi
    # The deployment of main sets the image of the jobs
    az role assignment create --assignee-object-id "$deploy_principal" \
      --assignee-principal-type ServicePrincipal --role Contributor \
      --scope "$(az containerapp job show -g "$rg" -n "$job" --query id -o tsv)" --only-show-errors -o none
  done
}

update_image() {
  local image="$1" line job current args
  for line in "${JOBS[@]}"; do
    job="${line%%|*}"
    if ! job_exists "$job"; then
      echo "::error::Job $job is missing; create it with .github/scripts/timer-jobs.sh setup"
      exit 1
    fi
    az containerapp job update -g "$rg" -n "$job" --image "$image" --only-show-errors -o none
    current="$(az containerapp job show -g "$rg" -n "$job" --query "properties.template.containers[0].image" -o tsv)"
    if [ "$current" != "$image" ]; then
      echo "::error::Job $job runs $current instead of $image"
      exit 1
    fi
    # Without its command the image would start the web server instead of the timer
    args="$(az containerapp job show -g "$rg" -n "$job" --query "properties.template.containers[0].args[0]" -o tsv)"
    if [ "$args" != "build/jobs/timer.js" ]; then
      echo "::error::Job $job starts $args instead of build/jobs/timer.js"
      exit 1
    fi
  done
}

case "${1:-}" in
  setup) setup "${2:?image missing}" ;;
  image) update_image "${2:?image missing}" ;;
  *) echo "usage: $0 setup|image <image>" >&2; exit 2 ;;
esac
