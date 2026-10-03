#!/bin/bash
# Thin entrypoint for the UK data lab grow loop.
# Shared logic lives in code/open-data/nz-usa-uk-data-stack/loops/loop-wrapper.sh.
exec "$HOME/code/open-data/nz-usa-uk-data-stack/loops/loop-wrapper.sh" \
  "$HOME/code/open-data/uk-open-data-lab" \
  "$HOME/code/open-data/uk-open-data-lab/scripts/grow-loop-prompt.txt" \
  "$HOME/code/open-data/uk-open-data-lab/scripts/heal-grow-loop-prompt.txt" \
  uk-open-data-lab
