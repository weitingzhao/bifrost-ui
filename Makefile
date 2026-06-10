.PHONY: install type-check

install:
	npm install

type-check: install
	npm run type-check --if-present || npx tsc --noEmit
