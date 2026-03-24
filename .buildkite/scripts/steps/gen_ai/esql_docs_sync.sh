#!/usr/bin/env bash
set -euo pipefail

report_main_step () {
  echo "--- $1"
}

main () {
  report_main_step "Bootstrap Kibana"


  report_main_step "Loading ES|QL documentation"


  docs_dir="x-pack/platform/plugins/shared/inference/server/tasks/nl_to_esql/esql_docs"
  set +e
  git diff --exit-code --quiet "$docs_dir"
  if [ $? -eq 0 ]; then
    echo "No differences found. Our work is done here."
    exit
  fi
  set -e

  report_main_step "Differences found. Checking for an existing pull request."

  KIBANA_MACHINE_USERNAME="kibanamachine"
  git config --global user.name "$KIBANA_MACHINE_USERNAME"
  git config --global user.email '42973632+kibanamachine@users.noreply.github.com'

  PR_TITLE='[ES|QL] Update documentation'
  PR_BODY='This PR updates the ES|QL documentation files generated from the built-docs repository.'

  pr_search_result=$(gh pr list --search "$PR_TITLE" --state open --author "$KIBANA_MACHINE_USERNAME"  --limit 1 --json title -q ".[].title")

  if [ "$pr_search_result" == "$PR_TITLE" ]; then
    echo "PR already exists. Exiting."
    exit
  fi

  echo "No existing PR found. Proceeding."

  BRANCH_NAME="esql_docs_sync_$(date +%s)"

  git checkout -b "$BRANCH_NAME"

  git add "$docs_dir"
  git commit -m "Update ES|QL documentation"

  report_main_step "Changes committed. Creating pull request."

  git push origin "$BRANCH_NAME"

  gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main --head "${BRANCH_NAME}" --label 'release_note:skip' --label 'Team:AI'
}

main
