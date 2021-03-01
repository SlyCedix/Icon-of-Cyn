.PHONY: all compile run

all: clean compile

compile: bin/index.js

run: bin/index.js
	node bin/index.js

bin/index.js:
	tsc src/index.ts --resolveJsonModule --esModuleInterop --rootDir ./src --outDir ./bin

clean:
	rm -rf bin